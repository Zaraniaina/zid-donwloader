export type TaskStatus = 'Downloading' | 'Queued' | 'Paused' | 'Completed' | 'Failed'

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
}

export const MAX_ACTIVE_TASKS = 1
export const STORAGE_KEYS = {
  tasks: 'zid-downloader.tasks',
  theme: 'zid-downloader.theme',
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
  },
  {
    id: 2,
    name: 'launch-demo.mp4',
    source: 'https://cdn.example.com/launch-demo.mp4',
    size: '860 MB',
    progress: 42,
    speed: 3.2,
    status: 'Queued',
    eta: '00:22:10',
    folder: 'Videos',
    category: 'Videos',
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

export function createTaskFromUrl(url: string): DownloadTask {
  const taskName = extractFileNameFromUrl(url)

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: taskName,
    source: url,
    size: '1.8 GB',
    progress: 12,
    speed: 2.1,
    status: 'Queued',
    eta: '00:19:58',
    folder: 'Downloads',
    category: 'Applications',
  }
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
