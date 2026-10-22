import { useEffect, useMemo, useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  FolderOpen,
  HardDrive,
  ListTodo,
  Pause,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react'
import './App.css'
import {
  MAX_ACTIVE_TASKS,
  advanceDownloadQueue,
  buildDownloadPath,
  createTaskFromUrl,
  getStoredTasks,
  saveTasks,
  type DownloadTask,
} from './lib/downloadQueue'

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

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) =>
        task.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, tasks],
  )

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

    const newTask = createTaskFromUrl(url)

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
      // no-op: the user cancelled the dialog
    }
  }

  const handleStartDownload = async (taskId: number) => {
    const task = tasks.find((candidate) => candidate.id === taskId)
    if (!task || !destinationFolder) {
      return
    }

    try {
      const response = await fetch(task.source)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const filePath = buildDownloadPath(destinationFolder, task.name)
      const bytes = new Uint8Array(await blob.arrayBuffer())
      await writeFile(filePath, bytes)

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
              }
            : entry,
        ),
      )
    } catch {
      setTasks((currentTasks) =>
        currentTasks.map((entry) =>
          entry.id === taskId
            ? { ...entry, status: 'Failed', speed: 0, eta: 'Erreur' }
            : entry,
        ),
      )
    }
  }

  const handleTogglePause = (taskId: number) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        if (task.status === 'Paused') {
          const hasFreeSlot = currentTasks.filter((entry) => entry.status === 'Downloading').length < MAX_ACTIVE_TASKS
          return {
            ...task,
            status: hasFreeSlot ? 'Downloading' : 'Queued',
            speed: hasFreeSlot ? 2.6 : 0,
            eta: hasFreeSlot ? '00:08:10' : 'Queued',
          }
        }

        if (task.status === 'Downloading' || task.status === 'Queued') {
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
  }

  const stats = useMemo(() => {
    const active = tasks.filter((task) => task.status === 'Downloading').length
    const completed = tasks.filter((task) => task.status === 'Completed').length
    const queued = tasks.filter((task) => task.status === 'Queued').length
    const speed = tasks
      .filter((task) => task.status === 'Downloading')
      .reduce((total, task) => total + task.speed, 0)

    return { active, completed, queued, speed }
  }, [tasks])

  const formattedSpeed = `${stats.speed.toFixed(1)} MB/s`

  return (
    <div className={`app-shell ${theme}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-icon">
            <Download size={20} />
          </div>
          <div>
            <p className="eyebrow">Desktop app</p>
            <h1>zid-downloader</h1>
          </div>
        </div>

        <nav className="nav">
          <button type="button" className="nav-item active">
            <ListTodo size={17} />
            Downloads
          </button>
          <button type="button" className="nav-item">
            <Video size={17} />
            Videos
          </button>
          <button type="button" className="nav-item">
            <FolderOpen size={17} />
            Folders
          </button>
          <button type="button" className="nav-item">
            <ShieldCheck size={17} />
            License
          </button>
        </nav>

        <div className="panel compact">
          <div className="panel-header">
            <span>Queue</span>
            <span className="pill">{stats.queued} waiting</span>
          </div>
          <div className="queue-list">
            <div className="queue-row">
              <span>Main queue</span>
              <strong>{tasks.length} tasks</strong>
            </div>
            <div className="queue-row">
              <span>Active slots</span>
              <strong>{MAX_ACTIVE_TASKS}</strong>
            </div>
            <div className="queue-row">
              <span>Theme</span>
              <strong>{theme}</strong>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="searchbox">
            <Search size={16} />
            <input
              aria-label="Search downloads"
              type="text"
              value={search}
              placeholder="Search downloads"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Settings"
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card accent">
            <div className="stat-label-row">
              <span className="stat-label">Active</span>
              <span className="dot active-dot" />
            </div>
            <div className="stat-value">{stats.active}</div>
            <p className="stat-foot">downloads currently running</p>
          </article>

          <article className="stat-card">
            <div className="stat-label-row">
              <span className="stat-label">Speed</span>
              <span className="mini-icon">
                <Sparkles size={14} />
              </span>
            </div>
            <div className="stat-value">{formattedSpeed}</div>
            <p className="stat-foot">combined transfer rate</p>
          </article>

          <article className="stat-card">
            <div className="stat-label-row">
              <span className="stat-label">Completed</span>
              <CheckCircle2 size={15} />
            </div>
            <div className="stat-value">{stats.completed}</div>
            <p className="stat-foot">files verified</p>
          </article>

          <article className="stat-card">
            <div className="stat-label-row">
              <span className="stat-label">Disk</span>
              <HardDrive size={15} />
            </div>
            <div className="stat-value">82%</div>
            <p className="stat-foot">storage available</p>
          </article>
        </section>

        <section className="workspace-grid">
          <div className="panel main-panel-card">
            <div className="panel-header">
              <span>New download</span>
              <button type="button" className="secondary-button">
                Add from browser
              </button>
            </div>

            <div className="entry-box">
              <label htmlFor="download-url" className="sr-only">
                Download URL
              </label>
              <input
                id="download-url"
                type="text"
                value={url}
                placeholder="Paste URL or file link"
                onChange={(event) => setUrl(event.target.value)}
              />
              <button type="button" className="secondary-button" onClick={handleChooseFolder}>
                Select folder
              </button>
              <button type="button" className="primary-button" onClick={handleAddTask}>
                Add download
              </button>
            </div>

            <div className="meta-row compact-row">
              <span>Destination</span>
              <strong>{destinationFolder}</strong>
            </div>

            <div className="list-header">
              <h2>Active downloads</h2>
              <button type="button" className="ghost-button">
                Sort by
                <ChevronDown size={15} />
              </button>
            </div>

            <div className="task-list">
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(task.id)}
                >
                  <div className="task-main">
                    <div className={`task-badge ${task.status.toLowerCase()}`}>
                      {task.status === 'Downloading' && <Play size={12} />}
                      {task.status === 'Paused' && <Pause size={12} />}
                      {task.status === 'Completed' && <CheckCircle2 size={12} />}
                      {task.status === 'Failed' && <AlertTriangle size={12} />}
                    </div>
                    <div className="task-copy">
                      <strong>{task.name}</strong>
                      <span>{task.source}</span>
                    </div>
                  </div>

                  <div className="task-meta">
                    <span>{task.size}</span>
                    <span>{task.speed.toFixed(1)} MB/s</span>
                  </div>

                  <div className="progress-wrap">
                    <div className="progress-bar">
                      <span style={{ width: `${task.progress}%` }} />
                    </div>
                    <small>{task.progress}%</small>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="panel detail-panel">
            <div className="panel-header">
              <span>Details</span>
              <span className="pill success">{selectedTask?.status}</span>
            </div>

            {selectedTask ? (
              <>
                <div className="detail-header">
                  <div className="detail-name-group">
                    <div className="detail-icon">
                      <Download size={16} />
                    </div>
                    <div>
                      <h3>{selectedTask.name}</h3>
                      <p>{selectedTask.category}</p>
                    </div>
                  </div>
                </div>

                <div className="metrics-grid">
                  <div>
                    <label>Size</label>
                    <strong>{selectedTask.size}</strong>
                  </div>
                  <div>
                    <label>Progress</label>
                    <strong>{selectedTask.progress}%</strong>
                  </div>
                  <div>
                    <label>Speed</label>
                    <strong>{selectedTask.speed.toFixed(1)} MB/s</strong>
                  </div>
                  <div>
                    <label>ETA</label>
                    <strong>{selectedTask.eta}</strong>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="meta-row">
                    <span>Location</span>
                    <strong>{selectedTask.folder}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Connections</span>
                    <strong>8</strong>
                  </div>
                  <div className="meta-row">
                    <span>Last check</span>
                    <strong>2 min ago</strong>
                  </div>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="secondary-button action-button"
                    onClick={() => handleStartDownload(selectedTask.id)}
                  >
                    <Download size={14} />
                    Download now
                  </button>
                  <button
                    type="button"
                    className="secondary-button action-button"
                    onClick={() => handleTogglePause(selectedTask.id)}
                  >
                    {selectedTask.status === 'Paused' ? <Play size={14} /> : <Pause size={14} />}
                    {selectedTask.status === 'Paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button action-button"
                    onClick={() => handleRemoveTask(selectedTask.id)}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  )
}

export default App
