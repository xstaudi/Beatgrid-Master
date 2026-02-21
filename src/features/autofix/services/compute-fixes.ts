import type { Track } from '@/types/track'
import type {
  AnalysisResults,
  BpmCheckResult,
  KeyCheckResult,
  BeatgridCheckResult,
} from '@/types/analysis'
import type { FixEntry, FixOperation } from '@/types/fix'

function trackLabel(trackMap: Map<string, Track>, trackId: string): string {
  const t = trackMap.get(trackId)
  if (!t) return trackId
  return [t.artist, t.title].filter(Boolean).join(' – ') || trackId
}

function computeBpmFixes(trackMap: Map<string, Track>, result: BpmCheckResult): FixEntry[] {
  const fixes: FixEntry[] = []
  for (const tr of result.tracks) {
    if (
      tr.overallSeverity !== 'error' ||
      tr.isVariableBpm ||
      tr.detectedBpm == null
    )
      continue

    const track = trackMap.get(tr.trackId)
    if (!track) continue

    const op: FixOperation = {
      kind: 'bpm',
      trackId: tr.trackId,
      sourceId: track.sourceId,
      detectedBpm: tr.detectedBpm,
      storedBpm: tr.storedBpm ?? undefined,
    }
    fixes.push({
      operation: op,
      status: 'pending',
      preview: {
        label: trackLabel(trackMap, tr.trackId),
        before: tr.storedBpm != null ? `${tr.storedBpm.toFixed(2)} BPM` : '–',
        after: `${tr.detectedBpm.toFixed(2)} BPM`,
      },
    })
  }
  return fixes
}

function computeKeyFixes(trackMap: Map<string, Track>, result: KeyCheckResult): FixEntry[] {
  const fixes: FixEntry[] = []
  for (const tr of result.tracks) {
    if (tr.detectedKey == null) continue
    if (tr.match !== 'mismatch' && tr.match !== 'no-library-key') continue

    const track = trackMap.get(tr.trackId)
    if (!track) continue

    const op: FixOperation = {
      kind: 'key',
      trackId: tr.trackId,
      sourceId: track.sourceId,
      detectedKey: tr.detectedKey,
      libraryKey: tr.libraryKey ?? undefined,
    }
    fixes.push({
      operation: op,
      status: 'pending',
      preview: {
        label: trackLabel(trackMap, tr.trackId),
        before: tr.libraryKey ?? '–',
        after: tr.detectedKey,
      },
    })
  }
  return fixes
}

function computeBeatgridFixes(
  trackMap: Map<string, Track>,
  result: BeatgridCheckResult,
): FixEntry[] {
  const fixes: FixEntry[] = []
  for (const tr of result.tracks) {
    if (
      tr.overallSeverity !== 'error' ||
      tr.isVariableBpm ||
      tr.driftPoints.length === 0
    )
      continue

    const track = trackMap.get(tr.trackId)
    if (!track || track.tempoMarkers.length === 0) continue

    const avgSignedDriftMs =
      tr.driftPoints.reduce((sum, d) => sum + d.driftMs, 0) /
      tr.driftPoints.length
    const currentPos = track.tempoMarkers[0].position
    const newDownbeatSec = currentPos + avgSignedDriftMs / 1000
    const bpm = track.tempoMarkers[0].bpm

    const op: FixOperation = {
      kind: 'beatgrid',
      trackId: tr.trackId,
      sourceId: track.sourceId,
      newDownbeatSec,
      bpm,
    }
    fixes.push({
      operation: op,
      status: 'pending',
      preview: {
        label: trackLabel(trackMap, tr.trackId),
        before: `${currentPos.toFixed(3)}s`,
        after: `${newDownbeatSec.toFixed(3)}s`,
      },
    })
  }
  return fixes
}

export function computeFixes(
  tracks: Track[],
  results: AnalysisResults,
): FixEntry[] {
  const trackMap = new Map(tracks.map((t) => [t.id, t]))
  const fixes: FixEntry[] = []

  const bpmResult = results.results.find(
    (r): r is BpmCheckResult => r.type === 'bpm',
  )
  if (bpmResult) fixes.push(...computeBpmFixes(trackMap, bpmResult))

  const keyResult = results.results.find(
    (r): r is KeyCheckResult => r.type === 'key',
  )
  if (keyResult) fixes.push(...computeKeyFixes(trackMap, keyResult))

  const beatgridResult = results.results.find(
    (r): r is BeatgridCheckResult => r.type === 'beatgrid',
  )
  if (beatgridResult) fixes.push(...computeBeatgridFixes(trackMap, beatgridResult))

  return fixes
}
