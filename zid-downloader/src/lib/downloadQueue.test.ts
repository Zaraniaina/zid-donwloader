import { describe, expect, it } from 'vitest'

import {
  applyPhase,
  applyProgress,
  buildAudioPath,
  buildDownloadPath,
  createTaskFromUrl,
  extractFileNameFromUrl,
  formatBytes,
  formatDuration,
  isValidSourceUrl,
  type DownloadTask,
} from './downloadQueue'

function makeTask(overrides: Partial<DownloadTask> = {}): DownloadTask {
  return {
    id: 'task-1',
    name: 'fichier.zip',
    source: 'https://example.com/fichier.zip',
    progress: 0,
    speed: 0,
    eta: '—',
    status: 'Downloading',
    folder: 'C:/Downloads',
    category: 'Fichiers',
    mode: 'download',
    downloadedBytes: 0,
    totalBytes: 0,
    createdAt: 0,
    ...overrides,
  }
}

describe('download tasks', () => {
  it('creates a queued download task with a safe target path', () => {
    const task = createTaskFromUrl('https://example.com/dossier/fichier.zip', 'download', 'C:/Downloads')

    expect(task.name).toBe('fichier.zip')
    expect(task.status).toBe('Queued')
    expect(task.source).toBe('https://example.com/dossier/fichier.zip')
    expect(task.targetPath).toBe('C:/Downloads/fichier.zip')
    expect(task.totalBytes).toBe(0)
  })

  it('turns a video name into an mp3 target', () => {
    const task = createTaskFromUrl('https://example.com/clip.mp4', 'audio', 'C:/Audio')

    expect(task.name).toBe('clip.mp3')
    expect(task.targetPath).toBe('C:/Audio/clip.mp3')
    expect(task.mode).toBe('audio')
  })

  it('maps real transfer events to percent, speed and eta', () => {
    const task = makeTask({ totalBytes: 10_000_000 })
    const next = applyProgress(task, {
      id: task.id,
      downloaded: 2_500_000,
      total: 10_000_000,
      bytesPerSecond: 1_048_576,
    })

    expect(next.progress).toBe(25)
    expect(next.downloadedBytes).toBe(2_500_000)
    expect(Math.round(next.speed)).toBe(1)
    expect(next.eta).toBe('00:00:07')
  })

  it('never reports 100% before the backend confirms completion', () => {
    const task = makeTask({ totalBytes: 100 })
    const next = applyProgress(task, { id: task.id, downloaded: 100, total: 100, bytesPerSecond: 10 })

    expect(next.progress).toBe(99)
  })

  it('ignores progress for tasks that are not running', () => {
    const task = makeTask({ status: 'Paused' })
    const next = applyProgress(task, { id: task.id, downloaded: 50, total: 100, bytesPerSecond: 5 })

    expect(next).toBe(task)
  })

  it('marks the audio conversion phase', () => {
    const task = makeTask({ mode: 'audio' })
    const next = applyPhase(task, 'convert')

    expect(next.progress).toBe(99)
    expect(next.message).toBe('Conversion MP3 en cours')
  })

  it('accepts only http and https sources', () => {
    expect(isValidSourceUrl('https://example.com/file.zip')).toBe(true)
    expect(isValidSourceUrl('http://example.com/file.zip')).toBe(true)
    expect(isValidSourceUrl('file:///etc/passwd')).toBe(false)
    expect(isValidSourceUrl('javascript:alert(1)')).toBe(false)
    expect(isValidSourceUrl('pas une url')).toBe(false)
  })
})

describe('path helpers', () => {
  it('builds a safe local path for a file', () => {
    expect(buildDownloadPath('C:/Downloads', 'bad:name?.zip')).toBe('C:/Downloads/bad_name_.zip')
  })

  it('builds a safe MP3 destination for a video task', () => {
    expect(buildAudioPath('C:/Downloads', 'video.mp4')).toBe('C:/Downloads/video.mp3')
  })

  it('extracts a clean file name from a URL with query parameters', () => {
    expect(extractFileNameFromUrl('https://example.com/folder/mon%20fichier.zip?download=1#section')).toBe(
      'mon fichier.zip',
    )
  })
})

describe('formatters', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(0)).toBe('0 octet')
    expect(formatBytes(1024)).toBe('1.0 Ko')
    expect(formatBytes(2_500_000)).toBe('2.4 Mo')
  })

  it('formats durations as hours, minutes and seconds', () => {
    expect(formatDuration(0)).toBe('—')
    expect(formatDuration(92)).toBe('00:01:32')
    expect(formatDuration(3_725)).toBe('01:02:05')
  })
})
