// Services
export { parseFilename, suggestFromFilename } from './services/filename-parser'
export { lookupAcoustId } from './services/acoustid-client'
export { lookupMusicBrainzById, searchMusicBrainz } from './services/musicbrainz-client'
export { searchDiscogs } from './services/discogs-client'
export { lookupCoverArt } from './services/coverart-client'
export { mergeSuggestions, getMissingFields } from './services/suggestion-merger'
export { enrichTrack } from './services/enrichment-orchestrator'
export { readTagsFromFile, compareFileTags } from './services/tag-reader'
export { writeTagsToFile, writeTagsBatch, hasFileSystemAccess } from './services/tag-writer'

// Hooks
export { useEnrichment } from './hooks/useEnrichment'
export { useEnrichmentBatch } from './hooks/useEnrichmentBatch'
export { useAutoEnrichment } from './hooks/useAutoEnrichment'
export { useTagWriter } from './hooks/useTagWriter'

// Constants
export {
  ENRICHMENT_FIELD_LABELS,
  ENRICHMENT_SOURCE_LABELS,
  MIN_SUGGESTION_CONFIDENCE,
  SOURCE_CONFIDENCE,
  ACOUSTID_SCORE_THRESHOLD,
} from './constants'

// Components
export { EnrichmentStatusBadge } from './components/EnrichmentStatusBadge'
export { EnrichmentSuggestionRow } from './components/EnrichmentSuggestionRow'
export { BatchEnrichmentDialog } from './components/BatchEnrichmentDialog'
export { WriteBackConfirmDialog } from './components/WriteBackConfirmDialog'
