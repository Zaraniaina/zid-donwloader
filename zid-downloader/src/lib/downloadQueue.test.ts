import { describe, expect, it } from 'vitest'

import {
  MAX_ACTIVE_TASKS,
  advanceDownloadQueue,
  buildDownloadPath,
  createTaskFromUrl,
  extractFileNameFromUrl,
} from './downloadQueue'

describe('download queue', () => {
  it('promotes queued tasks when a download slot is free', () => {
    const queuedTaskId = 42

    const nextTasks = advanceDownloadQueue([
      { id: 999, name: 'done.zip', source: 'https://example.com/done.zip', size: '500 MB', progress: 100, speed: 0, status: 'Completed', eta: '00:00:00', folder: 'Downloads', category: 'Archives' },
      { id: queuedTaskId, name: 'queued.zip', source: 'https://example.com/queued.zip', size: '700 MB', progress: 18, speed: 2.1, status: 'Queued', eta: '00:20:00', folder: 'Downloads', category: 'Archives' },
    ])

    const queuedItem = nextTasks.find((task) => task.id === queuedTaskId)
    expect(queuedItem?.status).toBe('Downloading')
    expect(nextTasks.filter((task) => task.status === 'Downloading').length).toBeLessThanOrEqual(MAX_ACTIVE_TASKS)
  })

  it('creates a download task from a valid URL', () => {
    const task = createTaskFromUrl('https://example.com/folder/file.zip')

    expect(task.name).toBe('file.zip')
    expect(task.status).toBe('Queued')
    expect(task.source).toBe('https://example.com/folder/file.zip')
  })

  it('extracts a clean file name from a URL with query parameters', () => {
    const fileName = extractFileNameFromUrl('https://example.com/folder/mon%20fichier.zip?download=1#section')

    expect(fileName).toBe('mon fichier.zip')
  })

  it('builds a safe local path for a file', () => {
    const path = buildDownloadPath('C:/Downloads', 'bad:name?.zip')

    expect(path).toBe('C:/Downloads/bad_name_.zip')
  })
})
