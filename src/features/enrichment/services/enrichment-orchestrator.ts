import type { Track } from '@/types/track'
import type {
  FieldSuggestion,
  TrackEnrichmentResult,
  EnrichmentSource,
  MusicBrainzRecording,
} from '@/types/enrichment'
import { parseFilename, suggestFromFilename } from './filename-parser'
import { lookupAcoustId } from './acoustid-client'
import { lookupMusicBrainzById, searchMusicBrainz } from './musicbrainz-client'
import { mergeSuggestions, getMissingFields } from './suggestion-merger'
import { SOURCE_CONFIDENCE, ACOUSTID_SCORE_THRESHOLD } from '../constants'

interface EnrichmentContext {
  /** Vorberechneter Fingerprint (aus Analysis-Store) */
  fingerprint?: Int32Array
  /** Base64-encoded Fingerprint fuer AcoustID */
  encodedFingerprint?: string
  /** Audio-Dauer in Sekunden */
  duration?: number
}

/**
 * Orchestriert den Enrichment-Prozess fuer einen einzelnen Track.
 * Fuehrt alle verfuegbaren Quellen der Reihe nach aus:
 * 1. Filename-Parsing (synchron, client-side)
 * 2. AcoustID Lookup (wenn Fingerprint vorhanden)
 * 3. MusicBrainz Recording-Lookup (wenn AcoustID-Match)
 * 3b. MusicBrainz Text-Search (Fallback)
 */
export async function enrichTrack(
  track: Track,
  context: EnrichmentContext,
  onProgress?: (source: EnrichmentSource) => void,
): Promise<TrackEnrichmentResult> {
  const missingFields = getMissingFields(track)
  const allSuggestions: FieldSuggestion[] = []
  const sources: EnrichmentSource[] = []
  let acoustidRecordingId: string | null = null
  let musicbrainzReleaseId: string | null = null

  // Step 1: Filename-Parsing (immer, synchron)
  onProgress?.('filename')
  const filenameSuggestions = suggestFromFilename(track.fileName, missingFields)
  allSuggestions.push(...filenameSuggestions)
  if (filenameSuggestions.length > 0) sources.push('filename')

  // Artist/Title aus Filename oder Track fuer spaetere Text-Suche
  const parsed = parseFilename(track.fileName)
  const searchArtist = track.artist?.trim() || parsed.artist || ''
  const searchTitle = track.title?.trim() || parsed.title || ''

  // Step 2: AcoustID (wenn Fingerprint vorhanden)
  if (context.encodedFingerprint && context.duration) {
    onProgress?.('acoustid')
    try {
      const acoustidResult = await lookupAcoustId(
        context.encodedFingerprint,
        context.duration,
      )

      const bestMatch = acoustidResult.matches
        .filter((m) => m.score >= ACOUSTID_SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score)[0]

      if (bestMatch) {
        acoustidRecordingId = bestMatch.recordingId
        sources.push('acoustid')

        // Step 3a: MusicBrainz Recording-Lookup
        onProgress?.('musicbrainz')
        try {
          const mbResult = await lookupMusicBrainzById(bestMatch.recordingId)
          const recording = mbResult.recordings[0]
          if (recording) {
            const mbSuggestions = recordingToSuggestions(
              recording,
              SOURCE_CONFIDENCE['acoustid+musicbrainz'],
            )
            allSuggestions.push(...mbSuggestions)
            musicbrainzReleaseId = recording.releaseId
            sources.push('musicbrainz')
          }
        } catch {
          // MusicBrainz-Lookup fehlgeschlagen, weiter mit Fallback
        }
      }
    } catch {
      // AcoustID fehlgeschlagen, weiter mit Text-Search
    }
  }

  // Step 3b: MusicBrainz Text-Search (Fallback wenn kein AcoustID-Match)
  if (!acoustidRecordingId && searchArtist && searchTitle) {
    onProgress?.('musicbrainz')
    try {
      const mbResult = await searchMusicBrainz(searchArtist, searchTitle)
      const recording = mbResult.recordings[0]
      if (recording) {
        const mbSuggestions = recordingToSuggestions(
          recording,
          SOURCE_CONFIDENCE['musicbrainz-text'],
        )
        allSuggestions.push(...mbSuggestions)
        musicbrainzReleaseId = recording.releaseId
        if (!sources.includes('musicbrainz')) sources.push('musicbrainz')
      }
    } catch {
      // Text-Search fehlgeschlagen
    }
  }

  // Merge: Pro Feld gewinnt hoechste Konfidenz
  const merged = mergeSuggestions(allSuggestions, missingFields)

  return {
    trackId: track.id,
    suggestions: merged,
    sources,
    acoustidRecordingId,
    musicbrainzReleaseId,
    isLoading: false,
    error: null,
  }
}

/**
 * Konvertiert ein MusicBrainz Recording in FieldSuggestions.
 */
function recordingToSuggestions(
  recording: MusicBrainzRecording,
  confidence: number,
): FieldSuggestion[] {
  const suggestions: FieldSuggestion[] = []
  const source: EnrichmentSource = 'musicbrainz'

  if (recording.title) {
    suggestions.push({ field: 'title', value: recording.title, source, confidence, status: 'pending' })
  }
  if (recording.artist) {
    suggestions.push({ field: 'artist', value: recording.artist, source, confidence, status: 'pending' })
  }
  if (recording.album) {
    suggestions.push({ field: 'album', value: recording.album, source, confidence, status: 'pending' })
  }
  if (recording.year) {
    suggestions.push({ field: 'year', value: String(recording.year), source, confidence, status: 'pending' })
  }
  if (recording.isrc) {
    suggestions.push({ field: 'isrc', value: recording.isrc, source, confidence, status: 'pending' })
  }
  if (recording.genres.length > 0) {
    suggestions.push({ field: 'genre', value: recording.genres[0], source, confidence, status: 'pending' })
  }
  if (recording.label) {
    suggestions.push({ field: 'label', value: recording.label, source, confidence, status: 'pending' })
  }

  return suggestions
}
