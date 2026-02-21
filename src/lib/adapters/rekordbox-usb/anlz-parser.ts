import { parseAnlz, RekordboxAnlz } from 'rekordbox-parser'
import type { TempoMarker, CuePoint } from '@/types/track'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnlzSection = any

export interface AnlzData {
  tempoMarkers: TempoMarker[]
  cuePoints: CuePoint[]
}

const EMPTY_ANLZ: AnlzData = { tempoMarkers: [], cuePoints: [] }

export function parseAnlzFile(data: ArrayBuffer): AnlzData {
  try {
    const anlz = parseAnlz(data as unknown as Buffer)

    const tempoMarkers = extractBeatGrid(anlz)
    const cuePoints = extractCuePoints(anlz)

    return { tempoMarkers, cuePoints }
  } catch {
    return EMPTY_ANLZ
  }
}

/**
 * Merge data from DAT + EXT files: beat grid from DAT, cues from EXT (preferred).
 */
export function mergeAnlzData(dat: AnlzData | null, ext: AnlzData | null): AnlzData {
  if (!dat && !ext) return EMPTY_ANLZ
  if (!dat) return ext!
  if (!ext) return dat

  return {
    // Beat grid is only in DAT files
    tempoMarkers: dat.tempoMarkers,
    // Prefer EXT cues (have colors), fall back to DAT
    cuePoints: ext.cuePoints.length > 0 ? ext.cuePoints : dat.cuePoints,
  }
}

function extractBeatGrid(anlz: AnlzSection): TempoMarker[] {
  const SectionTags = RekordboxAnlz.SectionTags
  const markers: TempoMarker[] = []

  for (const section of anlz.sections) {
    if (section.fourcc !== SectionTags.BEAT_GRID) continue

    const beats = section.body?.beats
    if (!Array.isArray(beats)) continue

    // Group by tempo changes - only emit a marker when tempo changes
    let lastTempo: number | null = null
    for (const beat of beats) {
      const bpm = beat.tempo / 100
      if (bpm <= 0) continue

      if (lastTempo === null || Math.abs(bpm - lastTempo) > 0.01) {
        markers.push({
          position: beat.time / 1000,
          bpm,
          meter: '4/4',
          beat: beat.beatNumber ?? 1,
        })
        lastTempo = bpm
      }
    }
  }

  return markers
}

function mapCueType(type: number): CuePoint['type'] {
  switch (type) {
    case 1:
      return 'cue'
    case 2:
      return 'loop'
    default:
      return 'cue'
  }
}

function extractCuePoints(anlz: AnlzSection): CuePoint[] {
  const SectionTags = RekordboxAnlz.SectionTags
  const cues: CuePoint[] = []

  // Prefer CUES_2 (extended, has colors) over CUES
  let foundExtended = false

  for (const section of anlz.sections) {
    if (section.fourcc === SectionTags.CUES_2) {
      foundExtended = true
      const entries = section.body?.cues
      if (!Array.isArray(entries)) continue

      for (const entry of entries) {
        const cue: CuePoint = {
          name: entry.comment ?? '',
          type: mapCueType(entry.type),
          start: entry.time / 1000,
          hotcue: entry.hotCue > 0 ? entry.hotCue : undefined,
        }

        if (entry.type === 2 && entry.loopTime > 0) {
          cue.end = entry.loopTime / 1000
        }

        if (entry.colorRed != null && entry.colorGreen != null && entry.colorBlue != null) {
          cue.color = { r: entry.colorRed, g: entry.colorGreen, b: entry.colorBlue }
        }

        cues.push(cue)
      }
    }
  }

  // Fallback to basic CUES if no extended found
  if (!foundExtended) {
    for (const section of anlz.sections) {
      if (section.fourcc !== SectionTags.CUES) continue

      const entries = section.body?.cues
      if (!Array.isArray(entries)) continue

      for (const entry of entries) {
        const cue: CuePoint = {
          name: '',
          type: mapCueType(entry.type),
          start: entry.time / 1000,
          hotcue: entry.hotCue > 0 ? entry.hotCue : undefined,
        }

        if (entry.type === 2 && entry.loopTime > 0) {
          cue.end = entry.loopTime / 1000
        }

        cues.push(cue)
      }
    }
  }

  return cues
}
