import { Bell, ChevronDown, Download, Search, Settings, Video } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { TaskDetails } from '../components/tasks/TaskDetails'
import { TaskList } from '../components/tasks/TaskList'
import type { DownloadTask, TaskMode } from '../lib/downloadQueue'

type AppPage = 'dashboard' | 'converter' | 'folders' | 'history' | 'settings'

type DashboardPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  search: string
  destinationFolder: string
  mode: TaskMode
  selectedTask?: DownloadTask
  formattedSpeed: string
  stats: {
    active: number
    completed: number
    queued: number
    speed: number
  }
  onSetTheme: () => void
  onSearch: (value: string) => void
  onChooseFolder: () => void
  onModeChange: (nextMode: TaskMode) => void
  onAddTask: () => void
  onUrlChange: (value: string) => void
  url: string
  onSelectTask: (taskId: number) => void
  onStartDownload: (taskId: number) => void
  onTogglePause: (taskId: number) => void
  onRemoveTask: (taskId: number) => void
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function DashboardPage({
  theme,
  tasks,
  search,
  destinationFolder,
  mode,
  selectedTask,
  formattedSpeed,
  stats,
  onSetTheme,
  onSearch,
  onChooseFolder,
  onModeChange,
  onAddTask,
  onUrlChange,
  url,
  onSelectTask,
  onStartDownload,
  onTogglePause,
  onRemoveTask,
  activeLimit,
  activePage,
  onNavigate,
}: DashboardPageProps) {
  const filteredTasks = tasks.filter((task) => task.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={`app-shell ${theme}`}>
      <Sidebar
        tasks={tasks}
        theme={theme}
        queuedCount={stats.queued}
        activeLimit={activeLimit}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <main className="main-panel">
        <header className="topbar">
          <div className="searchbox">
            <Search size={16} />
            <input
              aria-label="Rechercher des téléchargements"
              type="text"
              value={search}
              placeholder="Rechercher un fichier"
              onChange={(event) => onSearch(event.target.value)}
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
              onClick={onSetTheme}
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        <div className="feature-banner">
          <span className="feature-badge">Gratuit</span>
          <strong>URL + conversion vidéo vers MP3</strong>
        </div>

        <StatsGrid active={stats.active} completed={stats.completed} speedText={formattedSpeed} />

        <section className="workspace-grid">
          <div className="panel main-panel-card">
            <div className="panel-header">
              <span>Nouvelle tâche</span>
              <button type="button" className="secondary-button">
                Importer depuis le navigateur
              </button>
            </div>

            <div className="mode-toggle" aria-label="Choix du type de tâche">
              <button
                type="button"
                className={mode === 'download' ? 'mode-button active' : 'mode-button'}
                onClick={() => onModeChange('download')}
              >
                <Download size={15} />
                Télécharger
              </button>
              <button
                type="button"
                className={mode === 'audio' ? 'mode-button active' : 'mode-button'}
                onClick={() => onModeChange('audio')}
              >
                <Video size={15} />
                Vidéo vers MP3
              </button>
            </div>

            <div className="entry-box">
              <label htmlFor="download-url" className="sr-only">
                URL de téléchargement
              </label>
              <input
                id="download-url"
                type="text"
                value={url}
                placeholder={mode === 'audio' ? 'Coller une URL vidéo pour extraire l’audio' : 'Coller une URL de fichier'}
                onChange={(event) => onUrlChange(event.target.value)}
              />
              <button type="button" className="secondary-button" onClick={onChooseFolder}>
                Dossier
              </button>
              <button type="button" className="primary-button" onClick={onAddTask}>
                {mode === 'audio' ? 'Convertir en MP3' : 'Ajouter'}
              </button>
            </div>

            <div className="meta-row compact-row">
              <span>Destination</span>
              <strong>{destinationFolder}</strong>
            </div>

            <div className="list-header">
              <h2>Tâches actives</h2>
              <button type="button" className="ghost-button">
                Trier
                <ChevronDown size={15} />
              </button>
            </div>

            <TaskList tasks={filteredTasks} selectedTask={selectedTask} onSelect={onSelectTask} />
          </div>

          <aside className="panel detail-panel">
            <div className="panel-header">
              <span>Détails</span>
              <span className="pill success">{selectedTask?.status}</span>
            </div>

            <TaskDetails
              selectedTask={selectedTask}
              onStartDownload={onStartDownload}
              onTogglePause={onTogglePause}
              onRemoveTask={onRemoveTask}
            />
          </aside>
        </section>
      </main>
    </div>
  )
}
