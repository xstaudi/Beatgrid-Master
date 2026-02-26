import type { Track, TempoMarker } from '@/types/track'
import type { Severity, TrackBeatgridResult, BeatgridCheckResult, BeatDriftPoint } from '@/types/analysis'
import type { RawBeatResult } from '@/types/audio'
import {
  MIN_BEATS_FOR_ANALYSIS,
  adaptiveTolerancesMs,
} from '../constants'
import { detectOffBeat, detectOutOfPhase } from './beatgrid-phase'

function driftSeverity(driftMs: number, bpm: number): Severity {
  const abs = Math.abs(driftMs)
  const { okMs, warningMs } = adaptiveTolerancesMs(bpm)
  if (abs <= okMs) return 'ok'
  if (abs <= warningMs) return 'warning'
  return 'error'
}

function worstSeverity(a: Severity, b: Severity): Severity {
  const order: Record<Severity, number> = { ok: 0, warning: 1, error: 2 }
  return order[a] >= order[b] ? a : b
}

export function buildExpectedBeats(markers: TempoMarker[], duration: number): number[] {
  const beats: number[] = []

  if (markers.length === 0) return beats

  if (markers.length === 1) {
    const m = markers[0]
    const intervalSec = 60 / m.bpm
    let pos = m.position
    while (pos <= duration) {
      beats.push(pos)
      pos += intervalSec
    }
    // Also go backwards from marker position
    pos = m.position - intervalSec
    while (pos >= 0) {
      beats.unshift(pos)
      pos -= intervalSec
    }
    return beats
  }

  // Multiple markers: piecewise
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i]
    const endPos = i < markers.length - 1 ? markers[i + 1].position : duration
    const intervalSec = 60 / m.bpm
    let pos = m.position
    while (pos < endPos) {
      beats.push(pos)
      pos += intervalSec
    }
  }

  return beats
}

function findNearestBeat(detected: number, expected: number[]): { index: number; driftMs: number } | null {
  if (expected.length === 0) return null

  let bestIdx = 0
  let bestDist = Math.abs(detected - expected[0])

  for (let i = 1; i < expected.length; i++) {
    const dist = Math.abs(detected - expected[i])
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
    // Early exit: expected is sorted, once distance increases we passed the closest
    if (expected[i] > detected + bestDist) break
  }

  return { index: bestIdx, driftMs: (detected - expected[bestIdx]) * 1000 }
}

export function checkBeatgrid(track: Track, rawBeat: RawBeatResult | null): TrackBeatgridResult {
  const base = { trackId: track.id }

  if (!rawBeat) {
    return {
      ...base,
      overallSeverity: 'warning',
      confidence: 0,
      driftPoints: [],
      avgDriftMs: 0,
      maxDriftMs: 0,
      beatsAnalyzed: 0,
      beatsMatched: 0,
      isVariableBpm: false,
      skipReason: 'no-pcm',
    }
  }

  if (rawBeat.beatTimestamps.length === 0) {
    return {
      ...base,
      overallSeverity: 'warning',
      confidence: 0,
      driftPoints: [],
      avgDriftMs: 0,
      maxDriftMs: 0,
      beatsAnalyzed: 0,
      beatsMatched: 0,
      isVariableBpm: false,
      skipReason: 'no-beats-detected',
    }
  }

  if (track.tempoMarkers.length === 0) {
    return {
      ...base,
      overallSeverity: 'warning',
      confidence: Math.min(100, rawBeat.avgConfidence * 100),
      driftPoints: [],
      avgDriftMs: 0,
      maxDriftMs: 0,
      beatsAnalyzed: rawBeat.beatTimestamps.length,
      beatsMatched: 0,
      isVariableBpm: false,
      // Kein skipReason: Beats wurden detektiert, nur kein gespeichertes Grid zum Vergleichen
    }
  }

  // Check variable BPM
  const isVariableBpm = track.tempoMarkers.length > 1 && hasSignificantBpmVariance(track.tempoMarkers)

  // BPM fuer adaptive Toleranzen
  const toleranceBpm = track.tempoMarkers[0].bpm
  const { warningMs: adaptiveWarningMs } = adaptiveTolerancesMs(toleranceBpm)

  // Build expected grid
  const expectedBeats = buildExpectedBeats(track.tempoMarkers, rawBeat.duration)
  const driftPoints: BeatDriftPoint[] = []
  let totalAbsDrift = 0
  let maxAbsDrift = 0
  let matched = 0

  for (const detected of rawBeat.beatTimestamps) {
    const nearest = findNearestBeat(detected, expectedBeats)
    if (!nearest) continue

    matched++
    const absDrift = Math.abs(nearest.driftMs)
    totalAbsDrift += absDrift
    if (absDrift > maxAbsDrift) maxAbsDrift = absDrift

    driftPoints.push({
      beatIndex: nearest.index,
      positionMs: detected * 1000,
      driftMs: nearest.driftMs,
      severity: driftSeverity(nearest.driftMs, toleranceBpm),
    })
  }

  const avgDriftMs = matched > 0 ? totalAbsDrift / matched : 0

  // Determine overall severity using median drift (robust to outliers)
  let overallSeverity: Severity = 'ok'

  if (driftPoints.length > 0) {
    const sortedDrifts = driftPoints.map((dp) => Math.abs(dp.driftMs)).sort((a, b) => a - b)
    const medianDrift = sortedDrifts[Math.floor(sortedDrifts.length / 2)]
    const errorCount = driftPoints.filter((dp) => Math.abs(dp.driftMs) > adaptiveWarningMs).length
    const errorRatio = errorCount / driftPoints.length

    overallSeverity = driftSeverity(medianDrift, toleranceBpm)

    // Escalate if >30% of beats have error-level drift
    if (errorRatio > 0.3 && overallSeverity !== 'error') {
      overallSeverity = 'error'
    }
  }

  // Variable BPM: cap at warning
  if (isVariableBpm && overallSeverity === 'error') {
    overallSeverity = 'warning'
  }

  // Too few beats: cap at warning
  if (rawBeat.beatTimestamps.length < MIN_BEATS_FOR_ANALYSIS && overallSeverity === 'error') {
    overallSeverity = 'warning'
  }

  const offBeatRaw = detectOffBeat(driftPoints)
  const offBeatMs = Math.abs(offBeatRaw) >= 3 ? offBeatRaw : undefined
  // Bar Alignment nur anzeigen wenn Grid-Qualitaet ausreicht (< 30ms Drift)
  const outOfPhaseRaw = avgDriftMs < 30
    ? detectOutOfPhase(expectedBeats, rawBeat.kickOnsets ?? [])
    : null
  const outOfPhaseBeats = outOfPhaseRaw !== null ? outOfPhaseRaw : undefined

  return {
    ...base,
    overallSeverity,
    confidence: Math.min(100, rawBeat.avgConfidence * 100),
    driftPoints,
    avgDriftMs,
    maxDriftMs: maxAbsDrift,
    beatsAnalyzed: rawBeat.beatTimestamps.length,
    beatsMatched: matched,
    isVariableBpm,
    offBeatMs,
    outOfPhaseBeats,
  }
}

function hasSignificantBpmVariance(markers: TempoMarker[]): boolean {
  if (markers.length < 2) return false
  const bpms = markers.map((m) => m.bpm)
  const median = sortedMedian(bpms)
  const maxDeviation = Math.max(...bpms.map((b) => Math.abs(b - median) / median * 100))
  return maxDeviation > 2.0
}

function sortedMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function checkBeatgridLibrary(tracks: Track[], rawBeats: Map<string, RawBeatResult>): BeatgridCheckResult {
  const trackResults = tracks.map((t) => checkBeatgrid(t, rawBeats.get(t.id) ?? null))

  let tracksOk = 0
  let tracksWithWarnings = 0
  let tracksWithErrors = 0
  let tracksSkipped = 0
  let totalConfidence = 0

  for (const r of trackResults) {
    if (r.skipReason) { tracksSkipped++; continue }
    switch (r.overallSeverity) {
      case 'ok': tracksOk++; break
      case 'warning': tracksWithWarnings++; break
      case 'error': tracksWithErrors++; break
    }
    totalConfidence += r.confidence
  }

  const nonSkipped = trackResults.length - tracksSkipped
  const avgConfidence = nonSkipped > 0 ? totalConfidence / nonSkipped : 0

  return {
    type: 'beatgrid',
    tracks: trackResults,
    libraryStats: {
      totalTracks: tracks.length,
      tracksOk,
      tracksWithWarnings,
      tracksWithErrors,
      tracksSkipped,
      avgConfidence,
    },
  }
}
