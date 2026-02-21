export type FixKind = 'bpm' | 'key' | 'beatgrid' | 'duplicate-remove'

export interface FixOperation {
  kind: FixKind
  trackId: string
  sourceId: string
  // bpm
  detectedBpm?: number
  storedBpm?: number
  // key
  detectedKey?: string
  libraryKey?: string
  // beatgrid
  newDownbeatSec?: number
  bpm?: number
  // duplicate-remove
  groupId?: string
}

export type FixStatus = 'pending' | 'approved' | 'skipped'

export interface FixEntry {
  operation: FixOperation
  status: FixStatus
  preview: { label: string; before: string; after: string }
}

export interface MutationResult {
  xmlContent: string
  appliedCount: number
  skippedTrackIds: string[]
  removedTrackIds: string[]
}
