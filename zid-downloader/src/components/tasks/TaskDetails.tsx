import { Download, FolderOpen, Pause, Play, RotateCcw, Trash2, Video } from 'lucide-react'

import { formatBytes, formatDate, type DownloadTask } from '../../lib/downloadQueue'

type TaskDetailsProps = {
  selectedTask?: DownloadTask
  onStartDownload: (taskId: string) => void
  onTogglePause: (taskId: string) => void
  onRemoveTask: (taskId: string) => void
  onOpenFolder: (folderPath?: string) => void
  onOpenFile: (task?: DownloadTask) => void
}

export function TaskDetails({
  selectedTask,
  onStartDownload,
  onTogglePause,
  onRemoveTask,
  onOpenFolder,
  onOpenFile,
}: TaskDetailsProps) {
  if (!selectedTask) {
    return (
      <p className="empty-state" role="status">
        Ajoutez ou sélectionnez une tâche pour voir son détail.
      </p>
    )
  }

  const canPause = selectedTask.status === 'Downloading' || selectedTask.status === 'Queued'
  const canRestart = selectedTask.status === 'Paused' || selectedTask.status === 'Failed'

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
          <strong>
            {selectedTask.totalBytes > 0 ? formatBytes(selectedTask.totalBytes) : 'inconnue'}
          </strong>
        </div>
        <div>
          <label>Progression</label>
          <strong>{selectedTask.progress}%</strong>
        </div>
        <div>
          <label>Vitesse</label>
          <strong>{selectedTask.speed > 0 ? `${selectedTask.speed.toFixed(1)} Mo/s` : '—'}</strong>
        </div>
        <div>
          <label>Temps restant</label>
          <strong>{selectedTask.status === 'Downloading' ? selectedTask.eta : '—'}</strong>
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
          <span>Ajouté le</span>
          <strong>{formatDate(selectedTask.createdAt)}</strong>
        </div>
        <div className="meta-row">
          <span>Statut</span>
          <strong>{selectedTask.message ?? 'Aucun message'}</strong>
        </div>
      </div>

      <div className="button-row">
        {canPause ? (
          <button
            type="button"
            className="secondary-button action-button"
            onClick={() => onTogglePause(selectedTask.id)}
          >
            <Pause size={14} />
            Pause
          </button>
        ) : null}

        {canRestart ? (
          <button
            type="button"
            className="secondary-button action-button"
            onClick={() => onStartDownload(selectedTask.id)}
          >
            {selectedTask.status === 'Failed' ? <RotateCcw size={14} /> : <Play size={14} />}
            {selectedTask.status === 'Failed' ? 'Réessayer' : 'Reprendre'}
          </button>
        ) : null}

        <button
          type="button"
          className="secondary-button action-button"
          onClick={() => onOpenFolder(selectedTask.folder)}
        >
          <FolderOpen size={14} />
          Dossier
        </button>

        {selectedTask.status === 'Completed' ? (
          <button
            type="button"
            className="secondary-button action-button"
            onClick={() => onOpenFile(selectedTask)}
          >
            <Download size={14} />
            Ouvrir
          </button>
        ) : null}

        <button
          type="button"
          className="secondary-button action-button"
          onClick={() => onRemoveTask(selectedTask.id)}
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>
    </>
  )
}
