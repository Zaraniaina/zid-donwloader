import { useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import './App.css'
import { DashboardPage } from './pages/DashboardPage'
import { ConverterPage } from './pages/ConverterPage'
import { FoldersPage } from './pages/FoldersPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import {
  MAX_ACTIVE_TASKS,
  advanceDownloadQueue,
  buildAudioPath,
  buildDownloadPath,
  createTaskFromUrl,
  formatBytes,
  getDownloadedBytes,
  getStoredTasks,
  getTotalBytes,
  saveTasks,
  type DownloadTask,
  type TaskMode,
} from './lib/downloadQueue'

type AppPage = 'dashboard' | 'converter' | 'folders' | 'history' | 'settings'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const savedTheme = window.localStorage.getItem('zid-downloader.theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })
  const [tasks, setTasks] = useState<DownloadTask[]>(() => getStoredTasks())
  const [selectedId, setSelectedId] = useState<number>(() => getStoredTasks()[0]?.id ?? 0)
  const [url, setUrl] = useState('')
  const [search, setSearch] = useState('')
  const [destinationFolder, setDestinationFolder] = useState<string>('Downloads')
  const [mode, setMode] = useState<TaskMode>('download')
  const [activePage, setActivePage] = useState<AppPage>('dashboard')
  const downloadControllersRef = useRef<Map<number, AbortController>>(new Map())

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('zid-downloader.theme', theme)
    }
  }, [theme])

  useEffect(() => {
    if (tasks.length > 0 && !tasks.some((task) => task.id === selectedId)) {
      setSelectedId(tasks[0].id)
    }
  }, [selectedId, tasks])

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? tasks[0]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTasks((currentTasks) => advanceDownloadQueue(currentTasks))
    }, 2200)

    return () => window.clearInterval(timer)
  }, [])

  const handleAddTask = () => {
    if (!url.trim()) {
      return
    }

    const newTask = createTaskFromUrl(url, mode)

    setTasks((currentTasks) => [newTask, ...currentTasks])
    setSelectedId(newTask.id)
    setUrl('')
  }

  const handleChooseFolder = async () => {
    try {
      const chosen = await open({
        directory: true,
        multiple: false,
        defaultPath: destinationFolder,
      })

      if (typeof chosen === 'string') {
        setDestinationFolder(chosen)
      }
    } catch {
      // user cancelled
    }
  }

  const runTaskDownload = async (taskId: number, signal?: AbortSignal) => {
    const task = tasks.find((candidate) => candidate.id === taskId)
    if (!task || !destinationFolder) {
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((entry) =>
        entry.id === taskId
          ? {
              ...entry,
              status: 'Downloading',
              eta: '00:00:00',
              speed: 2.4,
              message: entry.mode === 'audio' ? 'Extraction audio en cours' : 'Téléchargement en cours',
            }
          : entry,
      ),
    )

    try {
      const filePath = task.mode === 'audio' ? buildAudioPath(destinationFolder, task.name) : buildDownloadPath(destinationFolder, task.name)
      const command = task.mode === 'audio' ? 'download_and_convert_to_mp3' : 'download_file'

      await invoke<string>(command, {
        url: task.source,
        path: filePath,
      })

      setTasks((currentTasks) =>
        currentTasks.map((entry) =>
          entry.id === taskId
            ? {
                ...entry,
                status: 'Completed',
                progress: 100,
                speed: 0,
                eta: '00:00:00',
                folder: destinationFolder,
                message: entry.mode === 'audio' ? 'Conversion MP3 terminée' : 'Téléchargement terminé',
                downloadedBytes: getTotalBytes(entry) || getDownloadedBytes(entry),
                totalBytes: getTotalBytes(entry) || getDownloadedBytes(entry),
                size: getTotalBytes(entry) > 0 ? formatBytes(getTotalBytes(entry)) : entry.size,
              }
            : entry,
        ),
      )
    } catch (error) {
      if (signal?.aborted) {
        setTasks((currentTasks) =>
          currentTasks.map((entry) =>
            entry.id === taskId
              ? { ...entry, status: 'Paused', speed: 0, eta: 'Paused', message: entry.mode === 'audio' ? 'Conversion mise en pause' : 'Téléchargement mis en pause' }
              : entry,
          ),
        )
        return
      }

      setTasks((currentTasks) =>
        currentTasks.map((entry) =>
          entry.id === taskId
            ? {
                ...entry,
                status: 'Failed',
                speed: 0,
                eta: 'Erreur',
                message: entry.mode === 'audio' ? 'Échec de la conversion MP3' : 'Échec du téléchargement',
              }
            : entry,
        ),
      )
    } finally {
      downloadControllersRef.current.delete(taskId)
    }
  }

  const handleStartDownload = async (taskId: number) => {
    const task = tasks.find((candidate) => candidate.id === taskId)
    if (!task || !destinationFolder) {
      return
    }

    const controller = new AbortController()
    downloadControllersRef.current.set(taskId, controller)
    await runTaskDownload(taskId, controller.signal)
  }

  const handleTogglePause = (taskId: number) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        if (task.status === 'Paused') {
          const controller = new AbortController()
          downloadControllersRef.current.set(taskId, controller)
          void runTaskDownload(taskId, controller.signal)
          return {
            ...task,
            status: 'Downloading',
            speed: 2.6,
            eta: '00:08:10',
          }
        }

        if (task.status === 'Downloading' || task.status === 'Queued') {
          const controller = downloadControllersRef.current.get(taskId)
          controller?.abort()
          downloadControllersRef.current.delete(taskId)
          return { ...task, status: 'Paused', speed: 0, eta: 'Paused' }
        }

        return task
      }),
    )
  }

  const handleRemoveTask = (taskId: number) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    if (selectedId === taskId) {
      const nextTask = tasks.find((task) => task.id !== taskId)
      setSelectedId(nextTask ? nextTask.id : 0)
    }

    const controller = downloadControllersRef.current.get(taskId)
    controller?.abort()
    downloadControllersRef.current.delete(taskId)
  }

  const stats = useMemo(() => {
    const active = tasks.filter((task) => task.status === 'Downloading').length
    const completed = tasks.filter((task) => task.status === 'Completed').length
    const queued = tasks.filter((task) => task.status === 'Queued').length
    const speed = tasks.filter((task) => task.status === 'Downloading').reduce((total, task) => total + task.speed, 0)

    return { active, completed, queued, speed }
  }, [tasks])

  const formattedSpeed = `${stats.speed.toFixed(1)} MB/s`

  const pageProps = {
    theme,
    tasks,
    destinationFolder,
    onChooseFolder: handleChooseFolder,
    onSetTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    url,
    onUrlChange: setUrl,
    onAddTask: handleAddTask,
    queuedCount: stats.queued,
    activeLimit: MAX_ACTIVE_TASKS,
    activePage,
    onNavigate: setActivePage,
  }

  if (activePage === 'converter') {
    return <ConverterPage {...pageProps} />
  }

  if (activePage === 'folders') {
    return <FoldersPage {...pageProps} />
  }

  if (activePage === 'history') {
    return <HistoryPage {...pageProps} />
  }

  if (activePage === 'settings') {
    return <SettingsPage {...pageProps} />
  }

  return (
    <DashboardPage
      theme={theme}
      tasks={tasks}
      search={search}
      destinationFolder={destinationFolder}
      mode={mode}
      selectedTask={selectedTask}
      formattedSpeed={formattedSpeed}
      stats={stats}
      onSetTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      onSearch={setSearch}
      onChooseFolder={handleChooseFolder}
      onModeChange={setMode}
      onAddTask={handleAddTask}
      onUrlChange={setUrl}
      url={url}
      onSelectTask={setSelectedId}
      onStartDownload={handleStartDownload}
      onTogglePause={handleTogglePause}
      onRemoveTask={handleRemoveTask}
      activeLimit={MAX_ACTIVE_TASKS}
      activePage={activePage}
      onNavigate={setActivePage}
    />
  )
}

export default App
