import type { TempoMarker } from '@/types/track'
import type { RawBeatResult } from '@/types/audio'
import { computeVariance, applyHalfDoubleGuard } from '@/features/bpm/services/bpm-verification'
import { buildExpectedBeats } from './beatgrid-check'
import {
  MIN_BEATS_FOR_ANALYSIS,
  VARIABLE_BPM_SKIP_THRESHOLD_PCT,
  BEATGRID_TOLERANCE_WARNING_MS,
  GRID_VALIDATION_ERROR_RATIO,
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
    if (interval > 0.1 && interval < 2.0) {
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

  // Guard: existierende Marker
  if (existingMarkers.length > 0) {
    return { ...skippedBase, skipReason: 'has-existing-grid' }
  }

  // Guard: zu wenige Beats
  if (rawBeat.beatTimestamps.length < MIN_BEATS_FOR_ANALYSIS) {
    return { ...skippedBase, skipReason: 'too-few-beats' }
  }

  // Variable-BPM Check (5% Threshold fuer Generation)
  const { variancePercent } = computeVariance(rawBeat.segmentBpms)
  if (variancePercent > VARIABLE_BPM_SKIP_THRESHOLD_PCT) {
    return { ...skippedBase, isVariableBpm: true, skipReason: 'variable-bpm' }
  }

  // Median-BPM berechnen
  let medianBpm = computeMedianBpm(rawBeat.beatTimestamps)
  if (medianBpm === 0) {
    return { ...skippedBase, skipReason: 'too-few-beats' }
  }

  // Half/Double Guard
  const { adjusted } = applyHalfDoubleGuard(medianBpm, rawBeat.bpmEstimate)
  medianBpm = adjusted

  // BPM runden auf 2 Dezimalstellen
  const roundedBpm = Math.round(medianBpm * 100) / 100

  // Phase Offset = erster erkannter Beat
  const phaseOffsetSec = rawBeat.beatTimestamps[0]

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
    if (bestDist > BEATGRID_TOLERANCE_WARNING_MS) errorCount++
  }

  const errorRatio = rawBeat.beatTimestamps.length > 0
    ? errorCount / rawBeat.beatTimestamps.length
    : 0
  const confidence = Math.round(Math.max(0, (1 - errorRatio) * 100))

  return {
    tempoMarkers: [marker],
    method: 'static',
    isVariableBpm: variancePercent > 2.0,
    confidence,
    medianBpm: roundedBpm,
    phaseOffsetSec,
  }
}
