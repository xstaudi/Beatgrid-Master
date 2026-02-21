import type { FieldSuggestion, EnrichmentField } from '@/types/enrichment'
import { MIN_SUGGESTION_CONFIDENCE } from '../constants'

/**
 * Merge suggestions from multiple sources.
 * Per field: highest confidence wins.
 * Only keeps suggestions above MIN_SUGGESTION_CONFIDENCE.
 */
export function mergeSuggestions(
  allSuggestions: FieldSuggestion[],
  missingFields: Set<string>,
): FieldSuggestion[] {
  // Group by field, keep highest confidence per field
  const bestPerField = new Map<EnrichmentField, FieldSuggestion>()

  for (const suggestion of allSuggestions) {
    // Only suggest for actually missing fields
    if (!missingFields.has(suggestion.field)) continue
    // Minimum confidence threshold
    if (suggestion.confidence < MIN_SUGGESTION_CONFIDENCE) continue

    const existing = bestPerField.get(suggestion.field)
    if (!existing || suggestion.confidence > existing.confidence) {
      bestPerField.set(suggestion.field, suggestion)
    }
  }

  return Array.from(bestPerField.values())
}

/**
 * Determine which fields are missing/empty for a track.
 * Uses the same logic as metadata-audit but returns a Set for quick lookup.
 */
export function getMissingFields(track: {
  title: string
  artist: string
  album: string
  genre: string
  year: number | null
  label: string
  composer: string
}): Set<string> {
  const missing = new Set<string>()

  if (!track.title?.trim()) missing.add('title')
  if (!track.artist?.trim()) missing.add('artist')
  if (!track.album?.trim()) missing.add('album')
  if (!track.genre?.trim()) missing.add('genre')
  if (track.year == null || track.year < 1900) missing.add('year')
  if (!track.label?.trim()) missing.add('label')
  if (!track.composer?.trim()) missing.add('composer')
  // isrc and coverUrl are always "missing" since tracks don't have them
  missing.add('isrc')
  missing.add('coverUrl')

  return missing
}
