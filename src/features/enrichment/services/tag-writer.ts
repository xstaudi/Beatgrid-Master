import type { WriteBackResult } from '@/types/enrichment'

let taglibModule: typeof import('taglib-wasm') | null = null

async function getTaglib() {
  if (!taglibModule) {
    taglibModule = await import('taglib-wasm')
  }
  return taglibModule
}

/**
 * Pruefe ob File System Access API verfuegbar ist (Chromium-only).
 */
export function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

/**
 * Tags in eine Audio-Datei schreiben.
 *
 * Chromium: Schreibt direkt via File System Access API (wenn FileHandle vorhanden).
 * Fallback: Download der modifizierten Datei.
 */
export async function writeTagsToFile(
  fileHandle: FileSystemFileHandle | File,
  tags: Record<string, string | number>,
): Promise<WriteBackResult> {
  try {
    const taglib = await getTaglib()

    // Datei lesen
    let fileBuffer: ArrayBuffer
    let fileName: string

    if ('getFile' in fileHandle) {
      // FileSystemFileHandle (File System Access API)
      const file = await fileHandle.getFile()
      fileBuffer = await file.arrayBuffer()
      fileName = file.name
    } else {
      // File Object (Fallback)
      fileBuffer = await fileHandle.arrayBuffer()
      fileName = fileHandle.name
    }

    // Tags schreiben via taglib-wasm
    const modifiedBuffer = taglib.writeTags(
      new Uint8Array(fileBuffer),
      tags,
    )

    if (!modifiedBuffer) {
      return { success: false, method: 'failed', error: 'taglib-wasm writeTags fehlgeschlagen' }
    }

    // Schreiben: File System Access API oder Download
    if ('getFile' in fileHandle && 'createWritable' in fileHandle) {
      try {
        const writable = await fileHandle.createWritable()
        await writable.write(modifiedBuffer.buffer as ArrayBuffer)
        await writable.close()
        return { success: true, method: 'filesystem-api' }
      } catch (error) {
        // Permission denied oder anderer Fehler - Fallback auf Download
        return downloadFile(modifiedBuffer, fileName)
      }
    }

    // Fallback: Download
    return downloadFile(modifiedBuffer, fileName)
  } catch (error) {
    return {
      success: false,
      method: 'failed',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Schreiben',
    }
  }
}

/**
 * Datei als Download anbieten (Firefox/Safari Fallback).
 */
function downloadFile(buffer: Uint8Array, fileName: string): WriteBackResult {
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

/**
 * Batch Write-Back: Tags in mehrere Dateien schreiben.
 */
export async function writeTagsBatch(
  entries: Array<{
    fileHandle: FileSystemFileHandle | File
    tags: Record<string, string | number>
  }>,
  onProgress?: (completed: number, total: number) => void,
): Promise<WriteBackResult[]> {
  const results: WriteBackResult[] = []

  for (let i = 0; i < entries.length; i++) {
    const result = await writeTagsToFile(entries[i].fileHandle, entries[i].tags)
    results.push(result)
    onProgress?.(i + 1, entries.length)
  }

  return results
}
