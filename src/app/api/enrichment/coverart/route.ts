import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CoverArtRequest, CoverArtResponse } from '@/types/enrichment'
import { LruCache } from '../_lib/cache'
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS } from '@/features/enrichment/constants'

const cache = new LruCache<CoverArtResponse>(CACHE_MAX_ENTRIES, CACHE_TTL_MS)

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CoverArtRequest
    if (!body.releaseId) {
      return NextResponse.json({ error: 'releaseId erforderlich' }, { status: 400 })
    }

    const cacheKey = `coverart:${body.releaseId}`
    const cached = cache.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    // Cover Art Archive hat kein Rate-Limit
    const url = `https://coverartarchive.org/release/${body.releaseId}`
    const response = await fetch(url)

    if (!response.ok) {
      const responseData: CoverArtResponse = { coverUrl: null }
      cache.set(cacheKey, responseData)
      return NextResponse.json(responseData)
    }

    const data = await response.json()
    const frontImage = (data.images as Array<{ front: boolean; thumbnails: { small: string; large: string } }>)
      ?.find((img) => img.front)

    const coverUrl = frontImage?.thumbnails?.large ?? frontImage?.thumbnails?.small ?? null

    const responseData: CoverArtResponse = { coverUrl }
    cache.set(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 },
    )
  }
}
