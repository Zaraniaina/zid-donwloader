import { Download, FolderOpen, Pause, Play, Video } from 'lucide-react'
import { formatBytes, getTotalBytes, type DownloadTask } from '../../lib/downloadQueue'

type TaskDetailsProps = {
  selectedTask?: DownloadTask
  onStartDownload: (taskId: number) => void
  onTogglePause: (taskId: number) => void
  onRemoveTask: (taskId: number) => void
  onOpenFolder: (folderPath?: string) => void
  onOpenFile: (task?: DownloadTask) => void
}

export function TaskDetails({ selectedTask, onStartDownload, onTogglePause, onRemoveTask, onOpenFolder, onOpenFile }: TaskDetailsProps) {
  if (!selectedTask) {
    return null
  }

  return (
    <>
      <div className="detail-header">
        <div className="detail-name-group">
          <div className="detail-icon">
            {selectedTask.mode === 'audio' ? <Video size={16} /> : <Download size={16} />}
          </div>
          <div>
            <h3>{selectedTask.name}</h3>
            <p>{selectedTask.category}</p>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div>
          <label>Taille</label>
          <strong>{getTotalBytes(selectedTask) > 0 ? formatBytes(getTotalBytes(selectedTask)) : selectedTask.size}</strong>
        </div>
        <div>
          <label>Progression</label>
          <strong>{selectedTask.progress}%</strong>
        </div>
        <div>
          <label>Vitesse</label>
          <strong>{selectedTask.speed.toFixed(1)} MB/s</strong>
        </div>
        <div>
          <label>ETA</label>
          <strong>{selectedTask.eta}</strong>
        </div>
      </div>

      <div className="detail-section">
        <div className="meta-row">
          <span>Emplacement</span>
          <strong>{selectedTask.folder}</strong>
        </div>
        <div className="meta-row">
          <span>Type</span>
          <strong>{selectedTask.mode === 'audio' ? 'Conversion MP3' : 'Téléchargement'}</strong>
        </div>
        <div className="meta-row">
          <span>Dernière vérif.</span>
          <strong>2 min ago</strong>
        </div>
        <div className="meta-row">
          <span>Statut</span>
          <strong>{selectedTask.message ?? 'Aucun message'}</strong>
        </div>
      </div>

      <div className="button-row">
        <button type="button" className="secondary-button action-button" onClick={() => onStartDownload(selectedTask.id)}>
          <Download size={14} />
          Lancer
        </button>
        <button type="button" className="secondary-button action-button" onClick={() => onTogglePause(selectedTask.id)}>
          {selectedTask.status === 'Paused' ? <Play size={14} /> : <Pause size={14} />}
          {selectedTask.status === 'Paused' ? 'Reprendre' : 'Pause'}
        </button>
        <button type="button" className="secondary-button action-button" onClick={() => onOpenFolder(selectedTask.folder)}>
          <FolderOpen size={14} />
          Ouvrir dossier
        </button>
        {selectedTask.status === 'Completed' ? (
          <button type="button" className="secondary-button action-button" onClick={() => onOpenFile(selectedTask)}>
            <Download size={14} />
            Ouvrir fichier
          </button>
        ) : null}
        <button type="button" className="secondary-button action-button" onClick={() => onRemoveTask(selectedTask.id)}>
          Supprimer
        </button>
      </div>
    </>
  )
}
