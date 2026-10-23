import { Download, Search, Settings, Video } from 'lucide-react'

import { StatsGrid } from '../components/dashboard/StatsGrid'
import { Sidebar } from '../components/layout/Sidebar'
import { TaskDetails } from '../components/tasks/TaskDetails'
import { TaskList } from '../components/tasks/TaskList'
import { statusLabel, type DownloadTask, type TaskMode } from '../lib/downloadQueue'
import type { AppPage } from '../lib/navigation'

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
  notice?: string | null
  onDismissNotice: () => void
  onSearch: (value: string) => void
  onChooseFolder: () => void
  onModeChange: (nextMode: TaskMode) => void
  onAddTask: () => void
  onUrlChange: (value: string) => void
  url: string
  onSelectTask: (taskId: string) => void
  onStartDownload: (taskId: string) => void
  onTogglePause: (taskId: string) => void
  onRemoveTask: (taskId: string) => void
  onOpenFolder: (folderPath?: string) => void
  onOpenFile: (task?: DownloadTask) => void
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  onSetTheme: () => void
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
  notice,
  onDismissNotice,
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
  onOpenFolder,
  onOpenFile,
  activeLimit,
  activePage,
  onNavigate,
  onSetTheme,
}: DashboardPageProps) {
  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className={`app-shell ${theme}`}>
      <Sidebar
        tasks={tasks}
        theme={theme}
        queuedCount={stats.queued}
        activeLimit={activeLimit}
        activePage={activePage}
        onNavigate={onNavigate}
        onSetTheme={onSetTheme}
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
            <button
              type="button"
              className="icon-button"
              aria-label="Paramètres"
              onClick={() => onNavigate('settings')}
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {notice ? (
          <div className="notice" role="alert">
            <span>{notice}</span>
            <button type="button" className="ghost-button" onClick={onDismissNotice}>
              Fermer
            </button>
          </div>
        ) : null}

        <div className="feature-banner">
          <span className="feature-badge">Gratuit</span>
          <strong>URL + conversion vidéo vers MP3</strong>
        </div>

        <StatsGrid
          active={stats.active}
          completed={stats.completed}
          queued={stats.queued}
          speedText={formattedSpeed}
        />

        <section className="workspace-grid">
          <div className="panel main-panel-card">
            <div className="panel-header">
              <span>Nouvelle tâche</span>
            </div>

            <div className="mode-toggle" role="group" aria-label="Choix du type de tâche">
              <button
                type="button"
                className={mode === 'download' ? 'mode-button active' : 'mode-button'}
                aria-pressed={mode === 'download'}
                onClick={() => onModeChange('download')}
              >
                <Download size={15} />
                Télécharger
              </button>
              <button
                type="button"
                className={mode === 'audio' ? 'mode-button active' : 'mode-button'}
                aria-pressed={mode === 'audio'}
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
                placeholder={
                  mode === 'audio'
                    ? 'Coller l’URL directe d’un fichier vidéo'
                    : 'Coller une URL de fichier'
                }
                onChange={(event) => onUrlChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onAddTask()
                  }
                }}
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
              <strong>{destinationFolder || 'Aucun dossier choisi'}</strong>
            </div>

            <div className="list-header">
              <h2>Tâches</h2>
              <span className="pill">{filteredTasks.length} affichée(s)</span>
            </div>

            <TaskList
              tasks={filteredTasks}
              selectedTask={selectedTask}
              onSelect={onSelectTask}
              emptyLabel={
                search.trim()
                  ? 'Aucune tâche ne correspond à cette recherche.'
                  : 'Ajoutez une URL pour démarrer un téléchargement.'
              }
            />
          </div>

          <aside className="panel detail-panel">
            <div className="panel-header">
              <span>Détails</span>
              {selectedTask ? (
                <span className={`pill status-${selectedTask.status.toLowerCase()}`}>
                  {statusLabel(selectedTask.status)}
                </span>
              ) : null}
            </div>

            <TaskDetails
              selectedTask={selectedTask}
              onStartDownload={onStartDownload}
              onTogglePause={onTogglePause}
              onRemoveTask={onRemoveTask}
              onOpenFolder={onOpenFolder}
              onOpenFile={onOpenFile}
            />
          </aside>
        </section>
      </main>
    </div>
  )
}
