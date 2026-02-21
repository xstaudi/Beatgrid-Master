import { create } from 'zustand'
import type { DjSoftware, Track, TempoMarker } from '@/types/track'
import type { Playlist } from '@/types/playlist'
import type { ParseWarning } from '@/lib/adapters/types'
import { createDirectoryAdapter, parseLibraryXml } from '@/lib/adapters'

type ImportMode = 'xml' | 'directory' | null

interface TrackStore {
  tracks: Track[]
  source: DjSoftware | null
  sourceVersion: string | null
  warnings: ParseWarning[]
  isLoading: boolean
  importedAt: Date | null
  rawXml: string | null
  playlists: Playlist[]
  activePlaylistId: string | null
  importMode: ImportMode

  importLibrary: (xmlContent: string) => void
  importUsbLibrary: (handle: FileSystemDirectoryHandle) => Promise<void>
  importPcLibrary: (handle: FileSystemDirectoryHandle) => Promise<void>
  importAudioFolder: (handle: FileSystemDirectoryHandle) => Promise<void>
  setActivePlaylist: (id: string | null) => void
  getActiveTracks: () => Track[]
  applyGeneratedBeatgrid: (trackId: string, markers: TempoMarker[]) => void
  updateTrackDuration: (trackId: string, duration: number) => void
  clearLibrary: () => void
  getTrackById: (id: string) => Track | undefined
}

export const useTrackStore = create<TrackStore>((set, get) => ({
  tracks: [],
  source: null,
  sourceVersion: null,
  warnings: [],
  isLoading: false,
  importedAt: null,
  rawXml: null,
  playlists: [],
  activePlaylistId: null,
  importMode: null,

  importLibrary: (xmlContent: string) => {
    set({ isLoading: true })
    try {
      const result = parseLibraryXml(xmlContent)
      set({
        tracks: result.tracks,
        source: result.source,
        sourceVersion: result.version,
        warnings: result.warnings,
        isLoading: false,
        importedAt: new Date(),
        rawXml: xmlContent,
        playlists: [],
        activePlaylistId: null,
        importMode: 'xml',
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  importUsbLibrary: async (handle: FileSystemDirectoryHandle) => {
    set({ isLoading: true })
    try {
      const adapter = createDirectoryAdapter('rekordbox-usb')
      const result = await adapter.parseDirectory(handle)
      set({
        tracks: result.tracks,
        source: result.source,
        sourceVersion: result.version,
        warnings: result.warnings,
        isLoading: false,
        importedAt: new Date(),
        rawXml: null,
        playlists: result.playlists,
        activePlaylistId: null,
        importMode: 'directory',
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  importPcLibrary: async (handle: FileSystemDirectoryHandle) => {
    set({ isLoading: true })
    try {
      const adapter = createDirectoryAdapter('rekordbox-pc')
      const result = await adapter.parseDirectory(handle)
      set({
        tracks: result.tracks,
        source: result.source,
        sourceVersion: result.version,
        warnings: result.warnings,
        isLoading: false,
        importedAt: new Date(),
        rawXml: null,
        playlists: result.playlists,
        activePlaylistId: null,
        importMode: 'directory',
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  importAudioFolder: async (handle: FileSystemDirectoryHandle) => {
    set({ isLoading: true })
    try {
      const adapter = createDirectoryAdapter('audio-folder')
      const result = await adapter.parseDirectory(handle)
      set({
        tracks: result.tracks,
        source: result.source,
        sourceVersion: result.version,
        warnings: result.warnings,
        isLoading: false,
        importedAt: new Date(),
        rawXml: null,
        playlists: [],
        activePlaylistId: null,
        importMode: 'directory',
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  applyGeneratedBeatgrid: (trackId, markers) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, tempoMarkers: markers } : t,
      ),
    }))
  },

  updateTrackDuration: (trackId, duration) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId && t.duration === 0 ? { ...t, duration } : t,
      ),
    }))
  },

  setActivePlaylist: (id: string | null) => {
    set({ activePlaylistId: id })
  },

  getActiveTracks: () => {
    const { tracks, activePlaylistId, playlists } = get()
    if (!activePlaylistId) return tracks

    const playlist = playlists.find((p) => p.id === activePlaylistId)
    if (!playlist) return tracks

    const trackIdSet = new Set(playlist.trackIds)
    return tracks.filter((t) => trackIdSet.has(t.id))
  },

  clearLibrary: () => {
    set({
      tracks: [],
      source: null,
      sourceVersion: null,
      warnings: [],
      isLoading: false,
      importedAt: null,
      rawXml: null,
      playlists: [],
      activePlaylistId: null,
      importMode: null,
    })
  },

  getTrackById: (id: string) => {
    return get().tracks.find((t) => t.id === id)
  },
}))
