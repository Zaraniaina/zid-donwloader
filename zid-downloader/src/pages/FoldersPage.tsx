import { FolderOpen, HardDrive, Plus } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import type { DownloadTask } from '../lib/downloadQueue'

type AppPage = 'dashboard' | 'converter' | 'folders' | 'history' | 'settings'

type FoldersPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  destinationFolder: string
  onChooseFolder: () => void
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function FoldersPage({
  theme,
  tasks,
  destinationFolder,
  onChooseFolder,
  queuedCount,
  activeLimit,
  activePage,
  onNavigate,
}: FoldersPageProps) {
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
            <p className="eyebrow">Stockage</p>
            <h2>Gestion des dossiers</h2>
          </div>
          <button type="button" className="primary-button" onClick={onChooseFolder}>
            <Plus size={16} />
            Ajouter un dossier
          </button>
        </section>

        <section className="settings-grid two-col">
          <div className="panel page-panel">
            <div className="page-card-header">
              <div className="inline-label">
                <FolderOpen size={16} />
                <span>Dossier courant</span>
              </div>
            </div>
            <div className="option-card emphasis">
              <strong>{destinationFolder}</strong>
              <small>Emplacement principal pour les téléchargements</small>
            </div>
          </div>

          <div className="panel page-panel">
            <div className="page-card-header">
              <div className="inline-label">
                <HardDrive size={16} />
                <span>Espace disponible</span>
              </div>
            </div>
            <div className="option-card">
              <strong>82%</strong>
              <small>Utilisation du disque local</small>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
