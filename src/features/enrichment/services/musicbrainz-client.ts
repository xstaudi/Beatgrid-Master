import type { MusicBrainzResponse } from '@/types/enrichment'

/**
 * Lookup recording by MusicBrainz recording ID.
 */
export async function lookupMusicBrainzById(
  recordingId: string,
): Promise<MusicBrainzResponse> {
  const response = await fetch('/api/enrichment/musicbrainz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordingId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Netzwerkfehler' }))
    throw new Error(error.error ?? `MusicBrainz Fehler: ${response.status}`)
  }

  return response.json()
}

/**
 * Search MusicBrainz by artist + title (text search fallback).
 */
export async function searchMusicBrainz(
  artist: string,
  title: string,
): Promise<MusicBrainzResponse> {
  const response = await fetch('/api/enrichment/musicbrainz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artist, title }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Netzwerkfehler' }))
    throw new Error(error.error ?? `MusicBrainz Fehler: ${response.status}`)
  }

  return response.json()
}
