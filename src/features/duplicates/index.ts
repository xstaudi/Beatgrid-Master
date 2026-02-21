export {
  checkDuplicatesMetadataOnly,
  checkDuplicatesLibrary,
} from './services/duplicate-check'
export { computeQualityScore } from './services/quality-score'
export { DuplicateSummaryCard } from './components/DuplicateSummaryCard'
export {
  METADATA_TITLE_SIMILARITY_THRESHOLD,
  METADATA_ARTIST_SIMILARITY_THRESHOLD,
  METADATA_DURATION_TOLERANCE_SECONDS,
  METADATA_DEFAULT_SIMILARITY,
  FINGERPRINT_SIMILARITY_THRESHOLD,
  FINGERPRINT_MIN_OVERLAP_RATIO,
  FORMAT_QUALITY_TIERS,
  QUALITY_WEIGHT_BITRATE,
  QUALITY_WEIGHT_FORMAT,
  QUALITY_WEIGHT_FILESIZE,
} from './constants'
