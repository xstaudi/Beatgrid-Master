import type { TempoMarker } from '@/types/track'
import type { RawBeatResult } from '@/types/audio'
import { computeVariance, applyHalfDoubleGuard } from '@/features/bpm/services/bpm-verification'
import { buildExpectedBeats } from './beatgrid-check'
import {
  MIN_BEATS_FOR_ANALYSIS,
  VARIABLE_BPM_SKIP_THRESHOLD_PCT,
  GRID_VALIDATION_ERROR_RATIO,
  PHASE_BIN_WIDTH_MS,
  adaptiveTolerancesMs,
  DYNAMIC_SEGMENT_MERGE_THRESHOLD_PCT,
  DYNAMIC_SEGMENT_MIN_COUNT,
} from '../constants'

const SEGMENT_DURATION_SEC = 30

export interface GeneratedBeatgrid {
  tempoMarkers: TempoMarker[]
  method: 'static' | 'dynamic' | 'skipped'
  isVariableBpm: boolean
  confidence: number
  medianBpm: number
  phaseOffsetSec: number
  skipReason?: 'too-few-beats' | 'variable-bpm' | 'has-existing-grid'
}

function computeMedianBpm(beatTimestamps: number[]): number {
  if (beatTimestamps.length < 2) return 0

  const intervals: number[] = []
  for (let i = 1; i < beatTimestamps.length; i++) {
    const interval = beatTimestamps[i] - beatTimestamps[i - 1]
    if (interval > 0.08 && interval < 3.0) {
      intervals.push(interval)
    }
  }

  if (intervals.length === 0) return 0

  const sorted = [...intervals].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const medianInterval = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]

  return 60 / medianInterval
}

/**
 * Phase-Histogramm: Findet die dominante Phase aller Beats
 * relativ zum Beat-Intervall und gibt den fruehesten Beat
 * an dieser Phase als Downbeat zurueck.
 */
function computeOptimalPhase(
  beatTimestamps: number[],
  intervalSec: number,
): number {
  if (beatTimestamps.length === 0) return 0

  const intervalMs = intervalSec * 1000
  const binCount = Math.max(1, Math.round(intervalMs / PHASE_BIN_WIDTH_MS))
  const binWidth = intervalMs / binCount

  // Phase-Histogramm aufbauen
  const bins = new Array<number>(binCount).fill(0)
  for (const t of beatTimestamps) {
    const phaseMs = (t % intervalSec) * 1000
    const binIdx = Math.floor(phaseMs / binWidth) % binCount
    bins[binIdx]++
  }

  // 3-Bin Circular Smoothing
  const smoothed = new Array<number>(binCount).fill(0)
  for (let i = 0; i < binCount; i++) {
    const prev = (i - 1 + binCount) % binCount
    const next = (i + 1) % binCount
    smoothed[i] = bins[prev] + bins[i] + bins[next]
  }

  // Dominanten Bin finden
  let maxVal = -1
  let maxBin = 0
  for (let i = 0; i < binCount; i++) {
    if (smoothed[i] > maxVal) {
      maxVal = smoothed[i]
      maxBin = i
    }
  }

  // Fruehesten Beat im dominanten Cluster (±1 Bin, circular) finden
  for (const t of beatTimestamps) {
    const phaseMs = (t % intervalSec) * 1000
    const binIdx = Math.floor(phaseMs / binWidth) % binCount
    const diff = Math.abs(binIdx - maxBin)
    const circDiff = Math.min(diff, binCount - diff)
    if (circDiff <= 1) {
      return t
    }
  }

  return beatTimestamps[0]
}

export function generateDynamicSegments(rawBeat: RawBeatResult): TempoMarker[] {
  const { segmentBpms, beatTimestamps, kickOnsets, duration } = rawBeat
  if (segmentBpms.length === 0) return []

  // Phase 1: Konsekutive Segmente mit < 2% BPM-Diff zusammenfuehren
  type Group = { startIdx: number; endIdx: number; bpms: number[] }
  const groups: Group[] = []
  let cur: Group = { startIdx: 0, endIdx: 0, bpms: [segmentBpms[0]] }
  for (let i = 1; i < segmentBpms.length; i++) {
    const prev = cur.bpms[cur.bpms.length - 1]
    if (Math.abs(segmentBpms[i] - prev) / prev * 100 < DYNAMIC_SEGMENT_MERGE_THRESHOLD_PCT) {
      cur.bpms.push(segmentBpms[i])
      cur.endIdx = i
    } else {
      groups.push(cur)
      cur = { startIdx: i, endIdx: i, bpms: [segmentBpms[i]] }
    }
  }
  groups.push(cur)

  // Phase 2: Gruppen kleiner als DYNAMIC_SEGMENT_MIN_COUNT in vorherige mergen
  const merged: Group[] = []
  for (const g of groups) {
    if (g.endIdx - g.startIdx + 1 < DYNAMIC_SEGMENT_MIN_COUNT && merged.length > 0) {
      const prev = merged[merged.length - 1]
      prev.endIdx = g.endIdx
      prev.bpms.push(...g.bpms)
    } else {
      merged.push({ startIdx: g.startIdx, endIdx: g.endIdx, bpms: [...g.bpms] })
    }
  }

  // Phase 3: TempoMarker pro Gruppe
  return merged.map((g, idx) => {
    const startSec = g.startIdx * SEGMENT_DURATION_SEC
    const endSec = Math.min((g.endIdx + 1) * SEGMENT_DURATION_SEC, duration)
    const sorted = [...g.bpms].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const bpm = Math.round(
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid],
    )
    const intervalSec = 60 / bpm
    const kicks = (kickOnsets ?? []).filter(k => k >= startSec && k < endSec)
    const beats = beatTimestamps.filter(b => b >= startSec && b < endSec)
    const position = idx === 0
      ? (kicks.length >= 1 ? kicks[0] % intervalSec : computeOptimalPhase(beats, intervalSec))
      : (kicks.length >= 1 ? kicks[0] : beats[0] ?? startSec)
    return { position, bpm, meter: '4/4', beat: 1 }
  })
}

export function generateBeatgrid(
  rawBeat: RawBeatResult,
  existingMarkers: TempoMarker[],
): GeneratedBeatgrid {
  const skippedBase: Omit<GeneratedBeatgrid, 'skipReason'> = {
    tempoMarkers: [],
    method: 'skipped',
    isVariableBpm: false,
    confidence: 0,
    medianBpm: 0,
    phaseOffsetSec: 0,
  }

  // Guard: zu wenige Beats
  if (rawBeat.beatTimestamps.length < MIN_BEATS_FOR_ANALYSIS) {
    return { ...skippedBase, skipReason: 'too-few-beats' }
  }

  // Variable-BPM Check (nur flaggen, Grid trotzdem generieren fuer Vergleich)
  const { variancePercent } = computeVariance(rawBeat.segmentBpms)
  const isVariableBpm = variancePercent > VARIABLE_BPM_SKIP_THRESHOLD_PCT

  // Median-BPM berechnen
  let medianBpm = computeMedianBpm(rawBeat.beatTimestamps)
  if (medianBpm === 0) {
    return { ...skippedBase, skipReason: 'too-few-beats' }
  }

  // Half/Double Guard
  const { adjusted } = applyHalfDoubleGuard(medianBpm, rawBeat.bpmEstimate)
  medianBpm = adjusted

  // Dynamic path: variable BPM mit genuegend Segmenten -> Multi-Marker Grid
  if (isVariableBpm && rawBeat.segmentBpms.length >= 4) {
    const dynamicMarkers = generateDynamicSegments(rawBeat)
    if (dynamicMarkers.length >= 2) {
      const avgBpm = Math.round(dynamicMarkers.reduce((s, m) => s + m.bpm, 0) / dynamicMarkers.length)
      const expected = buildExpectedBeats(dynamicMarkers, rawBeat.duration)
      let errs = 0
      const tol = adaptiveTolerancesMs(avgBpm).warningMs
      for (const det of rawBeat.beatTimestamps) {
        let best = Infinity
        for (const exp of expected) {
          const d = Math.abs(det - exp) * 1000
          if (d < best) best = d
          if (exp > det + best / 1000) break
        }
        if (best > tol) errs++
      }
      const errRatio = rawBeat.beatTimestamps.length > 0 ? errs / rawBeat.beatTimestamps.length : 0
      return {
        tempoMarkers: dynamicMarkers,
        method: 'dynamic',
        isVariableBpm: true,
        confidence: Math.round(Math.max(0, (1 - errRatio) * 100)),
        medianBpm: Math.round(medianBpm),
        phaseOffsetSec: dynamicMarkers[0].position,
      }
    }
    // Fallback: zu wenige distinkte Sektionen -> static
  }

  // BPM runden auf 2 Dezimalstellen
  const roundedBpm = Math.round(medianBpm)

  // Phase Offset via Phase-Histogramm (dominanter Phase-Cluster)
  // WICHTIG: roundedBpm statt medianBpm fuer intervalSec verwenden!
  // Bei fractional BPM (z.B. 126.05 statt 126) driftet die Phase ueber
  // den gesamten Track, das Histogramm wird flach → falscher Downbeat.
  // Existierende Marker-BPM bevorzugen (DJ-gesetzt = genauer als Detektion).
  const existingBpm = existingMarkers.length > 0 ? existingMarkers[0].bpm : null
  const phaseBpm = existingBpm != null && Math.abs(existingBpm - roundedBpm) <= 2
    ? existingBpm
    : roundedBpm
  const intervalSec = 60 / phaseBpm

  // Kick-Onsets bevorzugen: ersten Kick auf früheste Grid-Position zurückrechnen (t ≈ 0).
  // kickOnsets[0] % intervalSec gibt die Phase des ersten Kicks als absolute Ankerposition nahe t=0.
  // buildExpectedBeats() verlängert das Grid rückwärts, daher deckt der Anchor den ganzen Track ab.
  const MIN_KICK_ONSETS = 4
  const phaseOffsetSec = (rawBeat.kickOnsets?.length ?? 0) >= MIN_KICK_ONSETS
    ? rawBeat.kickOnsets![0] % intervalSec
    : computeOptimalPhase(rawBeat.beatTimestamps, intervalSec)

  // Static Grid erzeugen
  const marker: TempoMarker = {
    position: phaseOffsetSec,
    bpm: roundedBpm,
    meter: '4/4',
    beat: 1,
  }

  // Grid-Qualitaet validieren
  const expectedBeats = buildExpectedBeats([marker], rawBeat.duration)
  let errorCount = 0
  for (const detected of rawBeat.beatTimestamps) {
    let bestDist = Infinity
    for (const expected of expectedBeats) {
      const dist = Math.abs(detected - expected) * 1000
      if (dist < bestDist) bestDist = dist
      if (expected > detected + bestDist / 1000) break
    }
    if (bestDist > adaptiveTolerancesMs(roundedBpm).warningMs) errorCount++
  }

  const errorRatio = rawBeat.beatTimestamps.length > 0
    ? errorCount / rawBeat.beatTimestamps.length
    : 0
  const confidence = Math.round(Math.max(0, (1 - errorRatio) * 100))

  return {
    tempoMarkers: [marker],
    method: 'static',
    isVariableBpm,
    confidence,
    medianBpm: roundedBpm,
    phaseOffsetSec,
  }
}
