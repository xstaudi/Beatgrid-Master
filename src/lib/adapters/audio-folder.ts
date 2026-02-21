import type { Track } from '@/types/track'
import type { DirectoryAdapter, DirectoryImportResult } from './types'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import { scanDirectoryForAudio } from '@/lib/audio/file-access'

export class AudioFolderAdapter implements DirectoryAdapter {
  readonly softwareType = 'audio-folder' as const
  readonly importMode = 'directory' as const

  async parseDirectory(handle: FileSystemDirectoryHandle): Promise<DirectoryImportResult> {
    const audioFiles = await scanDirectoryForAudio(handle)
    if (audioFiles.length === 0) {
      throw new Error('Keine Audio-Dateien im gewählten Ordner gefunden.')
    }

    const tracks = audioFiles.map((f, i) => createTrackFromFile(f, i))
    return {
      tracks,
      source: 'audio-folder',
      version: '1.0',
      totalTracks: tracks.length,
      warnings: [],
      playlists: [],
      importMode: 'directory',
    }
  }
}

function createTrackFromFile(file: AudioFileHandle, index: number): Track {
  const nameNoExt = file.name.replace(/\.[^.]+$/, '')
  const parts = nameNoExt.split(' - ')
  const artist = parts.length >= 2 ? parts[0].trim() : ''
  const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : nameNoExt
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  return {
    id: `af-${index}`,
    source: 'audio-folder',
    sourceId: String(index),
    title,
    artist,
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    duration: 0,
    bpm: null,
    key: null,
    bitrate: null,
    sampleRate: null,
    fileSize: file.size,
    filePath: file.name,
    fileName: file.name,
    fileType: ext,
    tempoMarkers: [],
    cuePoints: [],
    dateAdded: null,
  }
}
