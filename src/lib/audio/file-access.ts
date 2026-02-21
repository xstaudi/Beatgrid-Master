import { fileOpen, directoryOpen } from 'browser-fs-access'
import type { Track } from '@/types/track'

// --- XML File Access (existing) ---

export interface OpenXmlResult {
  content: string
  fileName: string
}

export async function openXmlFile(): Promise<OpenXmlResult> {
  const file = await fileOpen({
    mimeTypes: ['text/xml', 'application/xml'],
    extensions: ['.xml', '.nml'],
    description: 'DJ Library Files',
  })

  const content = await file.text()
  return { content, fileName: file.name }
}

// --- Audio File Access ---

export interface AudioFileHandle {
  file: File
  name: string
  size: number
}

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.ogg', '.aac', '.m4a', '.wav', '.aiff', '.aif']

/** Filenames starting with these prefixes are auxiliary/system files, not real tracks */
function isAuxiliaryFile(name: string): boolean {
  return name.startsWith('_') || name.startsWith('.')
}

export function getAudioExtensions(): string[] {
  return [...AUDIO_EXTENSIONS]
}

/**
 * Opens a directory picker and returns all audio files found.
 * Uses File System Access API with browser-fs-access fallback.
 */
export async function openAudioDirectory(): Promise<AudioFileHandle[]> {
  const files = await directoryOpen({
    recursive: true,
  })

  return files
    .filter((file) => {
      if (isAuxiliaryFile(file.name)) return false
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      return AUDIO_EXTENSIONS.includes(ext)
    })
    .map((file) => ({
      file,
      name: file.name,
      size: file.size,
    }))
}

/**
 * Scans a FileSystemDirectoryHandle recursively for audio files.
 * Used for USB import where we already have the directory handle.
 */
export async function scanDirectoryForAudio(
  dirHandle: FileSystemDirectoryHandle
): Promise<AudioFileHandle[]> {
  const results: AudioFileHandle[] = []

  async function walk(handle: FileSystemDirectoryHandle) {
    for await (const [name, entry] of handle.entries()) {
      try {
        if (entry.kind === 'file') {
          if (isAuxiliaryFile(name)) continue
          const ext = '.' + name.split('.').pop()?.toLowerCase()
          if (AUDIO_EXTENSIONS.includes(ext)) {
            // Use the entry directly as FileSystemFileHandle (from entries() iterator)
            const file = await (entry as FileSystemFileHandle).getFile()
            results.push({ file, name: file.name, size: file.size })
          }
        } else if (entry.kind === 'directory') {
          await walk(entry as FileSystemDirectoryHandle)
        }
      } catch {
        // Skip inaccessible files/dirs (e.g. read-only FS edge cases)
      }
    }
  }

  await walk(dirHandle)
  return results
}

/**
 * Reads an audio file as ArrayBuffer for decoding.
 */
export async function readAudioFile(handle: AudioFileHandle): Promise<ArrayBuffer> {
  return handle.file.arrayBuffer()
}

/**
 * Matches XML tracks to local audio files by filename (case-insensitive).
 * Returns a Map of trackId → AudioFileHandle.
 */
export function matchTracksToFiles(
  tracks: Track[],
  audioFiles: AudioFileHandle[],
): Map<string, AudioFileHandle> {
  const filesByName = new Map<string, AudioFileHandle>()
  for (const af of audioFiles) {
    filesByName.set(af.name.toLowerCase(), af)
  }

  const result = new Map<string, AudioFileHandle>()
  for (const track of tracks) {
    const match = filesByName.get(track.fileName.toLowerCase())
    if (match) {
      result.set(track.id, match)
    }
  }
  return result
}
