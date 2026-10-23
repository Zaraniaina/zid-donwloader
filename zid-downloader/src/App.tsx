import { useEffect, useMemo, useState } from 'react'
import { downloadDir } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { open as openPath } from '@tauri-apps/plugin-shell'

import './App.css'
import { useDownloads } from './hooks/useDownloads'
import { MAX_ACTIVE_TASKS, STORAGE_KEYS, type DownloadTask, type TaskMode } from './lib/downloadQueue'
import type { AppPage } from './lib/navigation'
import { errorMessage } from './lib/transfer'
import { ConverterPage } from './pages/ConverterPage'
import { DashboardPage } from './pages/DashboardPage'
import { FoldersPage } from './pages/FoldersPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'

function readStored(key: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(key)
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    readStored(STORAGE_KEYS.theme) === 'dark' ? 'dark' : 'light',
  )
  const [mode, setMode] = useState<TaskMode>(() =>
    readStored(STORAGE_KEYS.mode) === 'audio' ? 'audio' : 'download',
  )
  const [folder, setFolder] = useState(() => readStored(STORAGE_KEYS.folder) ?? '')
  const [activePage, setActivePage] = useState<AppPage>('dashboard')
  const [url, setUrl] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const notifyCompletion = async (task: DownloadTask) => {
    try {
      let granted = await isPermissionGranted()
      if (!granted) {
        granted = (await requestPermission()) === 'granted'
      }

      if (granted) {
        sendNotification({
          title: task.mode === 'audio' ? 'Conversion MP3 terminée' : 'Téléchargement terminé',
          body: `${task.name} · ${task.folder}`,
        })
      }
    } catch {
      // la notification est un bonus, pas un blocage
    }
  }

  const downloads = useDownloads({ onCompleted: notifyCompletion })
  const { tasks } = downloads

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.mode, mode)
  }, [mode])

  useEffect(() => {
    if (folder) {
      window.localStorage.setItem(STORAGE_KEYS.folder, folder)
    }
  }, [folder])

  useEffect(() => {
    if (folder) {
      return
    }

    let active = true
    void downloadDir()
      .then((directory) => {
        if (active && directory) {
          setFolder(directory)
        }
      })
      .catch(() => {
        if (active) {
          setFolder('Downloads')
        }
      })

    return () => {
      active = false
    }
  }, [folder])

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? tasks[0]

  const stats = useMemo(() => {
    const active = tasks.filter((task) => task.status === 'Downloading').length
    const completed = tasks.filter((task) => task.status === 'Completed').length
    const queued = tasks.filter((task) => task.status === 'Queued').length
    const speed = tasks.reduce(
      (total, task) => total + (task.status === 'Downloading' ? task.speed : 0),
      0,
    )

    return { active, completed, queued, speed }
  }, [tasks])

  const formattedSpeed = `${stats.speed.toFixed(1)} Mo/s`

  const handleAddTask = (taskMode: TaskMode) => {
    const result = downloads.addTask({ url, mode: taskMode, folder })

    if (!result.ok) {
      setNotice(result.error)
      return
    }

    setSelectedId(result.id)
    setUrl('')
    setNotice(null)
  }

  const handleChooseFolder = async () => {
    try {
      const chosen = await open({ directory: true, multiple: false, defaultPath: folder || undefined })

      if (typeof chosen === 'string') {
        setFolder(chosen)
        setNotice(null)
      }
    } catch (error) {
      setNotice(errorMessage(error, 'Le sélecteur de dossier n’a pas pu s’ouvrir.'))
    }
  }

  const handleOpenFolder = async (folderPath = folder) => {
    if (!folderPath) {
      setNotice('Choisissez d’abord un dossier de destination.')
      return
    }

    try {
      await openPath(folderPath)
    } catch (error) {
      setNotice(errorMessage(error, `Impossible d’ouvrir ${folderPath}.`))
    }
  }

  const handleOpenFile = async (task?: DownloadTask) => {
    if (!task?.targetPath) {
      setNotice('Ce fichier n’a pas encore d’emplacement.')
      return
    }

    try {
      await openPath(task.targetPath)
    } catch (error) {
      setNotice(errorMessage(error, 'Impossible d’ouvrir le fichier.'))
    }
  }

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  const shared = {
    theme,
    tasks,
    queuedCount: stats.queued,
    activeLimit: MAX_ACTIVE_TASKS,
    activePage,
    onNavigate: setActivePage,
    onSetTheme: toggleTheme,
  }

  if (activePage === 'converter') {
    return (
      <ConverterPage
        {...shared}
        url={url}
        onUrlChange={setUrl}
        onAddTask={() => handleAddTask('audio')}
        destinationFolder={folder}
        onChooseFolder={handleChooseFolder}
        notice={notice}
        onDismissNotice={() => setNotice(null)}
      />
    )
  }

  if (activePage === 'folders') {
    return (
      <FoldersPage
        {...shared}
        destinationFolder={folder}
        onChooseFolder={handleChooseFolder}
        onOpenFolder={handleOpenFolder}
      />
    )
  }

  if (activePage === 'history') {
    return (
      <HistoryPage {...shared} onOpenFile={handleOpenFile} onOpenFolder={handleOpenFolder} />
    )
  }

  if (activePage === 'settings') {
    return (
      <SettingsPage
        {...shared}
        destinationFolder={folder}
        onChooseFolder={handleChooseFolder}
      />
    )
  }

  return (
    <DashboardPage
      {...shared}
      search={search}
      destinationFolder={folder}
      mode={mode}
      selectedTask={selectedTask}
      formattedSpeed={formattedSpeed}
      stats={stats}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      onSearch={setSearch}
      onChooseFolder={handleChooseFolder}
      onModeChange={setMode}
      onAddTask={() => handleAddTask(mode)}
      onUrlChange={setUrl}
      url={url}
      onSelectTask={setSelectedId}
      onStartDownload={downloads.startTask}
      onTogglePause={downloads.pauseTask}
      onRemoveTask={downloads.removeTask}
      onOpenFolder={handleOpenFolder}
      onOpenFile={handleOpenFile}
    />
  )
}

export default App
