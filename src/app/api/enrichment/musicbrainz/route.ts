import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { MusicBrainzRequest, MusicBrainzResponse, MusicBrainzRecording } from '@/types/enrichment'
import { waitForToken } from '../_lib/rate-limiter'
import { LruCache } from '../_lib/cache'
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, MUSICBRAINZ_USER_AGENT } from '@/features/enrichment/constants'

const cache = new LruCache<MusicBrainzResponse>(CACHE_MAX_ENTRIES, CACHE_TTL_MS)
const MB_BASE = 'https://musicbrainz.org/ws/2'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MusicBrainzRequest

    if (!body.recordingId && !(body.artist && body.title)) {
      return NextResponse.json(
        { error: 'recordingId oder artist+title erforderlich' },
        { status: 400 },
      )
    }

    // Cache check
    const cacheKey = body.recordingId
      ? `mb:rec:${body.recordingId}`
      : `mb:search:${body.artist}:${body.title}`
    const cached = cache.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    await waitForToken('musicbrainz')

    let recordings: MusicBrainzRecording[]

    if (body.recordingId) {
      recordings = await lookupRecording(body.recordingId)
    } else {
      recordings = await searchRecording(body.artist!, body.title!)
    }

    const responseData: MusicBrainzResponse = { recordings }
    cache.set(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 },
    )
  }
}

async function lookupRecording(recordingId: string): Promise<MusicBrainzRecording[]> {
  const url = `${MB_BASE}/recording/${recordingId}?inc=artists+releases+genres+isrcs+labels&fmt=json`
  const response = await fetch(url, {
    headers: { 'User-Agent': MUSICBRAINZ_USER_AGENT },
  })

  if (!response.ok) return []

  const data = await response.json()
  return [mapRecording(data)]
}

async function searchRecording(artist: string, title: string): Promise<MusicBrainzRecording[]> {
  const query = `recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"`
  const url = `${MB_BASE}/recording?query=${query}&limit=5&fmt=json`
  const response = await fetch(url, {
    headers: { 'User-Agent': MUSICBRAINZ_USER_AGENT },
  })

  if (!response.ok) return []

  const data = await response.json()
  return (data.recordings ?? []).map(mapRecording)
}

function mapRecording(rec: Record<string, unknown>): MusicBrainzRecording {
  const artists = rec['artist-credit'] as Array<{ name: string }> | undefined
  const releases = rec.releases as Array<{
    title: string
    date?: string
    'release-group'?: { 'primary-type'?: string }
    'label-info'?: Array<{ label?: { name: string } }>
  }> | undefined
  const genres = rec.genres as Array<{ name: string }> | undefined
  const isrcs = rec.isrcs as string[] | undefined

  const firstRelease = releases?.[0]

  return {
    id: rec.id as string,
    title: rec.title as string,
    artist: artists?.map((a) => a.name).join(', ') ?? '',
    album: firstRelease?.title ?? null,
    year: firstRelease?.date ? parseInt(firstRelease.date.slice(0, 4), 10) || null : null,
    isrc: isrcs?.[0] ?? null,
    genres: genres?.map((g) => g.name) ?? [],
    label: firstRelease?.['label-info']?.[0]?.label?.name ?? null,
    releaseId: firstRelease ? (firstRelease as Record<string, unknown>).id as string : null,
  }
}
