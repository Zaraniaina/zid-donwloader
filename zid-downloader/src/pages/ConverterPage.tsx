import { useEffect, useState } from 'react'
import { AlertTriangle, Download, FolderOpen, Music4, Video } from 'lucide-react'

import { Sidebar } from '../components/layout/Sidebar'
import type { DownloadTask } from '../lib/downloadQueue'
import type { AppPage } from '../lib/navigation'
import { checkFfmpeg, checkYtDlp } from '../lib/transfer'

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
  onSetTheme: () => void
  notice?: string | null
  onDismissNotice: () => void
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
  onSetTheme,
  notice,
  onDismissNotice,
}: ConverterPageProps) {
  const [ffmpegReady, setFfmpegReady] = useState<boolean | null>(null)
  const [ytDlpReady, setYtDlpReady] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    void checkFfmpeg().then((ready) => {
      if (active) {
        setFfmpegReady(ready)
      }
    })

    void checkYtDlp().then((ready) => {
      if (active) {
        setYtDlpReady(ready)
      }
    })

    return () => {
      active = false
    }
  }, [])

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
            <p className="eyebrow">Conversion audio</p>
            <h2>Vidéo vers MP3</h2>
          </div>
        </section>

        {notice ? (
          <div className="notice" role="alert">
            <span>{notice}</span>
            <button type="button" className="ghost-button" onClick={onDismissNotice}>
              Fermer
            </button>
          </div>
        ) : null}

        {ffmpegReady === false ? (
          <div className="notice warning" role="status">
            <AlertTriangle size={16} />
            <span>
              FFmpeg n’est pas détecté. Installez-le avec <code>winget install Gyan.FFmpeg</code>{' '}
              puis relancez l’application.
            </span>
          </div>
        ) : null}

        {ffmpegReady !== false && ytDlpReady === false ? (
          <div className="notice warning" role="status">
            <AlertTriangle size={16} />
            <span>
              yt-dlp n’est pas détecté : seules les URL directes de fichier fonctionnent.
              Pour convertir des pages YouTube, Vimeo et autres, installez-le avec{' '}
              <code>winget install yt-dlp.yt-dlp</code> puis relancez l’application.
            </span>
          </div>
        ) : null}

        <div className="panel page-panel">
          <div className="page-card-header">
            <div className="inline-label">
              <Video size={16} />
              <span>URL directe du fichier vidéo</span>
            </div>
          </div>

          <div className="entry-box converter-entry">
            <label htmlFor="converter-url" className="sr-only">
              URL de la vidéo
            </label>
            <input
              id="converter-url"
              type="text"
              value={url}
              placeholder="https://example.com/video.mp4"
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
              Convertir
            </button>
          </div>

          <p className="hint">
            Collez l’adresse d’une page vidéo (YouTube, Vimeo, Dailymotion, TikTok) ou l’URL directe
            d’un fichier (mp4, webm, mkv). Sortie MP3 192 kbps.
          </p>

          <div className="settings-grid three-col">
            <div className="option-card">
              <div className="inline-label">
                <Music4 size={16} />
                <span>Qualité audio</span>
              </div>
              <strong>192 kbps</strong>
            </div>
            <div className="option-card">
              <div className="inline-label">
                <Video size={16} />
                <span>Format</span>
              </div>
              <strong>MP3</strong>
            </div>
            <div className="option-card">
              <div className="inline-label">
                <FolderOpen size={16} />
                <span>Destination</span>
              </div>
              <strong>{destinationFolder || 'Aucun dossier choisi'}</strong>
            </div>
          </div>

          <div className="meta-row compact-row">
            <span>Suivi</span>
            <strong>
              {queuedCount > 0 ? `${queuedCount} conversion(s) en attente` : 'Aucune conversion en attente'}
            </strong>
          </div>
        </div>

        <div className="panel page-panel promo-panel">
          <div className="inline-label">
            <Download size={15} />
            <span>Les conversions apparaissent dans la liste des tâches</span>
          </div>
          <p>
            Une fois le téléchargement terminé, FFmpeg extrait la piste audio et écrit le fichier MP3
            dans le dossier choisi.
          </p>
        </div>
      </main>
    </div>
  )
}
