// --- Enrichment Types ---

export type EnrichmentSource = 'filename' | 'acoustid' | 'musicbrainz' | 'discogs' | 'coverart'

export type EnrichmentField =
  | 'title'
  | 'artist'
  | 'album'
  | 'genre'
  | 'year'
  | 'label'
  | 'composer'
  | 'isrc'
  | 'coverUrl'

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected'

export interface FieldSuggestion {
  field: EnrichmentField
  value: string
  source: EnrichmentSource
  confidence: number // 0-100
  status: SuggestionStatus
}

export interface TrackEnrichmentResult {
  trackId: string
  suggestions: FieldSuggestion[]
  sources: EnrichmentSource[]
  acoustidRecordingId: string | null
  musicbrainzReleaseId: string | null
  isLoading: boolean
  error: string | null
}

// --- API Response Types ---

export interface AcoustIdMatch {
  recordingId: string
  title: string
  artist: string
  score: number // 0-1
}

export interface AcoustIdResponse {
  matches: AcoustIdMatch[]
}

export interface MusicBrainzRecording {
  id: string
  title: string
  artist: string
  album: string | null
  year: number | null
  isrc: string | null
  genres: string[]
  label: string | null
  releaseId: string | null
}

export interface MusicBrainzResponse {
  recordings: MusicBrainzRecording[]
}

export interface DiscogsResult {
  title: string
  artist: string
  genre: string[]
  style: string[] // Sub-Genres
  label: string | null
  year: number | null
}

export interface DiscogsResponse {
  results: DiscogsResult[]
}

// --- File Tag Types ---

export interface AudioFileTags {
  title: string | null
  artist: string | null
  album: string | null
  genre: string | null
  year: number | null
  composer: string | null
  label: string | null
  comment: string | null
  isrc: string | null
}

export interface FileTagComparison {
  field: string
  fileValue: string | null
  libraryValue: string | null
  match: boolean
}

export interface WriteBackResult {
  success: boolean
  method: 'filesystem-api' | 'download' | 'failed'
  error?: string
}

// --- Enrichment API Request Types ---

export interface AcoustIdRequest {
  fingerprint: string // Base64-encoded compressed fingerprint
  duration: number
}

export interface MusicBrainzRequest {
  recordingId?: string
  artist?: string
  title?: string
}

export interface DiscogsRequest {
  artist: string
  title: string
}

export interface CoverArtRequest {
  releaseId: string
}

export interface CoverArtResponse {
  coverUrl: string | null
}
