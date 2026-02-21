import type { TempoMarker } from './track'

export type FixKind = 'bpm' | 'key' | 'beatgrid' | 'duplicate-remove' | 'clipping-normalize'

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
  tempoMarkers?: TempoMarker[]
  // duplicate-remove
  groupId?: string
  // clipping-normalize
  peakLevelLinear?: number   // gemessener Peak (0.0–1.0)
  targetPeakDb?: number      // Ziel in dBFS, default: -0.1
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
