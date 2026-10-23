import { useCallback, useEffect, useRef, useState } from 'react'
import type { UnlistenFn } from '@tauri-apps/api/event'

import {
  MAX_ACTIVE_TASKS,
  applyPhase,
  applyProgress,
  buildAudioPath,
  buildDownloadPath,
  createTaskFromUrl,
  getStoredTasks,
  isValidSourceUrl,
  saveTasks,
  type DownloadTask,
  type TaskMode,
} from '../lib/downloadQueue'
import {
  cancelTransfer,
  isCancelled,
  isTauri,
  startTransfer,
  watchPhase,
  watchProgress,
  errorMessage,
} from '../lib/transfer'

type AddTaskInput = { url: string; mode: TaskMode; folder: string }

export type AddTaskResult = { ok: true; id: string } | { ok: false; error: string }

type UseDownloadsOptions = {
  onCompleted?: (task: DownloadTask) => void
}

export function useDownloads({ onCompleted }: UseDownloadsOptions = {}) {
  const [tasks, setTasks] = useState<DownloadTask[]>(() => getStoredTasks())
  const tasksRef = useRef<DownloadTask[]>(tasks)
  const runningRef = useRef<Set<string>>(new Set())
  const startRef = useRef<(id: string) => Promise<void>>(async () => {})
  const completedRef = useRef(onCompleted)

  useEffect(() => {
    completedRef.current = onCompleted
  }, [onCompleted])

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const commit = useCallback((updater: (current: DownloadTask[]) => DownloadTask[]) => {
    const next = updater(tasksRef.current)
    tasksRef.current = next
    setTasks(next)
  }, [])

  useEffect(() => {
    let disposed = false
    let stopProgress: UnlistenFn | undefined
    let stopPhase: UnlistenFn | undefined

    void watchProgress((progress) => {
      commit((current) =>
        current.map((task) => (task.id === progress.id ? applyProgress(task, progress) : task)),
      )
    }).then((unlisten) => {
      if (disposed) {
        unlisten()
      } else {
        stopProgress = unlisten
      }
    })

    void watchPhase(({ id, phase }) => {
      commit((current) => current.map((task) => (task.id === id ? applyPhase(task, phase) : task)))
    }).then((unlisten) => {
      if (disposed) {
        unlisten()
      } else {
        stopPhase = unlisten
      }
    })

    return () => {
      disposed = true
      stopProgress?.()
      stopPhase?.()
    }
  }, [commit])

  const pump = useCallback(() => {
    const queued = tasksRef.current.filter(
      (task) => task.status === 'Queued' && !runningRef.current.has(task.id),
    )

    for (const task of queued) {
      if (runningRef.current.size >= MAX_ACTIVE_TASKS) {
        break
      }

      void startRef.current(task.id)
    }
  }, [])

  const startTask = useCallback(
    async (id: string) => {
      const task = tasksRef.current.find((entry) => entry.id === id)
      if (!task || runningRef.current.has(id) || task.status === 'Completed') {
        return
      }

      runningRef.current.add(id)

      const resuming = task.downloadedBytes > 0
      commit((current) =>
        current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'Downloading',
                progress: 0,
                downloadedBytes: 0,
                speed: 0,
                eta: '—',
                message:
                  entry.mode === 'audio'
                    ? 'Téléchargement de la vidéo'
                    : resuming
                      ? 'Reprise depuis le début'
                      : 'Téléchargement en cours',
              }
            : entry,
        ),
      )

      const path =
        task.targetPath ??
        (task.mode === 'audio'
          ? buildAudioPath(task.folder, task.name)
          : buildDownloadPath(task.folder, task.name))

      try {
        const finalPath = await startTransfer({ id, url: task.source, path, mode: task.mode })
        const latest = tasksRef.current.find((entry) => entry.id === id)
        if (!latest) {
          return
        }

        const finished: DownloadTask = {
          ...latest,
          status: 'Completed',
          progress: 100,
          speed: 0,
          eta: '—',
          message: latest.mode === 'audio' ? 'Conversion MP3 terminée' : 'Téléchargement terminé',
          targetPath: finalPath,
          completedAt: Date.now(),
          downloadedBytes: latest.totalBytes > 0 ? latest.totalBytes : latest.downloadedBytes,
        }

        commit((current) => current.map((entry) => (entry.id === id ? finished : entry)))
        completedRef.current?.(finished)
      } catch (error) {
        const cancelled = isCancelled(error)
        commit((current) =>
          current.map((entry) => {
            if (entry.id !== id || entry.status !== 'Downloading') {
              return entry
            }

            return {
              ...entry,
              status: cancelled ? 'Paused' : 'Failed',
              speed: 0,
              eta: '—',
              message: cancelled ? 'En pause' : errorMessage(error),
            }
          }),
        )
      } finally {
        runningRef.current.delete(id)
        pump()
      }
    },
    [commit, pump],
  )

  useEffect(() => {
    startRef.current = startTask
    pump()
  }, [pump, startTask])

  const addTask = useCallback(
    ({ url, mode, folder }: AddTaskInput): AddTaskResult => {
      const source = url.trim()

      if (!source) {
        return { ok: false, error: 'Collez une adresse à télécharger.' }
      }

      if (!isValidSourceUrl(source)) {
        return { ok: false, error: 'Cette adresse doit commencer par http:// ou https://.' }
      }

      if (!isTauri()) {
        return { ok: false, error: 'Les téléchargements passent par l’application desktop.' }
      }

      if (!folder.trim()) {
        return { ok: false, error: 'Choisissez un dossier de destination.' }
      }

      const duplicate = tasksRef.current.find(
        (task) => task.source === source && task.status !== 'Failed',
      )

      if (duplicate) {
        return { ok: false, error: `Cette adresse est déjà dans la liste (${duplicate.name}).` }
      }

      const task = createTaskFromUrl(source, mode, folder)
      commit((current) => [task, ...current])
      void startRef.current(task.id)

      return { ok: true, id: task.id }
    },
    [commit],
  )

  const pauseTask = useCallback(
    async (id: string) => {
      const task = tasksRef.current.find((entry) => entry.id === id)
      if (!task) {
        return
      }

      if (task.status === 'Paused' || task.status === 'Failed') {
        void startTask(id)
        return
      }

      if (task.status === 'Completed') {
        return
      }

      commit((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, status: 'Paused', speed: 0, eta: '—', message: 'En pause' }
            : entry,
        ),
      )

      if (runningRef.current.has(id)) {
        await cancelTransfer(id)
      }
    },
    [commit, startTask],
  )

  const removeTask = useCallback(
    async (id: string) => {
      if (runningRef.current.has(id)) {
        await cancelTransfer(id)
      }

      runningRef.current.delete(id)
      commit((current) => current.filter((task) => task.id !== id))
      pump()
    },
    [commit, pump],
  )

  return { tasks, addTask, startTask, pauseTask, removeTask }
}
