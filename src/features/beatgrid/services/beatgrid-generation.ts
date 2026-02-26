import type { TempoMarker } from '@/types/track'
import type { RawBeatResult } from '@/types/audio'
import { computeVariance, applyHalfDoubleGuard } from '@/features/bpm/services/bpm-verification'
import { buildExpectedBeats } from './beatgrid-check'
import { detectDrop } from './drop-detection'
import {
  MIN_BEATS_FOR_ANALYSIS,
  PHASE_BIN_WIDTH_MS,
  adaptiveTolerancesMs,
} from '../constants'

export interface GeneratedBeatgrid {
  tempoMarkers: TempoMarker[]
  method: 'static' | 'skipped'
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
 * relativ zum Beat-Intervall und gibt die Median-Phase zurueck.
 *
 * Median statt erster Beat: robust gegen Jitter einzelner Beats.
 * Rueckgabe: Phase in Sekunden, normalisiert auf [0, intervalSec).
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

  // Alle Phasen im dominanten Cluster (±1 Bin, circular) sammeln
  const clusterPhases: number[] = []
  for (const t of beatTimestamps) {
    const phaseMs = (t % intervalSec) * 1000
    const binIdx = Math.floor(phaseMs / binWidth) % binCount
    const diff = Math.abs(binIdx - maxBin)
    const circDiff = Math.min(diff, binCount - diff)
    if (circDiff <= 1) {
      clusterPhases.push(phaseMs)
    }
  }

  if (clusterPhases.length === 0) return 0

  // Median-Phase = praezisester Schaetzer (robust gegen Outlier)
  const sortedPhases = [...clusterPhases].sort((a, b) => a - b)
  const medianPhaseMs = sortedPhases[Math.floor(sortedPhases.length / 2)]

  // Normalisiert auf [0, interval) zurueckgeben
  return (medianPhaseMs / 1000) % intervalSec
}

/**
 * Entfernt Sub-Beat Kick-Onsets (Ghost-Kicks, Hi-Hat-Bleed).
 * Behaelt nur Kicks die mindestens minInterval Sekunden auseinander liegen.
 */
function filterSubBeatKicks(kicks: number[], minInterval: number): number[] {
  if (kicks.length === 0) return []
  const filtered = [kicks[0]]
  for (let i = 1; i < kicks.length; i++) {
    if (kicks[i] - filtered[filtered.length - 1] >= minInterval) {
      filtered.push(kicks[i])
    }
  }
  return filtered
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

  // Variable-BPM Check (IQR auf Beat-Intervalle, nur echtes variables Tempo)
  const { isVariableBpm } = computeVariance(rawBeat.segmentBpms, rawBeat.beatTimestamps)

  // BPM: DJ-BPM validieren wenn vorhanden, sonst aus Kicks/Beats berechnen
  const existingBpm = existingMarkers.length > 0 ? existingMarkers[0].bpm : null
  let roundedBpm: number
  if (existingBpm != null && existingBpm > 0) {
    // Validieren + Half/Double-Guard statt blind uebernehmen
    const detectedBpm = computeMedianBpm(rawBeat.beatTimestamps)
    if (detectedBpm > 0) {
      const { adjusted } = applyHalfDoubleGuard(detectedBpm, existingBpm)
      // Nur existierenden uebernehmen wenn Abweichung < 2%
      const deviation = Math.abs(adjusted - existingBpm) / existingBpm
      roundedBpm = deviation < 0.02 ? existingBpm : adjusted
    } else {
      roundedBpm = existingBpm
    }
  } else {
    const MIN_KICKS_FOR_BPM = 16
    let medianBpm = (rawBeat.kickOnsets?.length ?? 0) >= MIN_KICKS_FOR_BPM
      ? computeMedianBpm(rawBeat.kickOnsets!)
      : computeMedianBpm(rawBeat.beatTimestamps)
    if (medianBpm === 0) {
      return { ...skippedBase, skipReason: 'too-few-beats' }
    }
    const { adjusted } = applyHalfDoubleGuard(medianBpm, rawBeat.bpmEstimate)
    medianBpm = adjusted
    roundedBpm = Math.round(medianBpm * 10) / 10
  }
  const intervalSec = 60 / roundedBpm

  // Kick-Onsets filtern: Sub-Beat-Intervalle entfernen (Ghost-Kicks, Hi-Hat-Bleed)
  const MIN_KICK_ONSETS = 4
  const minKickInterval = intervalSec * 0.7
  const filteredKicks = (rawBeat.kickOnsets?.length ?? 0) >= MIN_KICK_ONSETS
    ? filterSubBeatKicks(rawBeat.kickOnsets!, minKickInterval)
    : []
  const useKicks = filteredKicks.length >= MIN_KICK_ONSETS

  // Phase-Offset: Kick-Histogramm bevorzugen, Fallback auf Beat-Histogramm.
  let phaseOffsetSec = useKicks
    ? computeOptimalPhase(filteredKicks, intervalSec)
    : computeOptimalPhase(rawBeat.beatTimestamps, intervalSec)

  // Downbeat-Alignment: Drop-basiert (bevorzugt) oder Kick-Histogram (Fallback)
  if (useKicks) {
    const drop = detectDrop(filteredKicks, roundedBpm, rawBeat.duration)
    const anchorKick = drop.dropKickSec

    if (anchorKick !== null) {
      // Grid so rotieren dass anchorKick auf Beat 1 (Downbeat) faellt
      const beatIdx = Math.round((anchorKick - phaseOffsetSec) / intervalSec)
      const barShift = ((beatIdx % 4) + 4) % 4
      if (barShift !== 0) {
        phaseOffsetSec = (phaseOffsetSec + barShift * intervalSec) % (intervalSec * 4)
      }
    } else {
      // Kein Drop: Kick-Histogram fuer Downbeat (robuster als einzelner firstKick)
      const barCounts = [0, 0, 0, 0]
      for (const kick of filteredKicks) {
        const beatIdx = Math.round((kick - phaseOffsetSec) / intervalSec)
        const barPos = ((beatIdx % 4) + 4) % 4
        barCounts[barPos]++
      }
      const barShift = barCounts.indexOf(Math.max(...barCounts))
      if (barShift !== 0) {
        phaseOffsetSec = (phaseOffsetSec + barShift * intervalSec) % (intervalSec * 4)
      }
    }
  }

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
