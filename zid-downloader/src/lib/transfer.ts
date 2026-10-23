import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

import type { TaskMode, TaskProgress } from './downloadQueue'

export const CANCELLED_MARKER = '__cancelled__'

export type TransferPhase = { id: string; phase: string }

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function startTransfer(input: { id: string; url: string; path: string; mode: TaskMode }): Promise<string> {
  if (!isTauri()) {
    return Promise.reject(new Error('Les téléchargements nécessitent l’application desktop (npm run tauri dev).'))
  }

  const command = input.mode === 'audio' ? 'download_and_convert_to_mp3' : 'download_file'

  return invoke<string>(command, { id: input.id, url: input.url, path: input.path })
}

export async function cancelTransfer(id: string): Promise<void> {
  if (!isTauri()) {
    return
  }

  try {
    await invoke('cancel_download', { id })
  } catch {
    // le transfert est peut-être déjà terminé
  }
}

export async function watchProgress(handler: (progress: TaskProgress) => void): Promise<UnlistenFn> {
  if (!isTauri()) {
    return () => {}
  }

  return listen<TaskProgress>('transfer://progress', (event) => handler(event.payload))
}

export async function watchPhase(handler: (phase: TransferPhase) => void): Promise<UnlistenFn> {
  if (!isTauri()) {
    return () => {}
  }

  return listen<TransferPhase>('transfer://phase', (event) => handler(event.payload))
}

export function isCancelled(error: unknown): boolean {
  return typeof error === 'string' && error.includes(CANCELLED_MARKER)
}

export function errorMessage(error: unknown, fallback = 'Le transfert a échoué.'): string {
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export async function checkFfmpeg(): Promise<boolean> {
  if (!isTauri()) {
    return false
  }

  try {
    return await invoke<boolean>('check_ffmpeg')
  } catch {
    return false
  }
}

export async function checkYtDlp(): Promise<boolean> {
  if (!isTauri()) {
    return false
  }

  try {
    return await invoke<boolean>('check_yt_dlp')
  } catch {
    return false
  }
}
