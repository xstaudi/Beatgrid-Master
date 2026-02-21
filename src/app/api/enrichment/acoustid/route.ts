import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { AcoustIdRequest, AcoustIdResponse, AcoustIdMatch } from '@/types/enrichment'
import { waitForToken } from '../_lib/rate-limiter'
import { LruCache } from '../_lib/cache'
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, MUSICBRAINZ_USER_AGENT } from '@/features/enrichment/constants'

const cache = new LruCache<AcoustIdResponse>(CACHE_MAX_ENTRIES, CACHE_TTL_MS)

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ACOUSTID_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ACOUSTID_API_KEY nicht konfiguriert' }, { status: 500 })
    }

    const body = (await request.json()) as AcoustIdRequest
    if (!body.fingerprint || !body.duration) {
      return NextResponse.json({ error: 'fingerprint und duration erforderlich' }, { status: 400 })
    }

    // Cache check
    const cacheKey = `acoustid:${body.fingerprint.slice(0, 100)}:${Math.round(body.duration)}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    await waitForToken('acoustid')

    const params = new URLSearchParams({
      client: apiKey,
      meta: 'recordings',
      fingerprint: body.fingerprint,
      duration: String(Math.round(body.duration)),
    })

    const response = await fetch(`https://api.acoustid.org/v2/lookup?${params}`, {
      headers: { 'User-Agent': MUSICBRAINZ_USER_AGENT },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `AcoustID API Fehler: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const matches: AcoustIdMatch[] = []

    for (const result of data.results ?? []) {
      if (!result.recordings?.length) continue
      for (const rec of result.recordings) {
        matches.push({
          recordingId: rec.id,
          title: rec.title ?? '',
          artist: rec.artists?.map((a: { name: string }) => a.name).join(', ') ?? '',
          score: result.score ?? 0,
        })
      }
    }

    const responseData: AcoustIdResponse = { matches }
    cache.set(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 },
    )
  }
}
