import type { Track } from '@/types/track'
import type { TrackKeyResult, KeyCheckResult } from '@/types/analysis'
import type { RawKeyResult } from '@/types/audio'
import { normalizeKey, getRelativeKey, isCamelotNeighbor, musicalToCamelot, musicalToOpenKey } from './key-notation'

const LOW_CONFIDENCE_THRESHOLD = 15 // < 15% → Severity Warning statt Error

export function compareKey(track: Track, rawKey: RawKeyResult | null): TrackKeyResult {
  if (!rawKey) {
    return {
      trackId: track.id,
      overallSeverity: 'ok',
      detectedKey: null,
      libraryKey: track.key,
      detectedCamelot: null,
      detectedOpenKey: null,
      confidence: 0,
      match: 'no-detection',
      skipReason: 'no-pcm',
    }
  }

  const detectedNorm = normalizeKey(rawKey.detectedKey)
  const libraryNorm = track.key ? normalizeKey(track.key) : null

  const detectedCamelot = detectedNorm ? musicalToCamelot(detectedNorm) : null
  const detectedOpenKey = detectedNorm ? musicalToOpenKey(detectedNorm) : null

  if (!libraryNorm) {
    return {
      trackId: track.id,
      overallSeverity: 'warning',
      detectedKey: rawKey.detectedKey,
      libraryKey: track.key,
      detectedCamelot,
      detectedOpenKey,
      confidence: rawKey.confidence * 100,
      match: 'no-library-key',
    }
  }

  if (!detectedNorm) {
    return {
      trackId: track.id,
      overallSeverity: 'warning',
      detectedKey: rawKey.detectedKey,
      libraryKey: track.key,
      detectedCamelot,
      detectedOpenKey,
      confidence: rawKey.confidence * 100,
      match: 'no-detection',
    }
  }

  // Exact match
  if (detectedNorm === libraryNorm) {
    return {
      trackId: track.id,
      overallSeverity: 'ok',
      detectedKey: rawKey.detectedKey,
      libraryKey: track.key,
      detectedCamelot,
      detectedOpenKey,
      confidence: rawKey.confidence * 100,
      match: 'match',
    }
  }

  const base = {
    trackId: track.id,
    detectedKey: rawKey.detectedKey,
    libraryKey: track.key,
    detectedCamelot,
    detectedOpenKey,
    confidence: rawKey.confidence * 100,
  }

  // Relative key match (Am <-> C)
  const relativeKey = getRelativeKey(detectedNorm)
  if (relativeKey && relativeKey === libraryNorm) {
    return { ...base, overallSeverity: 'warning' as const, match: 'relative' as const }
  }

  // Camelot Neighbor (±1, gleicher Buchstabe)
  if (isCamelotNeighbor(detectedNorm, libraryNorm)) {
    return { ...base, overallSeverity: 'warning' as const, match: 'compatible' as const }
  }

  // Mismatch – Severity abhängig von Confidence
  const mismatchSeverity = rawKey.confidence * 100 < LOW_CONFIDENCE_THRESHOLD ? 'warning' as const : 'error' as const
  return { ...base, overallSeverity: mismatchSeverity, match: 'mismatch' as const }
}

export function checkKeyLibrary(
  tracks: Track[],
  rawKeys: Map<string, RawKeyResult>,
): KeyCheckResult {
  const trackResults = tracks.map((t) => compareKey(t, rawKeys.get(t.id) ?? null))

  let totalConfidence = 0
  let confidenceCount = 0
  let matched = 0
  let mismatched = 0
  let relativeKey = 0
  let compatible = 0
  let noLibraryKey = 0
  let skipped = 0

  for (const r of trackResults) {
    if (r.skipReason) { skipped++; continue }
    switch (r.match) {
      case 'match': matched++; break
      case 'mismatch': mismatched++; break
      case 'relative': relativeKey++; break
      case 'compatible': compatible++; break
      case 'no-library-key': noLibraryKey++; break
      case 'no-detection': skipped++; break
    }
    if (r.confidence > 0) {
      totalConfidence += r.confidence
      confidenceCount++
    }
  }

  return {
    type: 'key',
    tracks: trackResults,
    libraryStats: {
      totalTracks: tracks.length,
      tracksMatched: matched,
      tracksMismatched: mismatched,
      tracksRelativeKey: relativeKey,
      tracksCompatible: compatible,
      tracksNoLibraryKey: noLibraryKey,
      tracksSkipped: skipped,
      avgConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
    },
  }
}
