import { parsePdb, tableRows, RekordboxPdb } from 'rekordbox-parser'
import type { Playlist } from '@/types/playlist'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdbRow = any

export interface PdbTrack {
  id: number
  title: string
  artist: string
  album: string
  genre: string
  composer: string
  label: string
  comment: string
  year: number | null
  rating: number
  duration: number
  bpm: number | null
  key: string | null
  bitrate: number
  sampleRate: number
  fileSize: number
  fileType: string
  filePath: string
  fileName: string
  analyzePath: string
  dateAdded: string | null
  playCount: number
}

export interface PdbParseResult {
  tracks: PdbTrack[]
  playlists: Playlist[]
}

function readString(field: PdbRow): string {
  if (!field) return ''
  const body = field.body
  if (!body) return ''
  return (body.text ?? body.value ?? '').toString().trim()
}

function getFileExtension(filePath: string): string {
  const dot = filePath.lastIndexOf('.')
  if (dot === -1) return ''
  return filePath.slice(dot + 1).toUpperCase()
}

export function parsePdbFile(data: ArrayBuffer): PdbParseResult {
  // Pass ArrayBuffer directly - KaitaiStream accepts it natively.
  // Do NOT use Buffer.from() as Buffer is not available in browsers.
  const pdb = parsePdb(data as unknown as Buffer)

  // Build lookup maps for FK resolution
  const artistMap = new Map<number, string>()
  const albumMap = new Map<number, string>()
  const genreMap = new Map<number, string>()
  const keyMap = new Map<number, string>()
  const labelMap = new Map<number, string>()

  const PageType = RekordboxPdb.PageType

  for (const table of pdb.tables) {
    const type = table.type

    switch (type) {
      case PageType.ARTISTS:
        for (const row of tableRows(table)) {
          artistMap.set(row.id, readString(row.name))
        }
        break
      case PageType.ALBUMS:
        for (const row of tableRows(table)) {
          albumMap.set(row.id, readString(row.name))
        }
        break
      case PageType.GENRES:
        for (const row of tableRows(table)) {
          genreMap.set(row.id, readString(row.name))
        }
        break
      case PageType.KEYS:
        for (const row of tableRows(table)) {
          keyMap.set(row.id, readString(row.name))
        }
        break
      case PageType.LABELS:
        for (const row of tableRows(table)) {
          labelMap.set(row.id, readString(row.name))
        }
        break
    }
  }

  // Parse tracks
  const tracks: PdbTrack[] = []
  const tracksTable = pdb.tables.find((t: PdbRow) => t.type === PageType.TRACKS)
  if (tracksTable) {
    for (const row of tableRows(tracksTable)) {
      const filePath = readString(row.filePath)
      const fileName = readString(row.filename) || filePath.split('/').pop() || ''
      const bpmRaw = row.tempo ? row.tempo / 100 : null

      tracks.push({
        id: row.id,
        title: readString(row.title),
        artist: artistMap.get(row.artistId) ?? '',
        album: albumMap.get(row.albumId) ?? '',
        genre: genreMap.get(row.genreId) ?? '',
        composer: artistMap.get(row.composerId) ?? '',
        label: labelMap.get(row.labelId) ?? '',
        comment: readString(row.comment),
        year: row.year > 0 ? row.year : null,
        rating: Math.min(5, Math.max(0, row.rating ?? 0)),
        duration: row.duration ?? 0,
        bpm: bpmRaw && bpmRaw > 0 ? bpmRaw : null,
        key: keyMap.get(row.keyId) ?? null,
        bitrate: row.bitrate ?? 0,
        sampleRate: row.sampleRate ?? 0,
        fileSize: row.fileSize ?? 0,
        fileType: getFileExtension(filePath),
        filePath,
        fileName,
        analyzePath: readString(row.analyzePath),
        dateAdded: readString(row.dateAdded) || null,
        playCount: row.playCount ?? 0,
      })
    }
  }

  // Parse playlists
  const playlists = parsePlaylistTree(pdb, PageType)

  return { tracks, playlists }
}

function parsePlaylistTree(pdb: PdbRow, PageType: typeof RekordboxPdb.PageType): Playlist[] {
  const treeRows: PdbRow[] = []
  const entryRows: PdbRow[] = []

  for (const table of pdb.tables) {
    if (table.type === PageType.PLAYLIST_TREE) {
      for (const row of tableRows(table)) {
        treeRows.push(row)
      }
    }
    if (table.type === PageType.PLAYLIST_ENTRIES) {
      for (const row of tableRows(table)) {
        entryRows.push(row)
      }
    }
  }

  // Group entries by playlist ID
  const entriesByPlaylist = new Map<number, number[]>()
  for (const entry of entryRows) {
    const list = entriesByPlaylist.get(entry.playlistId) ?? []
    list.push(entry.trackId)
    entriesByPlaylist.set(entry.playlistId, list)
  }

  return treeRows.map((row: PdbRow) => ({
    id: `pl-${row.id}`,
    name: readString(row.name),
    trackIds: (entriesByPlaylist.get(row.id) ?? []).map((tid: number) => `rb-usb-${tid}`),
    parentId: row.parentId > 0 ? `pl-${row.parentId}` : null,
    isFolder: row.isFolder ?? false,
  }))
}
