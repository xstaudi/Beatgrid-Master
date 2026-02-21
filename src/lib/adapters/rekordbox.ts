import type { CuePoint, TempoMarker, Track } from '@/types/track'
import type { LibraryAdapter, ParseResult, ParseWarning } from './types'
import {
  attr,
  decodeRekordboxPath,
  normalizeRating,
  safeParseFloat,
  safeParseInt,
} from '@/lib/utils/parse-helpers'

function parseTempoMarkers(trackEl: Element): TempoMarker[] {
  const tempos = trackEl.querySelectorAll('TEMPO')
  const markers: TempoMarker[] = []

  for (const t of tempos) {
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
    case 0:
      return 'cue'
    case 1:
      return 'fadein'
    case 2:
      return 'fadeout'
    case 3:
      return 'loop'
    case 4:
      return 'grid'
    default:
      return 'cue'
  }
}

function parseCuePoints(trackEl: Element): CuePoint[] {
  const marks = trackEl.querySelectorAll('POSITION_MARK')
  const cues: CuePoint[] = []

  for (const m of marks) {
    const typeNum = safeParseInt(attr(m, 'Type')) ?? 0
    const start = safeParseFloat(attr(m, 'Start'))
    if (start == null) continue

    const cue: CuePoint = {
      name: attr(m, 'Name'),
      type: parseCueType(typeNum),
      start,
      hotcue: safeParseInt(attr(m, 'Num')) ?? -1,
    }

    const end = safeParseFloat(attr(m, 'End'))
    if (end != null) cue.end = end

    const r = safeParseInt(attr(m, 'Red'))
    const g = safeParseInt(attr(m, 'Green'))
    const b = safeParseInt(attr(m, 'Blue'))
    if (r != null && g != null && b != null) {
      cue.color = { r, g, b }
    }

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
  const rawRating = safeParseInt(attr(trackEl, 'Rating')) ?? 0

  return {
    id: `rb-${sourceId}`,
    source: 'rekordbox',
    sourceId,

    title: attr(trackEl, 'Name'),
    artist: attr(trackEl, 'Artist'),
    album: attr(trackEl, 'Album'),
    genre: attr(trackEl, 'Genre'),
    composer: attr(trackEl, 'Composer'),
    label: attr(trackEl, 'Label'),
    comment: attr(trackEl, 'Comments'),
    year: safeParseInt(attr(trackEl, 'Year')),
    rating: normalizeRating(rawRating),

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

export class RekordboxAdapter implements LibraryAdapter {
  readonly softwareType = 'rekordbox' as const

  parse(xmlContent: string): ParseResult {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    const warnings: ParseWarning[] = []

    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      throw new Error(`Invalid XML: ${parserError.textContent}`)
    }

    const product = doc.querySelector('PRODUCT')
    const version = product?.getAttribute('Version') ?? 'unknown'

    const trackElements = doc.querySelectorAll('COLLECTION > TRACK')
    const tracks: Track[] = []

    for (const trackEl of trackElements) {
      tracks.push(parseTrack(trackEl, warnings))
    }

    return {
      tracks,
      source: 'rekordbox',
      version,
      totalTracks: tracks.length,
      warnings,
    }
  }
}
