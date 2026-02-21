import type { CuePoint, TempoMarker, Track } from '@/types/track'
import type { Playlist } from '@/types/playlist'
import type { DirectoryAdapter, DirectoryImportResult, ParseWarning } from './types'
import { attr, decodeRekordboxPath, normalizeRating, safeParseFloat, safeParseInt } from '@/lib/utils/parse-helpers'

function parseTempoMarkers(trackEl: Element): TempoMarker[] {
  const markers: TempoMarker[] = []
  for (const t of trackEl.querySelectorAll('TEMPO')) {
    const bpm = safeParseFloat(attr(t, 'Bpm'))
    if (bpm == null || bpm <= 0) continue
    markers.push({
      position: safeParseFloat(attr(t, 'Inizio')) ?? 0,
      bpm,
      meter: attr(t, 'Metro') || '4/4',
      beat: safeParseInt(attr(t, 'Battito')) ?? 1,
    })
  }
  return markers
}

function parseCueType(typeNum: number): CuePoint['type'] {
  switch (typeNum) {
    case 1: return 'fadein'
    case 2: return 'fadeout'
    case 3: return 'loop'
    case 4: return 'grid'
    default: return 'cue'
  }
}

function parseCuePoints(trackEl: Element): CuePoint[] {
  const cues: CuePoint[] = []
  for (const m of trackEl.querySelectorAll('POSITION_MARK')) {
    const start = safeParseFloat(attr(m, 'Start'))
    if (start == null) continue
    const cue: CuePoint = {
      name: attr(m, 'Name'),
      type: parseCueType(safeParseInt(attr(m, 'Type')) ?? 0),
      start,
      hotcue: safeParseInt(attr(m, 'Num')) ?? -1,
    }
    const end = safeParseFloat(attr(m, 'End'))
    if (end != null) cue.end = end
    const r = safeParseInt(attr(m, 'Red'))
    const g = safeParseInt(attr(m, 'Green'))
    const b = safeParseInt(attr(m, 'Blue'))
    if (r != null && g != null && b != null) cue.color = { r, g, b }
    cues.push(cue)
  }
  return cues
}

function parseTrack(trackEl: Element, warnings: ParseWarning[]): Track {
  const sourceId = attr(trackEl, 'TrackID')
  const location = attr(trackEl, 'Location')
  if (!location) {
    warnings.push({ trackId: sourceId, field: 'Location', message: 'Missing file location' })
  }
  const filePath = location ? decodeRekordboxPath(location) : ''
  const fileName = filePath.split('/').pop() ?? ''
  return {
    id: `rb-${sourceId}`,
    source: 'rekordbox-pc',
    sourceId,
    title: attr(trackEl, 'Name'),
    artist: attr(trackEl, 'Artist'),
    album: attr(trackEl, 'Album'),
    genre: attr(trackEl, 'Genre'),
    composer: attr(trackEl, 'Composer'),
    label: attr(trackEl, 'Label'),
    comment: attr(trackEl, 'Comments'),
    year: safeParseInt(attr(trackEl, 'Year')),
    rating: normalizeRating(safeParseInt(attr(trackEl, 'Rating')) ?? 0),
    duration: safeParseFloat(attr(trackEl, 'TotalTime')) ?? 0,
    bpm: safeParseFloat(attr(trackEl, 'AverageBpm')),
    key: attr(trackEl, 'Tonality') || null,
    bitrate: safeParseInt(attr(trackEl, 'BitRate')),
    sampleRate: safeParseInt(attr(trackEl, 'SampleRate')),
    fileSize: safeParseInt(attr(trackEl, 'Size')),
    fileType: attr(trackEl, 'Kind').replace(' File', '').replace(' file', ''),
    filePath,
    fileName,
    tempoMarkers: parseTempoMarkers(trackEl),
    cuePoints: parseCuePoints(trackEl),
    dateAdded: attr(trackEl, 'DateAdded') || null,
  }
}

function parsePlaylists(doc: Document): Playlist[] {
  const playlists: Playlist[] = []
  const rootNode = doc.querySelector('PLAYLISTS > NODE')
  if (!rootNode) return playlists

  let idCounter = 0

  function processChildren(parentEl: Element, parentId: string | null) {
    for (const node of parentEl.children) {
      if (node.tagName !== 'NODE') continue
      const type = node.getAttribute('Type')
      const name = node.getAttribute('Name') ?? ''
      const id = `pl-${++idCounter}`
      if (type === '1') {
        const trackIds = Array.from(node.querySelectorAll('TRACK'))
          .map((t) => `rb-${t.getAttribute('Key')}`)
          .filter((k) => k !== 'rb-')
        playlists.push({ id, name, trackIds, parentId, isFolder: false })
      } else if (type === '0') {
        playlists.push({ id, name, trackIds: [], parentId, isFolder: true })
        processChildren(node, id)
      }
    }
  }

  processChildren(rootNode, null)
  return playlists
}

export class RekordboxPcAdapter implements DirectoryAdapter {
  readonly softwareType = 'rekordbox-pc' as const
  readonly importMode = 'directory' as const

  async parseDirectory(handle: FileSystemDirectoryHandle): Promise<DirectoryImportResult> {
    const xmlContent = await this.findXml(handle)
    if (!xmlContent) {
      throw new Error(
        'rekordbox.xml nicht gefunden. Wähle den Ordner, der rekordbox.xml enthält (z.B. Musik → rekordbox).'
      )
    }
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) throw new Error(`Invalid XML: ${parserError.textContent}`)

    const version = doc.querySelector('PRODUCT')?.getAttribute('Version') ?? 'unknown'
    const warnings: ParseWarning[] = []
    const tracks: Track[] = []

    for (const el of doc.querySelectorAll('COLLECTION > TRACK')) {
      tracks.push(parseTrack(el, warnings))
    }

    return {
      tracks,
      source: 'rekordbox-pc',
      version,
      totalTracks: tracks.length,
      warnings,
      playlists: parsePlaylists(doc),
      importMode: 'directory',
    }
  }

  private async findXml(handle: FileSystemDirectoryHandle): Promise<string | null> {
    try {
      const file = await (await handle.getFileHandle('rekordbox.xml')).getFile()
      return await file.text()
    } catch {
      return null
    }
  }
}
