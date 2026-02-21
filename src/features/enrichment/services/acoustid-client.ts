import type { AcoustIdResponse } from '@/types/enrichment'

/**
 * Lookup track via AcoustID fingerprint.
 * Calls server-side API route to handle API key + rate limiting.
 */
export async function lookupAcoustId(
  fingerprint: string,
  duration: number,
): Promise<AcoustIdResponse> {
  const response = await fetch('/api/enrichment/acoustid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint, duration }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Netzwerkfehler' }))
    throw new Error(error.error ?? `AcoustID Fehler: ${response.status}`)
  }

  return response.json()
}
