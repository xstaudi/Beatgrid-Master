import type { Track } from '@/types/track'
import type { TrackKeyResult, KeyCheckResult } from '@/types/analysis'
import type { RawKeyResult } from '@/types/audio'
import { normalizeKey, getRelativeKey, musicalToCamelot, musicalToOpenKey } from './key-notation'

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
      confidence: rawKey.confidence,
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
      confidence: rawKey.confidence,
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
      confidence: rawKey.confidence,
      match: 'match',
    }
  }

  // Relative key match (Am <-> C)
  const relativeKey = getRelativeKey(detectedNorm)
  if (relativeKey && relativeKey === libraryNorm) {
    return {
      trackId: track.id,
      overallSeverity: 'warning',
      detectedKey: rawKey.detectedKey,
      libraryKey: track.key,
      detectedCamelot,
      detectedOpenKey,
      confidence: rawKey.confidence,
      match: 'relative',
    }
  }

  // Mismatch
  return {
    trackId: track.id,
    overallSeverity: 'error',
    detectedKey: rawKey.detectedKey,
    libraryKey: track.key,
    detectedCamelot,
    detectedOpenKey,
    confidence: rawKey.confidence,
    match: 'mismatch',
  }
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
  let noLibraryKey = 0
  let skipped = 0

  for (const r of trackResults) {
    if (r.skipReason) { skipped++; continue }
    switch (r.match) {
      case 'match': matched++; break
      case 'mismatch': mismatched++; break
      case 'relative': relativeKey++; break
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
      tracksNoLibraryKey: noLibraryKey,
      tracksSkipped: skipped,
      avgConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
    },
  }
}
