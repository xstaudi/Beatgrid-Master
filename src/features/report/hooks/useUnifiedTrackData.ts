import { useMemo } from 'react'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useTrackStore } from '@/stores/track-store'
import type { Track, Severity } from '@/types/track'
import type {
  CheckId,
  MetadataAuditResult,
  BeatgridCheckResult,
  BpmCheckResult,
  KeyCheckResult,
  ClippingCheckResult,
  DuplicateCheckResult,
  TrackMetadataResult,
  TrackBeatgridResult,
  TrackBpmResult,
  TrackKeyResult,
  TrackClippingResult,
  TrackDuplicateResult,
} from '@/types/analysis'

export interface UnifiedTrackRow {
  trackId: string
  track: Track | undefined
  overallSeverity: Severity
  metadata?: TrackMetadataResult
  beatgrid?: TrackBeatgridResult
  bpm?: TrackBpmResult
  key?: TrackKeyResult
  clipping?: TrackClippingResult
  duplicate?: TrackDuplicateResult
  activeChecks: CheckId[]
}

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, ok: 2 }

function worstSeverity(severities: Severity[]): Severity {
  if (severities.length === 0) return 'ok'
  return severities.reduce((worst, s) =>
    SEVERITY_RANK[s] < SEVERITY_RANK[worst] ? s : worst,
  )
}

export function useUnifiedTrackData(): {
  rows: UnifiedTrackRow[]
  activeChecks: CheckId[]
} {
  const results = useAnalysisStore((s) => s.results)
  const tracks = useTrackStore((s) => s.tracks)

  return useMemo(() => {
    if (!results) return { rows: [], activeChecks: [] }

    const activeChecks = results.config.checks
    const trackMap = new Map<string, Track>()
    for (const t of tracks) trackMap.set(t.id, t)

    // Build lookup maps per check type
    const metaResult = results.results.find((r): r is MetadataAuditResult => r.type === 'metadata')
    const beatResult = results.results.find((r): r is BeatgridCheckResult => r.type === 'beatgrid')
    const bpmResult = results.results.find((r): r is BpmCheckResult => r.type === 'bpm')
    const keyResult = results.results.find((r): r is KeyCheckResult => r.type === 'key')
    const clipResult = results.results.find((r): r is ClippingCheckResult => r.type === 'clipping')
    const dupResult = results.results.find((r): r is DuplicateCheckResult => r.type === 'duplicates')

    const metaMap = new Map(metaResult?.tracks.map((t) => [t.trackId, t]))
    const beatMap = new Map(beatResult?.tracks.map((t) => [t.trackId, t]))
    const bpmMap = new Map(bpmResult?.tracks.map((t) => [t.trackId, t]))
    const keyMap = new Map(keyResult?.tracks.map((t) => [t.trackId, t]))
    const clipMap = new Map(clipResult?.tracks.map((t) => [t.trackId, t]))
    const dupMap = new Map(dupResult?.tracks.map((t) => [t.trackId, t]))

    // Collect all unique trackIds across all results
    const allTrackIds = new Set<string>()
    for (const result of results.results) {
      for (const t of result.tracks) allTrackIds.add(t.trackId)
    }

    const rows: UnifiedTrackRow[] = Array.from(allTrackIds, (trackId) => {
      const severities: Severity[] = []
      const meta = metaMap.get(trackId)
      const beat = beatMap.get(trackId)
      const bpm = bpmMap.get(trackId)
      const key = keyMap.get(trackId)
      const clip = clipMap.get(trackId)
      const dup = dupMap.get(trackId)

      if (meta) severities.push(meta.overallSeverity)
      if (beat) severities.push(beat.overallSeverity)
      if (bpm) severities.push(bpm.overallSeverity)
      if (key) severities.push(key.overallSeverity)
      if (clip) severities.push(clip.overallSeverity)
      if (dup) severities.push(dup.overallSeverity)

      return {
        trackId,
        track: trackMap.get(trackId),
        overallSeverity: worstSeverity(severities),
        metadata: meta,
        beatgrid: beat,
        bpm: bpm,
        key: key,
        clipping: clip,
        duplicate: dup,
        activeChecks,
      }
    })

    return { rows, activeChecks }
  }, [results, tracks])
}
