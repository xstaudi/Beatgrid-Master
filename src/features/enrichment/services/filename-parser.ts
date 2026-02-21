import type { FieldSuggestion } from '@/types/enrichment'
import { SOURCE_CONFIDENCE } from '../constants'

interface ParsedFilename {
  artist: string | null
  title: string | null
}

/**
 * Parse artist and title from audio filename.
 * Strips track numbers, file extensions, and common separators.
 */
export function parseFilename(fileName: string): ParsedFilename {
  // Remove extension
  let name = fileName.replace(/\.[^.]+$/, '')

  // Remove leading track number (e.g. "01", "01.", "01 -", "01_")
  name = name.replace(/^\d{1,3}[\.\s_-]*\s*/, '')

  // Try "Artist - Title" pattern (most common in DJ files)
  // Also handle "Artist_-_Title" and "Artist – Title" (en-dash)
  const separatorMatch = name.match(/^(.+?)\s*[-–]\s*(.+)$/)
  if (separatorMatch) {
    const artist = cleanField(separatorMatch[1])
    const title = cleanField(separatorMatch[2])
    if (artist && title) {
      return { artist, title }
    }
  }

  // No separator found - use whole name as title
  const cleaned = cleanField(name)
  return { artist: null, title: cleaned || null }
}

/**
 * Clean a parsed field value:
 * - Replace underscores with spaces
 * - Collapse whitespace
 * - Trim
 */
function cleanField(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate enrichment suggestions from a filename.
 * Only suggests fields that are currently empty in the track.
 */
export function suggestFromFilename(
  fileName: string,
  missingFields: Set<string>,
): FieldSuggestion[] {
  const parsed = parseFilename(fileName)
  const suggestions: FieldSuggestion[] = []
  const confidence = SOURCE_CONFIDENCE['filename']

  if (parsed.artist && missingFields.has('artist')) {
    suggestions.push({
      field: 'artist',
      value: parsed.artist,
      source: 'filename',
      confidence,
      status: 'pending',
    })
  }

  if (parsed.title && missingFields.has('title')) {
    suggestions.push({
      field: 'title',
      value: parsed.title,
      source: 'filename',
      confidence,
      status: 'pending',
    })
  }

  return suggestions
}
