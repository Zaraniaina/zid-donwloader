import { AlertTriangle, CheckCircle2, Clock3, Pause, Play } from 'lucide-react'

import { formatBytes, type DownloadTask } from '../../lib/downloadQueue'

type TaskListProps = {
  tasks: DownloadTask[]
  selectedTask?: DownloadTask
  onSelect: (taskId: string) => void
  emptyLabel: string
}

export function TaskList({ tasks, selectedTask, onSelect, emptyLabel }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="empty-state" role="status">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
          aria-current={selectedTask?.id === task.id ? 'true' : undefined}
          onClick={() => onSelect(task.id)}
        >
          <div className="task-main">
            <div className={`task-badge ${task.status.toLowerCase()}`}>
              {task.status === 'Downloading' && <Play size={12} />}
              {task.status === 'Paused' && <Pause size={12} />}
              {task.status === 'Completed' && <CheckCircle2 size={12} />}
              {task.status === 'Failed' && <AlertTriangle size={12} />}
              {task.status === 'Queued' && <Clock3 size={12} />}
            </div>
            <div className="task-copy">
              <strong>{task.name}</strong>
              <span>{task.message ?? task.source}</span>
            </div>
          </div>

          <div className="task-meta">
            <span>{task.totalBytes > 0 ? formatBytes(task.totalBytes) : 'taille inconnue'}</span>
            <span>
              {task.mode === 'audio' ? 'MP3' : 'Fichier'} ·{' '}
              {task.speed > 0 ? `${task.speed.toFixed(1)} Mo/s` : task.eta}
            </span>
          </div>

          <div className="progress-wrap">
            <div
              className="progress-bar"
              role="progressbar"
              aria-label={`Progression de ${task.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={task.progress}
            >
              <span style={{ width: `${task.progress}%` }} />
            </div>
            <small>{task.progress}%</small>
          </div>
        </button>
      ))}
    </div>
  )
}
