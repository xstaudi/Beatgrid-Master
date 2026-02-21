import type { CuePoint, TempoMarker, Track } from '@/types/track'
import type { LibraryAdapter, ParseResult, ParseWarning } from './types'
import {
  attr,
  buildTraktorPath,
  child,
  normalizeRating,
  safeParseFloat,
  safeParseInt,
} from '@/lib/utils/parse-helpers'
import { normalizeKey } from '@/features/key/services/key-notation'

// Traktor key values (0-23) to musical notation
// NOTE: Some mappings may need validation against real Traktor NML exports
export const TRAKTOR_KEY_MAP: Record<number, string> = {
  0: 'C',
  1: 'Db',
  2: 'D',
  3: 'Eb',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'Ab',
  9: 'A',
  10: 'Bb',
  11: 'B',
  12: 'Cm',
  13: 'C#m',
  14: 'Dm',
  15: 'Ebm',
  16: 'Em',
  17: 'Fm',
  18: 'F#m',
  19: 'Gm',
  20: 'G#m',
  21: 'Am',
  22: 'Bbm',
  23: 'Bm',
}

// Reverse map: normalized musical key → Traktor numeric value
export const TRAKTOR_KEY_REVERSE_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(TRAKTOR_KEY_MAP).map(([num, key]) => [
    normalizeKey(key) ?? key,
    Number(num),
  ]),
)

function parseTraktorKey(keyValue: string | null | undefined): string | null {
  if (keyValue == null || keyValue === '') return null
  const num = parseInt(keyValue, 10)
  if (isNaN(num)) return null
  return TRAKTOR_KEY_MAP[num] ?? null
}

function parseLocation(entry: Element): { filePath: string; fileName: string } {
  const loc = child(entry, 'LOCATION')
  if (!loc) return { filePath: '', fileName: '' }

  const file = attr(loc, 'FILE')
  const volume = attr(loc, 'VOLUME')

  const filePath = buildTraktorPath(attr(loc, 'DIR'), file, volume)
  return { filePath, fileName: file }
}

function parseTempoMarkers(entry: Element): TempoMarker[] {
  const tempo = child(entry, 'TEMPO')
  if (!tempo) return []

  const bpm = safeParseFloat(attr(tempo, 'BPM'))
  if (bpm == null || bpm <= 0) return []

  // Grid-Position aus CUE_V2 TYPE=4 lesen (Traktor Grid Marker)
  let gridPosition = 0
  const gridCue = Array.from(entry.querySelectorAll('CUE_V2')).find(
    (cue) => attr(cue, 'TYPE') === '4',
  )
  if (gridCue) {
    const startMs = safeParseFloat(attr(gridCue, 'START'))
    if (startMs != null) gridPosition = startMs / 1000
  }

  return [
    {
      position: gridPosition,
      bpm: Math.round(bpm * 100) / 100, // Round to 2 decimals
      meter: '4/4',
      beat: 1,
    },
  ]
}

function parseCuePoints(entry: Element): CuePoint[] {
  const cueElements = entry.querySelectorAll('CUE_V2')
  const cues: CuePoint[] = []

  for (const cue of cueElements) {
    const typeNum = safeParseInt(attr(cue, 'TYPE')) ?? 0
    const start = safeParseFloat(attr(cue, 'START'))
    if (start == null) continue

    // Convert milliseconds to seconds
    const startSec = start / 1000

    let type: CuePoint['type']
    switch (typeNum) {
      case 0:
        type = 'cue'
        break
      case 4:
        type = 'grid'
        break
      case 5:
        type = 'loop'
        break
      default:
        type = 'cue'
    }

    const cuePoint: CuePoint = {
      name: attr(cue, 'NAME'),
      type,
      start: startSec,
      hotcue: safeParseInt(attr(cue, 'HOTCUE')) ?? -1,
    }

    const end = safeParseFloat(attr(cue, 'LEN'))
    if (end != null && end > 0) {
      cuePoint.end = startSec + end / 1000
    }

    cues.push(cuePoint)
  }

  return cues
}

function parseEntry(entry: Element): Track {
  const sourceId = attr(entry, 'AUDIO_ID') || attr(entry, 'TITLE')
  const { filePath, fileName } = parseLocation(entry)

  const info = child(entry, 'INFO')
  const tempo = child(entry, 'TEMPO')
  const musicalKey = child(entry, 'MUSICAL_KEY')
  // BPM from TEMPO element, round to 2 decimals
  const rawBpm = tempo ? safeParseFloat(attr(tempo, 'BPM')) : null
  const bpm = rawBpm != null ? Math.round(rawBpm * 100) / 100 : null

  // Bitrate: Traktor stores in bps, convert to kbps
  const bitrateRaw = info ? safeParseInt(attr(info, 'BITRATE')) : null
  const bitrate = bitrateRaw != null ? Math.round(bitrateRaw / 1000) : null

  // Key from MUSICAL_KEY element
  const keyValue = musicalKey ? attr(musicalKey, 'VALUE') : null
  const key = parseTraktorKey(keyValue)

  const rawRating = info ? safeParseInt(attr(info, 'RANKING')) : null
  const rating = rawRating != null ? normalizeRating(rawRating) : 0

  return {
    id: `tr-${sourceId || fileName}`,
    source: 'traktor',
    sourceId,

    title: attr(entry, 'TITLE'),
    artist: attr(entry, 'ARTIST'),
    album: child(entry, 'ALBUM')?.getAttribute('TITLE') ?? '',
    genre: info ? attr(info, 'GENRE') : '',
    composer: '',
    label: info ? attr(info, 'LABEL') : '',
    comment: info ? attr(info, 'COMMENT') : '',
    year: info ? safeParseInt(attr(info, 'RELEASE_DATE')) : null,
    rating,

    duration: info ? (safeParseFloat(attr(info, 'PLAYTIME_FLOAT')) ?? 0) : 0,
    bpm,
    key,
    bitrate,
    sampleRate: null, // Traktor doesn't store this in NML
    fileSize: info ? safeParseInt(attr(info, 'FILESIZE')) : null,
    fileType: info ? attr(info, 'FORMAT') : '',

    filePath,
    fileName,

    tempoMarkers: parseTempoMarkers(entry),
    cuePoints: parseCuePoints(entry),

    dateAdded: info ? attr(info, 'IMPORT_DATE') : null,
  }
}

export class TraktorAdapter implements LibraryAdapter {
  readonly softwareType = 'traktor' as const

  parse(xmlContent: string): ParseResult {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    const warnings: ParseWarning[] = []

    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      throw new Error(`Invalid XML: ${parserError.textContent}`)
    }

    const nml = doc.querySelector('NML')
    const version = nml?.getAttribute('VERSION') ?? 'unknown'

    const entries = doc.querySelectorAll('COLLECTION > ENTRY')
    const tracks: Track[] = []

    for (const entry of entries) {
      tracks.push(parseEntry(entry))
    }

    return {
      tracks,
      source: 'traktor',
      version,
      totalTracks: tracks.length,
      warnings,
    }
  }
}
