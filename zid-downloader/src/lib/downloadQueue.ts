export type TaskStatus = 'Downloading' | 'Queued' | 'Paused' | 'Completed' | 'Failed'
export type TaskMode = 'download' | 'audio'

export type DownloadTask = {
  id: number
  name: string
  source: string
  size: string
  progress: number
  speed: number
  status: TaskStatus
  eta: string
  folder: string
  category: string
  mode: TaskMode
  message?: string
  targetPath?: string
  downloadedBytes?: number
  totalBytes?: number
}

export const MAX_ACTIVE_TASKS = 1
export const STORAGE_KEYS = {
  tasks: 'zid-downloader.tasks',
  theme: 'zid-downloader.theme',
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

export const defaultTasks: DownloadTask[] = [
  {
    id: 1,
    name: 'project-setup.zip',
    source: 'https://cdn.example.com/project-setup.zip',
    size: '2.1 GB',
    progress: 68,
    speed: 4.7,
    status: 'Downloading',
    eta: '00:11:42',
    folder: 'Downloads',
    category: 'Archives',
    mode: 'download',
    message: 'Téléchargement en cours',
    downloadedBytes: 1_400_000_000,
    totalBytes: 2_100_000_000,
  },
  {
    id: 2,
    name: 'launch-demo.mp3',
    source: 'https://cdn.example.com/launch-demo.mp3',
    size: '24 MB',
    progress: 42,
    speed: 3.2,
    status: 'Queued',
    eta: '00:22:10',
    folder: 'Audio',
    category: 'Audio',
    mode: 'audio',
    message: 'Conversion MP3 en attente',
    downloadedBytes: 10_000_000,
    totalBytes: 24_000_000,
  },
  {
    id: 3,
    name: 'design-system.pdf',
    source: 'https://cdn.example.com/design-system.pdf',
    size: '540 MB',
    progress: 100,
    speed: 0,
    status: 'Completed',
    eta: '00:00:00',
    folder: 'Documents',
    category: 'Documents',
    mode: 'download',
    message: 'Téléchargement terminé',
    downloadedBytes: 540_000_000,
    totalBytes: 540_000_000,
  },
]

export function extractFileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname
    const fileName = pathname.split('/').filter(Boolean).pop() || 'download.bin'
    return decodeURIComponent(fileName).replace(/[?#].*$/, '').trim() || 'download.bin'
  } catch {
    const fallback = url.split('/').filter(Boolean).pop() || 'download.bin'
    return decodeURIComponent(fallback).split('?')[0].split('#')[0].trim() || 'download.bin'
  }
}

export function buildDownloadPath(folder: string, fileName: string): string {
  const cleanFolder = folder.trim().replace(/[\\/]+$/, '')
  const cleanName = fileName.replace(/[\\/:*?"<>|]/g, '_')
  return `${cleanFolder || 'Downloads'}/${cleanName || 'download.bin'}`
}

export function buildAudioPath(folder: string, fileName: string): string {
  const cleanFile = (fileName || 'download.mp4').replace(/[\\/:*?"<>|]/g, '_')
  const withoutExtension = cleanFile.includes('.') ? cleanFile.replace(/\.[^.]+$/, '') : cleanFile
  return `${(folder || 'Downloads').trim().replace(/[\\/]+$/, '')}/${withoutExtension}.mp3`
}

export function createTaskFromUrl(url: string, mode: TaskMode = 'download', destinationFolder = 'Downloads'): DownloadTask {
  const rawName = extractFileNameFromUrl(url)
  const safeName = mode === 'audio' ? rawName.replace(/\.[^.]+$/, '.mp3') : rawName
  const resolvedFolder = destinationFolder?.trim() || (mode === 'audio' ? 'Audio' : 'Downloads')
  const targetPath = mode === 'audio' ? buildAudioPath(resolvedFolder, safeName) : buildDownloadPath(resolvedFolder, safeName)

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: safeName || 'download.bin',
    source: url,
    size: mode === 'audio' ? '24 MB' : '1.8 GB',
    progress: 0,
    speed: 0,
    status: 'Queued',
    eta: '00:19:58',
    folder: resolvedFolder,
    category: mode === 'audio' ? 'Audio' : 'Applications',
    mode,
    message: mode === 'audio' ? 'Conversion MP3 en attente' : 'Téléchargement en attente',
    targetPath,
    downloadedBytes: 0,
    totalBytes: mode === 'audio' ? 24 * 1024 * 1024 : 1_800 * 1024 * 1024,
  }
}

export function getTotalBytes(task: DownloadTask): number {
  return task.totalBytes ?? 0
}

export function getDownloadedBytes(task: DownloadTask): number {
  return task.downloadedBytes ?? 0
}

export function advanceDownloadQueue(currentTasks: DownloadTask[]): DownloadTask[] {
  let nextTasks = currentTasks.map((task) => {
    if (task.status !== 'Downloading') {
      return task
    }

    const nextProgress = Math.min(task.progress + 6, 100)
    const nextStatus: TaskStatus = nextProgress >= 100 ? 'Completed' : 'Downloading'

    return {
      ...task,
      progress: nextProgress,
      status: nextStatus,
      speed: nextStatus === 'Completed' ? 0 : Number((task.speed * 1.08 + 0.2).toFixed(1)),
      eta: nextStatus === 'Completed' ? '00:00:00' : task.eta,
    }
  })

  const activeCount = nextTasks.filter((task) => task.status === 'Downloading').length
  if (activeCount < MAX_ACTIVE_TASKS) {
    const nextQueuedTask = nextTasks.find((task) => task.status === 'Queued')
    if (nextQueuedTask) {
      nextTasks = nextTasks.map((task) =>
        task.id === nextQueuedTask.id
          ? {
              ...task,
              status: 'Downloading',
              speed: 2.8,
              eta: '00:09:18',
            }
          : task,
      )
    }
  }

  return nextTasks
}

export function getStoredTasks(): DownloadTask[] {
  if (typeof window === 'undefined') {
    return defaultTasks
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.tasks)
    if (!raw) {
      return defaultTasks
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultTasks
    }

    return parsed as DownloadTask[]
  } catch {
    return defaultTasks
  }
}

export function saveTasks(tasks: DownloadTask[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
}
