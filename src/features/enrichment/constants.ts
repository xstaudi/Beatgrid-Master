import type { EnrichmentSource, EnrichmentField } from '@/types/enrichment'

// --- Konfidenz-Schwellen ---

/** Minimale Konfidenz damit ein Vorschlag angezeigt wird */
export const MIN_SUGGESTION_CONFIDENCE = 40

/** Konfidenz-Werte pro Quellen-Kombination */
export const SOURCE_CONFIDENCE: Record<string, number> = {
  /** AcoustID + MusicBrainz (Fingerprint-Match, Score > 0.8) */
  'acoustid+musicbrainz': 95,
  /** MusicBrainz Text-Search (exakter Match) */
  'musicbrainz-text': 80,
  /** Discogs Search */
  'discogs': 70,
  /** Filename-Parser */
  'filename': 50,
}

/** AcoustID Score-Schwelle ab der ein Match als vertrauenswuerdig gilt */
export const ACOUSTID_SCORE_THRESHOLD = 0.8

// --- Source-Prioritaeten (hoeher = bevorzugt) ---

export const SOURCE_PRIORITY: Record<EnrichmentSource, number> = {
  acoustid: 5,
  musicbrainz: 4,
  discogs: 3,
  coverart: 2,
  filename: 1,
}

// --- Felder die per Enrichment vorgeschlagen werden koennen ---

export const ENRICHABLE_FIELDS: EnrichmentField[] = [
  'title',
  'artist',
  'album',
  'genre',
  'year',
  'label',
  'composer',
  'isrc',
  'coverUrl',
]

// --- Rate-Limiting ---

export const RATE_LIMITS = {
  acoustid: { tokensPerSecond: 3, bucketSize: 3 },
  musicbrainz: { tokensPerSecond: 1, bucketSize: 1 },
  discogs: { tokensPerSecond: 1, bucketSize: 1 },
} as const

// --- Cache ---

export const CACHE_MAX_ENTRIES = 10_000
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

// --- User-Agent (MusicBrainz erfordert einen) ---

export const MUSICBRAINZ_USER_AGENT = 'BeatgridMaster/0.1.0 (https://beatgridmaster.com)'
export const DISCOGS_USER_AGENT = 'BeatgridMaster/0.1.0'

// --- Feld-Labels fuer UI ---

export const ENRICHMENT_FIELD_LABELS: Record<EnrichmentField, string> = {
  title: 'Title',
  artist: 'Artist',
  album: 'Album',
  genre: 'Genre',
  year: 'Year',
  label: 'Label',
  composer: 'Composer',
  isrc: 'ISRC',
  coverUrl: 'Cover',
}

export const ENRICHMENT_SOURCE_LABELS: Record<EnrichmentSource, string> = {
  filename: 'Dateiname',
  acoustid: 'AcoustID',
  musicbrainz: 'MusicBrainz',
  discogs: 'Discogs',
  coverart: 'Cover Art Archive',
}
