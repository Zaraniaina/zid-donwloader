import { Clock3, Download, FolderOpen, ListTodo, MoonStar, Settings, Sun, Video } from 'lucide-react'
import type { DownloadTask } from '../../lib/downloadQueue'
import type { AppPage } from '../../lib/navigation'

type SidebarProps = {
  tasks: DownloadTask[]
  theme: 'light' | 'dark'
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  onSetTheme: () => void
}

export function Sidebar({ tasks, theme, queuedCount, activeLimit, activePage, onNavigate, onSetTheme }: SidebarProps) {
  const navItems: Array<{ page: AppPage; label: string; Icon: typeof Download }> = [
    { page: 'dashboard', label: 'Downloads', Icon: ListTodo },
    { page: 'converter', label: 'Convertisseur', Icon: Video },
    { page: 'folders', label: 'Dossiers', Icon: FolderOpen },
    { page: 'history', label: 'Historique', Icon: Clock3 },
    { page: 'settings', label: 'Paramètres', Icon: Settings },
  ]

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-icon">
          <Download size={20} />
        </div>
        <div>
          <p className="eyebrow">Free media tool</p>
          <h1>zid-downloader</h1>
        </div>
      </div>

      <nav className="nav">
        {navItems.map(({ page, label, Icon }) => (
          <button
            key={page}
            type="button"
            className={page === activePage ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate(page)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="panel compact">
        <div className="panel-header">
          <span>File</span>
          <span className="pill">{queuedCount} en attente</span>
        </div>
        <div className="queue-list">
          <div className="queue-row">
            <span>File principale</span>
            <strong>{tasks.length} tâches</strong>
          </div>
          <div className="queue-row">
            <span>Slots actifs</span>
            <strong>{activeLimit}</strong>
          </div>
          <button
            type="button"
            className="queue-row"
            onClick={onSetTheme}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            <span>Thème</span>
            <strong>{theme === 'dark' ? <MoonStar size={15} /> : <Sun size={15} />}</strong>
          </button>
        </div>
      </div>

      <div className="panel compact promo-panel">
        <strong>Gratuit</strong>
        <p>URLs, fichiers et conversion audio sans frais cachés.</p>
      </div>
    </aside>
  )
}
