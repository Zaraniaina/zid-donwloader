import { FolderOpen, MoonStar, SlidersHorizontal, Sun } from 'lucide-react'

import { Sidebar } from '../components/layout/Sidebar'
import type { DownloadTask } from '../lib/downloadQueue'
import type { AppPage } from '../lib/navigation'

type SettingsPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  onSetTheme: () => void
  destinationFolder: string
  onChooseFolder: () => void
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function SettingsPage({
  theme,
  tasks,
  onSetTheme,
  destinationFolder,
  onChooseFolder,
  queuedCount,
  activeLimit,
  activePage,
  onNavigate,
}: SettingsPageProps) {
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
                {theme === 'dark' ? <MoonStar size={16} /> : <Sun size={16} />}
              </button>

              <button type="button" className="setting-row" onClick={onChooseFolder}>
                <div className="setting-copy">
                  <strong>Dossier de destination</strong>
                  <small>{destinationFolder || 'Aucun dossier choisi'}</small>
                </div>
                <FolderOpen size={16} />
              </button>

              <div className="meta-row">
                <span>Téléchargements simultanés</span>
                <strong>{activeLimit}</strong>
              </div>
            </div>
          </div>

          <div className="panel page-panel">
            <div className="page-card-header">
              <div className="inline-label">
                <SlidersHorizontal size={16} />
                <span>Système</span>
              </div>
            </div>

            <div className="setting-list">
              <div className="meta-row">
                <span>Notifications de fin</span>
                <strong>Demandées au premier téléchargement</strong>
              </div>
              <div className="meta-row">
                <span>Fichiers temporaires</span>
                <strong>Supprimés si le transfert échoue</strong>
              </div>
              <div className="meta-row">
                <span>Reprise</span>
                <strong>Redémarre le fichier depuis le début</strong>
              </div>
              <div className="meta-row">
                <span>Version</span>
                <strong>0.2.0</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
