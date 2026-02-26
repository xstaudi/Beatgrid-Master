import type { Track } from '@/types/track'
import type { Severity, TrackBpmResult, BpmCheckResult } from '@/types/analysis'
import type { RawBeatResult } from '@/types/audio'
import {
  BPM_TOLERANCE_OK,
  BPM_TOLERANCE_WARNING,
  BPM_TOLERANCE_ERROR,
  VARIABLE_BPM_VARIANCE_THRESHOLD_PCT,
  SEGMENT_DURATION_SECONDS,
} from '../constants'
import type { BpmSegment } from '@/features/waveform/types'

function bpmSeverity(delta: number): Severity {
  const abs = Math.abs(delta)
  if (abs <= BPM_TOLERANCE_OK) return 'ok'
  if (abs <= BPM_TOLERANCE_WARNING) return 'warning'  // ≤ 0.5 BPM
  if (abs <= BPM_TOLERANCE_ERROR) return 'warning'    // ≤ 2.0 BPM – noch tolerierbar
  return 'error'                                        // > 2.0 BPM = echter Fehler
}

export function applyHalfDoubleGuard(detected: number, stored: number): { adjusted: number; wasAdjusted: boolean } {
  const candidates = [detected, detected * 2, detected * 0.5]
  let best = candidates[0]
  let bestDelta = Math.abs(candidates[0] - stored)

  for (let i = 1; i < candidates.length; i++) {
    const delta = Math.abs(candidates[i] - stored)
    if (delta < bestDelta) {
      bestDelta = delta
      best = candidates[i]
    }
  }

  return { adjusted: best, wasAdjusted: best !== detected }
}

export function computeMedianBpm(segmentBpms: number[]): number | null {
  if (segmentBpms.length === 0) return null
  const sorted = [...segmentBpms].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Variable-BPM Erkennung basierend auf Beat-Intervallen (nicht Segmenten).
 *
 * Berechnet IQR (Interquartile Range) der Beat-Intervalle relativ zum Median.
 * Nur echtes variables Tempo (Live-Aufnahmen, Vinyl-Rips) triggert das Flag.
 * Einzelne schlechte Segmente (Intro, Breakdown) reissen es nicht mehr.
 *
 * Fallback auf segmentBpms wenn keine beatTimestamps verfuegbar.
 */
export function computeVariance(
  segmentBpms: number[],
  beatTimestamps?: number[],
): { variancePercent: number; isVariableBpm: boolean } {
  // Primaer: Beat-Intervalle (ganzer Track)
  if (beatTimestamps && beatTimestamps.length >= 8) {
    const intervals: number[] = []
    for (let i = 1; i < beatTimestamps.length; i++) {
      const iv = beatTimestamps[i] - beatTimestamps[i - 1]
      if (iv > 0.08 && iv < 3.0) intervals.push(iv)
    }
    if (intervals.length >= 4) {
      const sorted = [...intervals].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const mid = Math.floor(sorted.length / 2)
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid]
      const iqrPercent = median > 0 ? ((q3 - q1) / median) * 100 : 0
      return {
        variancePercent: iqrPercent,
        isVariableBpm: iqrPercent > VARIABLE_BPM_VARIANCE_THRESHOLD_PCT,
      }
    }
  }

  // Fallback: Segment-BPMs (alter Algorithmus, nur bei zu wenig Beats)
  if (segmentBpms.length < 3) {
    return { variancePercent: 0, isVariableBpm: false }
  }
  const sorted = [...segmentBpms].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
  const maxDeviation = Math.max(
    ...segmentBpms.map((b) => Math.abs(b - median) / median * 100),
  )
  return {
    variancePercent: maxDeviation,
    isVariableBpm: maxDeviation > VARIABLE_BPM_VARIANCE_THRESHOLD_PCT,
  }
}

export function verifyBpm(track: Track, rawBeat: RawBeatResult | null): TrackBpmResult {
  const base = { trackId: track.id }

  if (!rawBeat) {
    return {
      ...base,
      overallSeverity: 'warning',
      storedBpm: track.bpm,
      detectedBpm: null,
      bpmDelta: null,
      halfDoubleAdjusted: false,
      isVariableBpm: false,
      segmentBpms: [],
      bpmVariancePercent: 0,
      skipReason: 'no-pcm',
    }
  }

  if (rawBeat.beatTimestamps.length === 0) {
    return {
      ...base,
      overallSeverity: 'warning',
      storedBpm: track.bpm,
      detectedBpm: null,
      bpmDelta: null,
      halfDoubleAdjusted: false,
      isVariableBpm: false,
      segmentBpms: rawBeat.segmentBpms,
      bpmVariancePercent: 0,
      skipReason: 'no-beats-detected',
    }
  }

  if (track.bpm == null) {
    const { variancePercent, isVariableBpm } = computeVariance(rawBeat.segmentBpms, rawBeat.beatTimestamps)
    return {
      ...base,
      overallSeverity: 'warning',
      storedBpm: null,
      detectedBpm: Math.round(computeMedianBpm(rawBeat.segmentBpms) ?? rawBeat.bpmEstimate),
      bpmDelta: null,
      halfDoubleAdjusted: false,
      isVariableBpm,
      segmentBpms: rawBeat.segmentBpms,
      bpmVariancePercent: variancePercent,
      // Kein skipReason: Detektion war erfolgreich, nur kein Vergleichswert vorhanden
    }
  }

  // Apply half/double guard
  const medianBpm = computeMedianBpm(rawBeat.segmentBpms) ?? rawBeat.bpmEstimate
  const { adjusted, wasAdjusted } = applyHalfDoubleGuard(Math.round(medianBpm), track.bpm)
  const delta = adjusted - track.bpm

  // Variable BPM check (IQR auf Beat-Intervalle)
  const { variancePercent, isVariableBpm } = computeVariance(rawBeat.segmentBpms, rawBeat.beatTimestamps)

  // Severity
  let overallSeverity = bpmSeverity(delta)

  // Variable BPM → cap at warning
  if (isVariableBpm && overallSeverity === 'error') {
    overallSeverity = 'warning'
  }

  return {
    ...base,
    overallSeverity,
    storedBpm: track.bpm,
    detectedBpm: Math.round(adjusted),
    bpmDelta: delta,
    halfDoubleAdjusted: wasAdjusted,
    isVariableBpm,
    segmentBpms: rawBeat.segmentBpms,
    bpmVariancePercent: variancePercent,
  }
}

export function toBpmSegments(segmentBpms: number[], duration: number): BpmSegment[] {
  return segmentBpms.map((bpm, i) => ({
    startTime: i * SEGMENT_DURATION_SECONDS,
    endTime: Math.min((i + 1) * SEGMENT_DURATION_SECONDS, duration),
    bpm,
  }))
}

export function verifyBpmLibrary(tracks: Track[], rawBeats: Map<string, RawBeatResult>): BpmCheckResult {
  const trackResults = tracks.map((t) => verifyBpm(t, rawBeats.get(t.id) ?? null))

  let tracksOk = 0
  let tracksWithWarnings = 0
  let tracksWithErrors = 0
  let tracksSkipped = 0
  let totalDetectedBpm = 0
  let detectedCount = 0

  for (const r of trackResults) {
    if (r.skipReason) { tracksSkipped++; continue }
    switch (r.overallSeverity) {
      case 'ok': tracksOk++; break
      case 'warning': tracksWithWarnings++; break
      case 'error': tracksWithErrors++; break
    }
    if (r.detectedBpm != null) {
      totalDetectedBpm += r.detectedBpm
      detectedCount++
    }
  }

  return {
    type: 'bpm',
    tracks: trackResults,
    libraryStats: {
      totalTracks: tracks.length,
      tracksOk,
      tracksWithWarnings,
      tracksWithErrors,
      tracksSkipped,
      avgDetectedBpm: detectedCount > 0 ? totalDetectedBpm / detectedCount : 0,
    },
  }
}
