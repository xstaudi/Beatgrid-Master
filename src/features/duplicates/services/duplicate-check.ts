import type { Track } from '@/types/track'
import type { RawFingerprintResult } from '@/types/audio'
import type {
  DuplicateCheckResult,
  DuplicateGroup,
  DuplicateGroupMember,
  TrackDuplicateResult,
} from '@/types/analysis'
import { METADATA_DEFAULT_SIMILARITY } from '../constants'
import { buildMetadataGroups } from './metadata-matcher'
import { confirmDuplicates } from './fingerprint-matcher'
import { computeQualityScore } from './quality-score'

function buildDuplicateGroup(
  memberIds: Set<string>,
  tracks: Track[],
  matchLevel: 'metadata' | 'fingerprint',
  similarity: number,
): DuplicateGroup {
  const trackMap = new Map(tracks.map((t) => [t.id, t]))
  const members: DuplicateGroupMember[] = Array.from(memberIds).map((id) => {
    const track = trackMap.get(id)!
    return {
      trackId: id,
      qualityScore: computeQualityScore(track),
      isRecommendedKeep: false,
    }
  })

  // Best quality track is recommended to keep
  members.sort((a, b) => b.qualityScore - a.qualityScore)
  members[0].isRecommendedKeep = true

  const sortedIds = Array.from(memberIds).sort()

  return {
    groupId: sortedIds.join('::'),
    tracks: members,
    matchLevel,
    similarity,
    recommendedKeepId: members[0].trackId,
  }
}

/**
 * Level 1 only: metadata-based duplicate detection (no audio required).
 */
export function checkDuplicatesMetadataOnly(tracks: Track[]): DuplicateCheckResult {
  const metadataGroups = buildMetadataGroups(tracks)

  const groups: DuplicateGroup[] = []
  for (const [, members] of metadataGroups) {
    // Compute average similarity within group (use 0.85 as default for metadata)
    groups.push(buildDuplicateGroup(members, tracks, 'metadata', METADATA_DEFAULT_SIMILARITY))
  }

  return buildResult(tracks, groups)
}

/**
 * Level 1 + Level 2: metadata candidates confirmed with audio fingerprints.
 */
export function checkDuplicatesLibrary(
  tracks: Track[],
  fingerprints: Map<string, RawFingerprintResult>,
): DuplicateCheckResult {
  const metadataGroups = buildMetadataGroups(tracks)
  const confirmedGroups = confirmDuplicates(metadataGroups, fingerprints)

  const groups: DuplicateGroup[] = []

  // Add fingerprint-confirmed groups
  const confirmedTrackIds = new Set<string>()
  for (const [, { members, similarity }] of confirmedGroups) {
    groups.push(buildDuplicateGroup(members, tracks, 'fingerprint', similarity))
    for (const id of members) confirmedTrackIds.add(id)
  }

  // Add remaining metadata-only groups (not confirmed by fingerprint)
  for (const [, members] of metadataGroups) {
    const unconfirmed = new Set<string>()
    for (const id of members) {
      if (!confirmedTrackIds.has(id)) unconfirmed.add(id)
    }
    if (unconfirmed.size >= 2) {
      groups.push(buildDuplicateGroup(unconfirmed, tracks, 'metadata', METADATA_DEFAULT_SIMILARITY))
    }
  }

  return buildResult(tracks, groups)
}

function buildResult(tracks: Track[], groups: DuplicateGroup[]): DuplicateCheckResult {
  const trackGroupMap = new Map<string, string>()
  for (const group of groups) {
    for (const member of group.tracks) {
      trackGroupMap.set(member.trackId, group.groupId)
    }
  }

  const trackResults: TrackDuplicateResult[] = tracks.map((t) => ({
    trackId: t.id,
    overallSeverity: trackGroupMap.has(t.id) ? 'warning' : 'ok',
    duplicateGroupId: trackGroupMap.get(t.id) ?? null,
  }))

  const metadataOnlyGroups = groups.filter((g) => g.matchLevel === 'metadata').length
  const fingerprintConfirmedGroups = groups.filter((g) => g.matchLevel === 'fingerprint').length

  return {
    type: 'duplicates',
    groups,
    tracks: trackResults,
    libraryStats: {
      totalTracks: tracks.length,
      duplicateGroups: groups.length,
      tracksInGroups: trackGroupMap.size,
      metadataOnlyGroups,
      fingerprintConfirmedGroups,
    },
  }
}
