import { AlertTriangle, CheckCircle2, Pause, Play } from 'lucide-react'
import { formatBytes, getTotalBytes, type DownloadTask } from '../../lib/downloadQueue'

type TaskListProps = {
  tasks: DownloadTask[]
  selectedTask?: DownloadTask
  onSelect: (taskId: number) => void
}

export function TaskList({ tasks, selectedTask, onSelect }: TaskListProps) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
          onClick={() => onSelect(task.id)}
        >
          <div className="task-main">
            <div className={`task-badge ${task.status.toLowerCase()}`}>
              {task.status === 'Downloading' && <Play size={12} />}
              {task.status === 'Paused' && <Pause size={12} />}
              {task.status === 'Completed' && <CheckCircle2 size={12} />}
              {task.status === 'Failed' && <AlertTriangle size={12} />}
            </div>
            <div className="task-copy">
              <strong>{task.name}</strong>
              <span>{task.source}</span>
            </div>
          </div>

          <div className="task-meta">
            <span>{getTotalBytes(task) > 0 ? formatBytes(getTotalBytes(task)) : task.size}</span>
            <span>
              {task.mode === 'audio' ? 'MP3' : 'Fichier'} · {task.speed.toFixed(1)} MB/s
            </span>
          </div>

          <div className="progress-wrap">
            <div className="progress-bar">
              <span style={{ width: `${task.progress}%` }} />
            </div>
            <small>{task.progress}%</small>
          </div>
        </button>
      ))}
    </div>
  )
}
