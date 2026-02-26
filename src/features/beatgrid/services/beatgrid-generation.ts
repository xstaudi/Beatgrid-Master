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

/**
 * BPM aus Beat-Intervallen: Median der Intervalle → robust gegen Outlier.
 */
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
 * Least-Squares BPM-Refinement: Verfeinert den initialen BPM-Schaetzer
 * indem jeder erkannte Beat seinem naechsten Grid-Index zugeordnet und
 * per linearer Regression der optimale Intervall bestimmt wird.
 *
 * Eliminiert den akkumulierten Drift den Median-Intervall hinterlaesst.
 */
function refineBpmLeastSquares(
  beatTimestamps: number[],
  initialBpm: number,
  phaseOffsetSec: number,
): number {
  if (beatTimestamps.length < 4 || initialBpm <= 0) return initialBpm

  const intervalSec = 60 / initialBpm

  // Jeden Beat seinem naechsten Grid-Index zuordnen
  const pairs: { idx: number; time: number }[] = []
  for (const t of beatTimestamps) {
    const idx = Math.round((t - phaseOffsetSec) / intervalSec)
    if (idx >= 0) {
      pairs.push({ idx, time: t })
    }
  }

  if (pairs.length < 4) return initialBpm

  // Lineare Regression: time = phase + idx * interval
  // → interval = sum((idx - mean_idx) * (time - mean_time)) / sum((idx - mean_idx)²)
  let sumIdx = 0, sumTime = 0
  for (const p of pairs) {
    sumIdx += p.idx
    sumTime += p.time
  }
  const meanIdx = sumIdx / pairs.length
  const meanTime = sumTime / pairs.length

  let num = 0, den = 0
  for (const p of pairs) {
    const dIdx = p.idx - meanIdx
    const dTime = p.time - meanTime
    num += dIdx * dTime
    den += dIdx * dIdx
  }

  if (den === 0) return initialBpm

  const refinedInterval = num / den
  if (refinedInterval <= 0.08 || refinedInterval > 3.0) return initialBpm

  return 60 / refinedInterval
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

  // BPM: IMMER aus erkannten Beats berechnen (volle Praezision, kein Runden).
  // Half/Double-Guard nur zur Oktavkorrektur, nicht zum Uebernehmen des gespeicherten Werts.
  const existingBpm = existingMarkers.length > 0 ? existingMarkers[0].bpm : null
  const MIN_KICKS_FOR_BPM = 16
  let detectedBpm = (rawBeat.kickOnsets?.length ?? 0) >= MIN_KICKS_FOR_BPM
    ? computeMedianBpm(rawBeat.kickOnsets!)
    : computeMedianBpm(rawBeat.beatTimestamps)

  if (detectedBpm === 0) {
    return { ...skippedBase, skipReason: 'too-few-beats' }
  }

  // Half/Double-Guard: Referenz ist existingBpm (wenn vorhanden) oder Aubio-Estimate
  const reference = existingBpm != null && existingBpm > 0 ? existingBpm : rawBeat.bpmEstimate
  const { adjusted } = applyHalfDoubleGuard(detectedBpm, reference)
  detectedBpm = adjusted

  const intervalSec = 60 / detectedBpm

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

  // Least-Squares BPM-Refinement: Minimiert akkumulierten Drift ueber gesamten Track
  const primaryBeats = useKicks ? filteredKicks : rawBeat.beatTimestamps
  const refinedBpm = refineBpmLeastSquares(primaryBeats, detectedBpm, phaseOffsetSec)

  // Sanity-Check: Refinement nur akzeptieren wenn Abweichung < 1% (kein Sprung)
  const refinedDeviation = Math.abs(refinedBpm - detectedBpm) / detectedBpm
  const finalBpm = refinedDeviation < 0.01 ? refinedBpm : detectedBpm

  // Phase nach BPM-Refinement nochmal berechnen (neues Intervall → neue Phase)
  const finalInterval = 60 / finalBpm
  if (Math.abs(finalBpm - detectedBpm) > 0.001) {
    phaseOffsetSec = useKicks
      ? computeOptimalPhase(filteredKicks, finalInterval)
      : computeOptimalPhase(rawBeat.beatTimestamps, finalInterval)
  }

  // Downbeat-Alignment: Drop-basiert (bevorzugt) oder Kick-Histogram (Fallback)
  if (useKicks) {
    const drop = detectDrop(filteredKicks, finalBpm, rawBeat.duration)
    const anchorKick = drop.dropKickSec

    if (anchorKick !== null) {
      // Grid so rotieren dass anchorKick auf Beat 1 (Downbeat) faellt
      const beatIdx = Math.round((anchorKick - phaseOffsetSec) / finalInterval)
      const barShift = ((beatIdx % 4) + 4) % 4
      if (barShift !== 0) {
        phaseOffsetSec = (phaseOffsetSec + barShift * finalInterval) % (finalInterval * 4)
      }
    } else {
      // Kein Drop: Kick-Histogram fuer Downbeat (robuster als einzelner firstKick)
      const barCounts = [0, 0, 0, 0]
      for (const kick of filteredKicks) {
        const beatIdx = Math.round((kick - phaseOffsetSec) / finalInterval)
        const barPos = ((beatIdx % 4) + 4) % 4
        barCounts[barPos]++
      }
      const barShift = barCounts.indexOf(Math.max(...barCounts))
      if (barShift !== 0) {
        phaseOffsetSec = (phaseOffsetSec + barShift * finalInterval) % (finalInterval * 4)
      }
    }
  }

  // BPM fuer Anzeige auf 2 Dezimalen runden, intern volle Praezision
  const displayBpm = Math.round(finalBpm * 100) / 100

  // Static Grid erzeugen
  const marker: TempoMarker = {
    position: phaseOffsetSec,
    bpm: displayBpm,
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
    if (bestDist > adaptiveTolerancesMs(displayBpm).warningMs) errorCount++
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
    medianBpm: displayBpm,
    phaseOffsetSec,
  }
}
