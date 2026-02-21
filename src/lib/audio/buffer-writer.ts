import type { WriteBackResult } from '@/types/enrichment'

/**
 * Schreibt einen Audio-Buffer direkt via File System Access API (Chromium)
 * oder bietet ihn als Download an (Firefox/Safari Fallback).
 */
export async function writeAudioBuffer(
  file: File,
  buffer: Uint8Array,
  fileName: string,
): Promise<WriteBackResult> {
  try {
    const blob = new Blob([buffer.buffer as ArrayBuffer], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    return { success: true, method: 'download' }
  } catch (error) {
    return {
      success: false,
      method: 'failed',
      error: error instanceof Error ? error.message : 'Download fehlgeschlagen',
    }
  }
}
