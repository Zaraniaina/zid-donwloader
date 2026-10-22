import { Clock3, Download, Music4 } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import type { DownloadTask } from '../lib/downloadQueue'

type AppPage = 'dashboard' | 'converter' | 'folders' | 'history' | 'settings'

type HistoryPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function HistoryPage({ theme, tasks, queuedCount, activeLimit, activePage, onNavigate }: HistoryPageProps) {
  const recentTasks = tasks.filter((task) => task.status === 'Completed' || task.status === 'Failed' || task.status === 'Paused')

  return (
    <div className={`app-shell ${theme}`}>
      <Sidebar
        tasks={tasks}
        theme={theme}
        queuedCount={queuedCount}
        activeLimit={activeLimit}
        activePage={activePage}
        onNavigate={onNavigate}
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
              recentTasks.slice(0, 6).map((task) => (
                <div className="history-row" key={task.id}>
                  <div className="inline-label">
                    {task.mode === 'audio' ? <Music4 size={15} /> : <Download size={15} />}
                    <span>{task.name}</span>
                  </div>
                  <small>{task.message ?? task.status}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
