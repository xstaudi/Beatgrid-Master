import type { DjSoftware, Track } from '@/types/track'
import type { Playlist } from '@/types/playlist'

export interface ParseWarning {
  trackId?: string
  field: string
  message: string
}

export interface ParseResult {
  tracks: Track[]
  source: DjSoftware
  version: string
  totalTracks: number
  warnings: ParseWarning[]
}

export interface DirectoryImportResult extends ParseResult {
  playlists: Playlist[]
  importMode: 'directory'
}

export interface LibraryAdapter {
  parse(xmlContent: string): ParseResult
  readonly softwareType: DjSoftware
}

export type ProgressCallback = (status: string) => void

export interface DirectoryAdapter {
  readonly softwareType: DjSoftware
  readonly importMode: 'directory'
  parseDirectory(handle: FileSystemDirectoryHandle, onProgress?: ProgressCallback): Promise<DirectoryImportResult>
}
