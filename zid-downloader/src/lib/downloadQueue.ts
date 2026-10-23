export type TaskStatus = 'Downloading' | 'Queued' | 'Paused' | 'Completed' | 'Failed'
export type TaskMode = 'download' | 'audio'

export type DownloadTask = {
  id: string
  name: string
  source: string
  progress: number
  speed: number
  eta: string
  status: TaskStatus
  folder: string
  category: string
  mode: TaskMode
  message?: string
  targetPath?: string
  downloadedBytes: number
  totalBytes: number
  createdAt: number
  completedAt?: number
}

export type TaskProgress = {
  id: string
  downloaded: number
  total: number
  bytesPerSecond: number
}

export const MAX_ACTIVE_TASKS = 1

export const STORAGE_KEYS = {
  tasks: 'zid-downloader.tasks',
  theme: 'zid-downloader.theme',
  folder: 'zid-downloader.folder',
  mode: 'zid-downloader.mode',
} as const

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 octet'
  }

  const units = ['o', 'Ko', 'Mo', 'Go', 'To']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '—'
  }

  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remaining = total % 60

  return [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':')
}

export function formatDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '—'
  }

  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case 'Downloading':
      return 'En cours'
    case 'Queued':
      return 'En attente'
    case 'Paused':
      return 'En pause'
    case 'Completed':
      return 'Terminé'
    case 'Failed':
      return 'Échec'
  }
}

export function isValidSourceUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function extractFileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname
    const fileName = pathname.split('/').filter(Boolean).pop() || 'fichier'
    return decodeURIComponent(fileName).replace(/[?#].*$/, '').trim() || 'fichier'
  } catch {
    const fallback = url.split('/').filter(Boolean).pop() || 'fichier'
    return decodeURIComponent(fallback).split('?')[0].split('#')[0].trim() || 'fichier'
  }
}

const VIDEO_PAGE_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'dailymotion.com',
  'tiktok.com',
  'soundcloud.com',
  'twitch.tv',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'reddit.com',
] as const

export function isVideoPageUrl(value: string): boolean {
  let parsed: URL

  try {
    parsed = new URL(value.trim())
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false
  }

  const host = parsed.hostname.toLowerCase()
  return VIDEO_PAGE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

export function buildDownloadPath(folder: string, fileName: string): string {
  const cleanFolder = folder.trim().replace(/[\\/]+$/, '')
  const cleanName = fileName.replace(/[\\/:*?"<>|]/g, '_')
  return `${cleanFolder || 'Downloads'}/${cleanName || 'fichier'}`
}

export function buildAudioPath(folder: string, fileName: string): string {
  const cleanFile = (fileName || 'video.mp4').replace(/[\\/:*?"<>|]/g, '_')
  const withoutExtension = cleanFile.includes('.') ? cleanFile.replace(/\.[^.]+$/, '') : cleanFile
  return `${(folder || 'Downloads').trim().replace(/[\\/]+$/, '')}/${withoutExtension}.mp3`
}

function createId(): string {
  const webCrypto = globalThis.crypto
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

export function createTaskFromUrl(url: string, mode: TaskMode, destinationFolder: string): DownloadTask {
  const source = url.trim()
  const rawName =
    mode === 'audio' && isVideoPageUrl(source)
      ? 'audio YouTube'
      : extractFileNameFromUrl(source)
  const safeName = mode === 'audio' ? `${rawName.replace(/\.[^.]+$/, '')}.mp3` : rawName
  const folder = destinationFolder.trim() || 'Downloads'
  const targetPath = mode === 'audio' ? buildAudioPath(folder, safeName) : buildDownloadPath(folder, safeName)

  return {
    id: createId(),
    name: safeName,
    source,
    progress: 0,
    speed: 0,
    eta: '—',
    status: 'Queued',
    folder,
    category: mode === 'audio' ? 'Audio' : 'Fichiers',
    mode,
    message: mode === 'audio' ? 'En attente de conversion' : 'En attente',
    targetPath,
    downloadedBytes: 0,
    totalBytes: 0,
    createdAt: Date.now(),
  }
}

export function applyProgress(task: DownloadTask, progress: TaskProgress): DownloadTask {
  if (task.status !== 'Downloading') {
    return task
  }

  const total = progress.total > 0 ? progress.total : task.totalBytes
  const percent = total > 0 ? Math.min(99, Math.floor((progress.downloaded / total) * 100)) : 0
  const remaining =
    total > 0 && progress.bytesPerSecond > 0
      ? Math.max(0, (total - progress.downloaded) / progress.bytesPerSecond)
      : 0

  return {
    ...task,
    downloadedBytes: progress.downloaded,
    totalBytes: total,
    progress: percent,
    speed: progress.bytesPerSecond / (1024 * 1024),
    eta: remaining > 0 ? formatDuration(remaining) : '—',
  }
}

export function applyPhase(task: DownloadTask, phase: string): DownloadTask {
  if (phase !== 'convert' || task.status !== 'Downloading') {
    return task
  }

  return { ...task, progress: 99, speed: 0, eta: '—', message: 'Conversion MP3 en cours' }
}

function isStoredTask(value: unknown): value is DownloadTask {
  if (!value || typeof value !== 'object') {
    return false
  }

  const task = value as Partial<DownloadTask>
  return typeof task.id === 'string' && typeof task.source === 'string' && typeof task.name === 'string'
}

export function getStoredTasks(): DownloadTask[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.tasks)
    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isStoredTask).map((task) =>
      task.status === 'Downloading'
        ? { ...task, status: 'Paused', speed: 0, eta: '—', message: 'Interrompu à la fermeture' }
        : task,
    )
  } catch {
    return []
  }
}

export function saveTasks(tasks: DownloadTask[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
}
