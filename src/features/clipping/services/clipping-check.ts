import type { Track } from '@/types/track'
import type { Severity, TrackClippingResult, ClippingCheckResult } from '@/types/analysis'
import type { RawClipResult } from '@/types/audio'
import { WARNING_MAX_REGIONS, WARNING_MAX_DURATION_SEC } from '../constants'

function clippingSeverity(clipCount: number, totalDuration: number): Severity {
  if (clipCount === 0) return 'ok'
  if (clipCount <= WARNING_MAX_REGIONS && totalDuration < WARNING_MAX_DURATION_SEC) return 'warning'
  return 'error'
}

export function checkClipping(track: Track, rawClip: RawClipResult | null): TrackClippingResult {
  if (!rawClip) {
    return {
      trackId: track.id,
      overallSeverity: 'ok',
      hasClipping: false,
      clipCount: 0,
      totalClippedDuration: 0,
      peakLevelDb: -Infinity,
      peakLevelLinear: 0,
      regions: [],
      skipReason: 'no-pcm',
    }
  }

  const totalClippedDuration = rawClip.regions.reduce((sum, r) => sum + r.duration, 0)
  const severity = clippingSeverity(rawClip.clipCount, totalClippedDuration)

  return {
    trackId: track.id,
    overallSeverity: severity,
    hasClipping: rawClip.hasClipping,
    clipCount: rawClip.clipCount,
    totalClippedDuration,
    peakLevelDb: rawClip.peakLevelDb,
    peakLevelLinear: rawClip.peakLevelLinear,
    regions: rawClip.regions,
  }
}

export function checkClippingLibrary(
  tracks: Track[],
  rawClips: Map<string, RawClipResult>,
): ClippingCheckResult {
  const trackResults = tracks.map((t) => checkClipping(t, rawClips.get(t.id) ?? null))

  let clean = 0
  let warnings = 0
  let clipping = 0
  let totalPeakDb = 0
  let peakCount = 0

  for (const r of trackResults) {
    if (r.skipReason) continue

    switch (r.overallSeverity) {
      case 'ok': clean++; break
      case 'warning': warnings++; break
      case 'error': clipping++; break
    }

    if (isFinite(r.peakLevelDb)) {
      totalPeakDb += r.peakLevelDb
      peakCount++
    }
  }

  return {
    type: 'clipping',
    tracks: trackResults,
    libraryStats: {
      totalTracks: tracks.length,
      tracksClean: clean,
      tracksWithWarnings: warnings,
      tracksWithClipping: clipping,
      avgPeakLevelDb: peakCount > 0 ? totalPeakDb / peakCount : -Infinity,
    },
  }
}
