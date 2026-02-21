import type { Severity } from './track'

export type CheckId =
  | 'metadata'
  | 'beatgrid'
  | 'bpm'
  | 'key'
  | 'clipping'
  | 'duplicates'

const AUDIO_CHECKS: Set<CheckId> = new Set(['beatgrid', 'bpm', 'key', 'clipping', 'duplicates'])

export function checkRequiresAudio(check: CheckId): boolean {
  return AUDIO_CHECKS.has(check)
}
export type { Severity }

export interface MetadataFieldResult {
  field: string
  severity: 'ok' | 'warning' | 'error'
  value: string | null
  message: string
}

export interface TrackMetadataResult {
  trackId: string
  overallSeverity: 'ok' | 'warning' | 'error'
  completenessScore: number // 0-100
  fields: MetadataFieldResult[]
}

export interface MetadataAuditResult {
  type: 'metadata'
  tracks: TrackMetadataResult[]
  libraryStats: {
    totalTracks: number
    tracksWithErrors: number
    tracksWithWarnings: number
    tracksOk: number
    avgCompletenessScore: number
    fieldCoverage: Record<string, number> // field -> % coverage
  }
}

// --- Beatgrid Check ---

export interface BeatDriftPoint {
  beatIndex: number
  positionMs: number
  driftMs: number          // signed: detected - expected
  severity: Severity
}

export interface TrackBeatgridResult {
  trackId: string
  overallSeverity: Severity
  confidence: number       // 0-100
  driftPoints: BeatDriftPoint[]
  avgDriftMs: number
  maxDriftMs: number
  beatsAnalyzed: number
  beatsMatched: number
  isVariableBpm: boolean
  skipReason?: 'no-grid' | 'no-pcm' | 'no-beats-detected'
}

export interface BeatgridCheckResult {
  type: 'beatgrid'
  tracks: TrackBeatgridResult[]
  libraryStats: {
    totalTracks: number
    tracksOk: number
    tracksWithWarnings: number
    tracksWithErrors: number
    tracksSkipped: number
    avgConfidence: number
  }
}

// --- BPM Verification ---

export interface TrackBpmResult {
  trackId: string
  overallSeverity: Severity
  storedBpm: number | null
  detectedBpm: number | null
  bpmDelta: number | null
  halfDoubleAdjusted: boolean
  isVariableBpm: boolean
  segmentBpms: number[]
  bpmVariancePercent: number
  skipReason?: 'no-bpm-stored' | 'no-pcm' | 'no-beats-detected'
}

export interface BpmCheckResult {
  type: 'bpm'
  tracks: TrackBpmResult[]
  libraryStats: {
    totalTracks: number
    tracksOk: number
    tracksWithWarnings: number
    tracksWithErrors: number
    tracksSkipped: number
    avgDetectedBpm: number
  }
}

// --- Key Detection ---

export interface TrackKeyResult {
  trackId: string
  overallSeverity: Severity
  detectedKey: string | null
  libraryKey: string | null
  detectedCamelot: string | null
  detectedOpenKey: string | null
  confidence: number
  match: 'match' | 'mismatch' | 'relative' | 'no-library-key' | 'no-detection'
  skipReason?: 'no-pcm'
}

export interface KeyCheckResult {
  type: 'key'
  tracks: TrackKeyResult[]
  libraryStats: {
    totalTracks: number
    tracksMatched: number
    tracksMismatched: number
    tracksRelativeKey: number
    tracksNoLibraryKey: number
    tracksSkipped: number
    avgConfidence: number
  }
}

// --- Clipping Detection ---

export interface ClipRegion {
  startTime: number
  endTime: number
  duration: number
}

export interface TrackClippingResult {
  trackId: string
  overallSeverity: Severity
  hasClipping: boolean
  clipCount: number
  totalClippedDuration: number
  peakLevelDb: number
  peakLevelLinear: number
  regions: ClipRegion[]
  skipReason?: 'no-pcm'
}

export interface ClippingCheckResult {
  type: 'clipping'
  tracks: TrackClippingResult[]
  libraryStats: {
    totalTracks: number
    tracksClean: number
    tracksWithWarnings: number
    tracksWithClipping: number
    avgPeakLevelDb: number
  }
}

// --- Duplicate Detection ---

export type DuplicateMatchLevel = 'metadata' | 'fingerprint'

export interface DuplicateGroupMember {
  trackId: string
  qualityScore: number // 0-100
  isRecommendedKeep: boolean
}

export interface DuplicateGroup {
  groupId: string // sortierte trackIds joined mit '::'
  tracks: DuplicateGroupMember[]
  matchLevel: DuplicateMatchLevel
  similarity: number // 0-1
  recommendedKeepId: string
}

export interface TrackDuplicateResult {
  trackId: string
  overallSeverity: Severity
  duplicateGroupId: string | null
  skipReason?: 'no-pcm' | 'no-fingerprint'
}

export interface DuplicateCheckResult {
  type: 'duplicates'
  groups: DuplicateGroup[]
  tracks: TrackDuplicateResult[]
  libraryStats: {
    totalTracks: number
    duplicateGroups: number
    tracksInGroups: number
    metadataOnlyGroups: number
    fingerprintConfirmedGroups: number
  }
}

// --- Union ---

export type AnyCheckResult =
  | MetadataAuditResult
  | BeatgridCheckResult
  | BpmCheckResult
  | KeyCheckResult
  | ClippingCheckResult
  | DuplicateCheckResult

// --- Config ---

export interface AnalysisConfig {
  checks: CheckId[]
}

export interface AnalysisResults {
  completedAt: Date
  config: AnalysisConfig
  results: AnyCheckResult[]
}
