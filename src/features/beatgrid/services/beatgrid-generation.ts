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
} from '../constants'

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
