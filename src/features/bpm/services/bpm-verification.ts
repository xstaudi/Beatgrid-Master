import type { Track } from '@/types/track'
import type { Severity, TrackBpmResult, BpmCheckResult } from '@/types/analysis'
import type { RawBeatResult } from '@/types/audio'
import {
  BPM_TOLERANCE_OK,
  BPM_TOLERANCE_WARNING,
  VARIABLE_BPM_VARIANCE_THRESHOLD_PCT,
} from '../constants'

function bpmSeverity(delta: number): Severity {
  const abs = Math.abs(delta)
  if (abs <= BPM_TOLERANCE_OK) return 'ok'
  if (abs <= BPM_TOLERANCE_WARNING) return 'warning'
  return 'error'
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

export function computeVariance(segmentBpms: number[]): { variancePercent: number; isVariableBpm: boolean } {
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
    const { variancePercent, isVariableBpm } = computeVariance(rawBeat.segmentBpms)
    return {
      ...base,
      overallSeverity: 'warning',
      storedBpm: null,
      detectedBpm: rawBeat.bpmEstimate,
      bpmDelta: null,
      halfDoubleAdjusted: false,
      isVariableBpm,
      segmentBpms: rawBeat.segmentBpms,
      bpmVariancePercent: variancePercent,
      skipReason: 'no-bpm-stored',
    }
  }

  // Apply half/double guard
  const { adjusted, wasAdjusted } = applyHalfDoubleGuard(rawBeat.bpmEstimate, track.bpm)
  const delta = adjusted - track.bpm

  // Variable BPM check
  const { variancePercent, isVariableBpm } = computeVariance(rawBeat.segmentBpms)

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
    detectedBpm: adjusted,
    bpmDelta: delta,
    halfDoubleAdjusted: wasAdjusted,
    isVariableBpm,
    segmentBpms: rawBeat.segmentBpms,
    bpmVariancePercent: variancePercent,
  }
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
