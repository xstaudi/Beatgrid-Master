import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { DiscogsRequest, DiscogsResponse, DiscogsResult } from '@/types/enrichment'
import { waitForToken } from '../_lib/rate-limiter'
import { LruCache } from '../_lib/cache'
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, DISCOGS_USER_AGENT } from '@/features/enrichment/constants'

const cache = new LruCache<DiscogsResponse>(CACHE_MAX_ENTRIES, CACHE_TTL_MS)

export async function POST(request: NextRequest) {
  try {
    const token = process.env.DISCOGS_CONSUMER_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'DISCOGS_CONSUMER_TOKEN nicht konfiguriert' }, { status: 500 })
    }

    const body = (await request.json()) as DiscogsRequest
    if (!body.artist || !body.title) {
      return NextResponse.json({ error: 'artist und title erforderlich' }, { status: 400 })
    }

    const cacheKey = `discogs:${body.artist}:${body.title}`
    const cached = cache.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    await waitForToken('discogs')

    const query = encodeURIComponent(`${body.artist} ${body.title}`)
    const url = `https://api.discogs.com/database/search?q=${query}&type=release&per_page=5&token=${token}`

    const response = await fetch(url, {
      headers: { 'User-Agent': DISCOGS_USER_AGENT },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Discogs API Fehler: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const results: DiscogsResult[] = (data.results ?? []).map((r: Record<string, unknown>) => ({
      title: (r.title as string) ?? '',
      artist: Array.isArray(r.artist) ? (r.artist as string[]).join(', ') : '',
      genre: Array.isArray(r.genre) ? (r.genre as string[]) : [],
      style: Array.isArray(r.style) ? (r.style as string[]) : [],
      label: Array.isArray(r.label) ? (r.label as string[])[0] ?? null : null,
      year: typeof r.year === 'number' ? r.year : typeof r.year === 'string' ? parseInt(r.year, 10) || null : null,
    }))

    const responseData: DiscogsResponse = { results }
    cache.set(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 },
    )
  }
}
