import { Clock3, Download, FolderOpen, Music4 } from 'lucide-react'

import { Sidebar } from '../components/layout/Sidebar'
import { formatDate, statusLabel, type DownloadTask } from '../lib/downloadQueue'
import type { AppPage } from '../lib/navigation'

type HistoryPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  onSetTheme: () => void
  onOpenFile?: (task?: DownloadTask) => void
  onOpenFolder?: (folderPath?: string) => void
}

export function HistoryPage({
  theme,
  tasks,
  queuedCount,
  activeLimit,
  activePage,
  onNavigate,
  onSetTheme,
  onOpenFile,
  onOpenFolder,
}: HistoryPageProps) {
  const recentTasks = tasks
    .filter((task) => task.status === 'Completed' || task.status === 'Failed' || task.status === 'Paused')
    .sort((left, right) => (right.completedAt ?? right.createdAt) - (left.completedAt ?? left.createdAt))

  return (
    <div className={`app-shell ${theme}`}>
      <Sidebar
        tasks={tasks}
        theme={theme}
        queuedCount={queuedCount}
        activeLimit={activeLimit}
        activePage={activePage}
        onNavigate={onNavigate}
        onSetTheme={onSetTheme}
      />

      <main className="page-main">
        <section className="page-header">
          <div>
            <p className="eyebrow">Historique</p>
            <h2>Activités récentes</h2>
          </div>
        </section>

        <div className="panel page-panel">
          <div className="history-list">
            {recentTasks.length === 0 ? (
              <div className="history-row">
                <div className="inline-label">
                  <Clock3 size={15} />
                  <span>Aucune activité récente</span>
                </div>
                <small>Les tâches terminées apparaîtront ici.</small>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div className="history-row" key={task.id}>
                  <div className="inline-label">
                    {task.mode === 'audio' ? <Music4 size={15} /> : <Download size={15} />}
                    <span>{task.name}</span>
                  </div>
                  <div className="history-actions">
                    <small>
                      {statusLabel(task.status)} · {formatDate(task.completedAt ?? task.createdAt)}
                    </small>
                    {task.status === 'Completed' ? (
                      <>
                        <button type="button" className="ghost-button" onClick={() => onOpenFile?.(task)}>
                          Ouvrir
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => onOpenFolder?.(task.folder)}
                        >
                          <FolderOpen size={14} />
                          Dossier
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
