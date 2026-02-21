// --- Metadata Matching Thresholds ---

export const METADATA_TITLE_SIMILARITY_THRESHOLD = 0.80
export const METADATA_ARTIST_SIMILARITY_THRESHOLD = 0.80
export const METADATA_DURATION_TOLERANCE_SECONDS = 5

// --- Fingerprint Matching ---

export const FINGERPRINT_SIMILARITY_THRESHOLD = 0.80
export const FINGERPRINT_MIN_OVERLAP_RATIO = 0.50

// --- Metadata Matching Defaults ---

export const METADATA_DEFAULT_SIMILARITY = 0.85

// --- Quality Scoring ---

export const FORMAT_QUALITY_TIERS: Record<string, number> = {
  flac: 100,
  wav: 100,
  aiff: 100,
  m4a: 80,
  aac: 80,
  mp3: 60,
  ogg: 50,
}

export const QUALITY_WEIGHT_BITRATE = 0.60
export const QUALITY_WEIGHT_FORMAT = 0.25
export const QUALITY_WEIGHT_FILESIZE = 0.15
