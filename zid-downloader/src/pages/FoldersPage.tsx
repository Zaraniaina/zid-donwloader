import { FolderOpen, Plus } from 'lucide-react'

import { Sidebar } from '../components/layout/Sidebar'
import type { DownloadTask } from '../lib/downloadQueue'
import type { AppPage } from '../lib/navigation'

type FoldersPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  destinationFolder: string
  onChooseFolder: () => void
  onOpenFolder: (folderPath?: string) => void
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  onSetTheme: () => void
}

export function FoldersPage({
  theme,
  tasks,
  destinationFolder,
  onChooseFolder,
  onOpenFolder,
  queuedCount,
  activeLimit,
  activePage,
  onNavigate,
  onSetTheme,
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
        onSetTheme={onSetTheme}
      />

      <main className="page-main">
        <section className="page-header">
          <div>
            <p className="eyebrow">Stockage</p>
            <h2>Dossier de destination</h2>
          </div>
          <button type="button" className="primary-button" onClick={onChooseFolder}>
            <Plus size={16} />
            Changer de dossier
          </button>
        </section>

        <div className="panel page-panel">
          <div className="page-card-header">
            <div className="inline-label">
              <FolderOpen size={16} />
              <span>Dossier courant</span>
            </div>
          </div>

          <div className="option-card emphasis">
            <strong>{destinationFolder || 'Aucun dossier choisi'}</strong>
            <small>Les nouveaux téléchargements et conversions arrivent ici.</small>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="secondary-button action-button"
              onClick={() => onOpenFolder(destinationFolder)}
            >
              <FolderOpen size={14} />
              Ouvrir dans l’explorateur
            </button>
            <button
              type="button"
              className="secondary-button action-button"
              onClick={onChooseFolder}
            >
              Modifier
            </button>
          </div>
        </div>

        <div className="panel page-panel promo-panel">
          <div className="inline-label">
            <FolderOpen size={15} />
            <span>Classement automatique</span>
          </div>
          <p>
            Le dossier se mémorise entre deux lancements. Chaque tâche conserve celui qui était
            choisi au moment de son ajout.
          </p>
        </div>
      </main>
    </div>
  )
}
