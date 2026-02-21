import type { DiscogsResponse } from '@/types/enrichment'

/**
 * Search Discogs for track metadata.
 * Returns genre, style (sub-genre), label, year.
 */
export async function searchDiscogs(
  artist: string,
  title: string,
): Promise<DiscogsResponse> {
  const response = await fetch('/api/enrichment/discogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artist, title }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Netzwerkfehler' }))
    throw new Error(error.error ?? `Discogs Fehler: ${response.status}`)
  }

  return response.json()
}
