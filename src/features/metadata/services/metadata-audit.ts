import type { Track } from '@/types/track'
import type {
  MetadataFieldResult,
  TrackMetadataResult,
  MetadataAuditResult,
} from '@/types/analysis'

const CURRENT_YEAR = new Date().getFullYear()

const FIELD_WEIGHTS: Record<string, number> = {
  title: 25,
  artist: 25,
  genre: 15,
  year: 10,
  album: 10,
  key: 10,
  composer: 3,
  label: 1,
  comment: 1,
}

const REQUIRED_FIELDS  = ['title', 'artist'] as const  // error (rot)
const IMPORTANT_FIELDS = ['genre'] as const             // warning (orange)
const PREFERRED_FIELDS = ['album', 'year'] as const     // warning (gelb)
// key, composer, label, comment → ok wenn fehlend (nice-to-have)
const ALL_AUDIT_FIELDS = [
  ...REQUIRED_FIELDS,
  ...IMPORTANT_FIELDS,
  ...PREFERRED_FIELDS,
  'key',
  'composer',
  'label',
  'comment',
] as const

function isFieldPresent(track: Track, field: string): boolean {
  switch (field) {
    case 'title':
      return track.title.trim().length > 0
    case 'artist':
      return track.artist.trim().length > 0
    case 'genre':
      return track.genre.trim().length > 0
    case 'album':
      return track.album.trim().length > 0
    case 'composer':
      return track.composer.trim().length > 0
    case 'label':
      return track.label.trim().length > 0
    case 'comment':
      return track.comment.trim().length > 0
    case 'year':
      return track.year != null && track.year >= 1900 && track.year <= CURRENT_YEAR
    case 'key':
      return track.key != null && track.key.trim().length > 0
    default:
      return false
  }
}

function getFieldValue(track: Track, field: string): string | null {
  switch (field) {
    case 'title':
      return track.title || null
    case 'artist':
      return track.artist || null
    case 'genre':
      return track.genre || null
    case 'album':
      return track.album || null
    case 'composer':
      return track.composer || null
    case 'label':
      return track.label || null
    case 'comment':
      return track.comment || null
    case 'year':
      return track.year != null ? String(track.year) : null
    case 'key':
      return track.key
    default:
      return null
  }
}

function auditField(track: Track, field: string): MetadataFieldResult {
  const value = getFieldValue(track, field)
  const present = isFieldPresent(track, field)
  const isRequired  = (REQUIRED_FIELDS as readonly string[]).includes(field)
  const isImportant = (IMPORTANT_FIELDS as readonly string[]).includes(field)
  const isPreferred = (PREFERRED_FIELDS as readonly string[]).includes(field)

  if (present) {
    return { field, severity: 'ok', value, message: '' }
  }

  // Year out of range is a special case
  if (field === 'year' && track.year != null) {
    return {
      field,
      severity: 'warning',
      value: String(track.year),
      message: `Year ${track.year} is out of valid range (1900-${CURRENT_YEAR})`,
    }
  }

  if (isRequired) {
    return { field, severity: 'error', value, message: `Missing required field: ${field}` }
  }

  if (isImportant) {
    return { field, severity: 'warning', value, message: `Missing recommended field: ${field}` }
  }

  if (isPreferred) {
    return { field, severity: 'warning', value, message: `Optional: ${field} fehlt` }
  }

  return { field, severity: 'ok', value, message: '' }
}

export function auditTrack(track: Track): TrackMetadataResult {
  const fields = ALL_AUDIT_FIELDS.map((f) => auditField(track, f))

  const totalWeight = Object.values(FIELD_WEIGHTS).reduce((a, b) => a + b, 0)
  const earnedWeight = ALL_AUDIT_FIELDS.reduce((sum, f) => {
    if (isFieldPresent(track, f) && f in FIELD_WEIGHTS) {
      return sum + FIELD_WEIGHTS[f]
    }
    return sum
  }, 0)
  const completenessScore = Math.round((earnedWeight / totalWeight) * 100)

  const hasError = fields.some((f) => f.severity === 'error')
  const hasWarning = fields.some((f) => f.severity === 'warning')
  const overallSeverity = hasError ? 'error' : hasWarning ? 'warning' : 'ok'

  return {
    trackId: track.id,
    overallSeverity,
    completenessScore,
    fields,
  }
}

export function auditLibrary(tracks: Track[]): MetadataAuditResult {
  const trackResults = tracks.map(auditTrack)

  const totalTracks = trackResults.length
  const tracksWithErrors = trackResults.filter((t) => t.overallSeverity === 'error').length
  const tracksWithWarnings = trackResults.filter((t) => t.overallSeverity === 'warning').length
  const tracksOk = trackResults.filter((t) => t.overallSeverity === 'ok').length
  const avgCompletenessScore =
    totalTracks > 0
      ? Math.round(trackResults.reduce((sum, t) => sum + t.completenessScore, 0) / totalTracks)
      : 0

  // Calculate field coverage: % of tracks where each field is present
  const fieldCoverage: Record<string, number> = {}
  for (const field of ALL_AUDIT_FIELDS) {
    if (totalTracks === 0) {
      fieldCoverage[field] = 0
      continue
    }
    const presentCount = trackResults.filter((t) =>
      t.fields.find((f) => f.field === field && f.severity === 'ok')
    ).length
    fieldCoverage[field] = Math.round((presentCount / totalTracks) * 100)
  }

  return {
    type: 'metadata',
    tracks: trackResults,
    libraryStats: {
      totalTracks,
      tracksWithErrors,
      tracksWithWarnings,
      tracksOk,
      avgCompletenessScore,
      fieldCoverage,
    },
  }
}
