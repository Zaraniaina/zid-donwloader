import { Download, Music4, Sparkles, Video } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import type { DownloadTask } from '../lib/downloadQueue'

type AppPage = 'dashboard' | 'converter' | 'folders' | 'history' | 'settings'

type ConverterPageProps = {
  theme: 'light' | 'dark'
  tasks: DownloadTask[]
  url: string
  onUrlChange: (value: string) => void
  onAddTask: () => void
  destinationFolder: string
  onChooseFolder: () => void
  queuedCount: number
  activeLimit: number
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

export function ConverterPage({
  theme,
  tasks,
  url,
  onUrlChange,
  onAddTask,
  destinationFolder,
  onChooseFolder,
  queuedCount,
  activeLimit,
  activePage,
  onNavigate,
}: ConverterPageProps) {
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
            <p className="eyebrow">Conversion Audio</p>
            <h2>Vidéo vers MP3</h2>
          </div>
          <button type="button" className="primary-button">
            Nouveau traitement
          </button>
        </section>

        <div className="panel page-panel">
          <div className="page-card-header">
            <div className="inline-label">
              <Video size={16} />
              <span>URL vidéo</span>
            </div>
          </div>

          <div className="entry-box converter-entry">
            <input
              type="text"
              value={url}
              placeholder="https://example.com/video.mp4"
              onChange={(event) => onUrlChange(event.target.value)}
            />
            <button type="button" className="secondary-button" onClick={onChooseFolder}>
              Dossier
            </button>
            <button type="button" className="primary-button" onClick={onAddTask}>
              Convertir
            </button>
          </div>

          <div className="settings-grid three-col">
            <div className="option-card">
              <div className="inline-label">
                <Music4 size={16} />
                <span>Qualité audio</span>
              </div>
              <strong>320 kbps</strong>
            </div>
            <div className="option-card">
              <div className="inline-label">
                <Sparkles size={16} />
                <span>Format</span>
              </div>
              <strong>MP3</strong>
            </div>
            <div className="option-card">
              <div className="inline-label">
                <Download size={16} />
                <span>Destination</span>
              </div>
              <strong>{destinationFolder}</strong>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
