import type { CoverArtResponse } from '@/types/enrichment'

/**
 * Lookup album cover art from Cover Art Archive.
 * Returns the cover URL or null if not found.
 */
export async function lookupCoverArt(
  releaseId: string,
): Promise<CoverArtResponse> {
  const response = await fetch('/api/enrichment/coverart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ releaseId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Netzwerkfehler' }))
    throw new Error(error.error ?? `Cover Art Fehler: ${response.status}`)
  }

  return response.json()
}
