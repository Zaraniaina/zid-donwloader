import { Bell, Download, MoonStar, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import type { DownloadTask } from '../lib/downloadQueue'

type AppPage = 'dashboard' | 'converter' | 'folders' | 'history' | 'settings'

type SettingsPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  onSetTheme: () => void
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function SettingsPage({ theme, tasks, onSetTheme, queuedCount, activeLimit, activePage, onNavigate }: SettingsPageProps) {
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
            <p className="eyebrow">Application</p>
            <h2>Paramètres</h2>
          </div>
        </section>

        <section className="settings-grid two-col">
          <div className="panel page-panel">
            <div className="page-card-header">
              <div className="inline-label">
                <SlidersHorizontal size={16} />
                <span>Général</span>
              </div>
            </div>

            <div className="setting-list">
              <button type="button" className="setting-row" onClick={onSetTheme}>
                <div className="setting-copy">
                  <strong>Thème</strong>
                  <small>{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</small>
                </div>
                <MoonStar size={16} />
              </button>

              <div className="setting-row">
                <div className="setting-copy">
                  <strong>Notifications</strong>
                  <small>Alertes de fin de téléchargement</small>
                </div>
                <Bell size={16} />
              </div>

              <div className="setting-row">
                <div className="setting-copy">
                  <strong>Gestion des fichiers</strong>
                  <small>Sauvegarder les fichiers après conversion</small>
                </div>
                <Download size={16} />
              </div>
            </div>
          </div>

          <div className="panel page-panel">
            <div className="page-card-header">
              <div className="inline-label">
                <ShieldCheck size={16} />
                <span>Sécurité</span>
              </div>
            </div>

            <div className="setting-list">
              <div className="setting-row">
                <div className="setting-copy">
                  <strong>Sources fiables</strong>
                  <small>Vérification des URLs pendant les tâches</small>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-copy">
                  <strong>Limite de vitesse</strong>
                  <small>Optimisée pour les téléchargements sans blocage</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
