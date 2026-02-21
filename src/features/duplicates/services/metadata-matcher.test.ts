import { describe, it, expect } from 'vitest'
import { normalizeString, diceCoefficient, durationMatches, buildMetadataGroups } from './metadata-matcher'
import type { Track } from '@/types/track'

function makeTrack(overrides: Partial<Track> & { id: string; title: string; artist: string; duration: number }): Track {
  return {
    source: 'rekordbox',
    sourceId: overrides.id,
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    bpm: null,
    key: null,
    bitrate: null,
    sampleRate: null,
    fileSize: null,
    fileType: 'mp3',
    filePath: `/music/${overrides.id}.mp3`,
    fileName: `${overrides.id}.mp3`,
    tempoMarkers: [],
    cuePoints: [],
    dateAdded: null,
    ...overrides,
  }
}

describe('normalizeString', () => {
  it('lowercases input', () => {
    expect(normalizeString('Hello World')).toBe('hello world')
  })

  it('removes feat/featuring in parentheses', () => {
    expect(normalizeString('Track (feat. Someone)')).toBe('track')
    expect(normalizeString('Track (featuring Someone Else)')).toBe('track')
    expect(normalizeString('Track [ft. Artist]')).toBe('track')
  })

  it('collapses whitespace', () => {
    expect(normalizeString('  hello   world  ')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(normalizeString('')).toBe('')
  })
})

describe('diceCoefficient', () => {
  it('returns 1 for identical strings', () => {
    expect(diceCoefficient('hello', 'hello')).toBe(1)
  })

  it('returns 0 for completely different strings', () => {
    expect(diceCoefficient('ab', 'cd')).toBe(0)
  })

  it('returns 0 for strings shorter than 2 chars', () => {
    expect(diceCoefficient('a', 'a')).toBe(1) // equal, so 1
    expect(diceCoefficient('a', 'b')).toBe(0) // too short for bigrams
  })

  it('returns partial similarity for similar strings', () => {
    const sim = diceCoefficient('night', 'nacht')
    expect(sim).toBeGreaterThan(0)
    expect(sim).toBeLessThan(1)
  })

  it('handles high similarity', () => {
    const sim = diceCoefficient('california', 'californla')
    expect(sim).toBeGreaterThan(0.7)
    expect(sim).toBeLessThan(1)
  })
})

describe('durationMatches', () => {
  it('returns true for identical durations', () => {
    expect(durationMatches(300, 300)).toBe(true)
  })

  it('returns true within tolerance', () => {
    expect(durationMatches(300, 304)).toBe(true)
    expect(durationMatches(300, 296)).toBe(true)
  })

  it('returns false outside tolerance', () => {
    expect(durationMatches(300, 306)).toBe(false)
    expect(durationMatches(300, 293)).toBe(false)
  })
})

describe('buildMetadataGroups', () => {
  it('groups identical tracks', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 302 }),
    ]

    const groups = buildMetadataGroups(tracks)
    expect(groups.size).toBe(1)
    const group = Array.from(groups.values())[0]
    expect(group.size).toBe(2)
    expect(group.has('a')).toBe(true)
    expect(group.has('b')).toBe(true)
  })

  it('does not group different tracks', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'Song A', artist: 'Artist One', duration: 300 }),
      makeTrack({ id: 'b', title: 'Song B', artist: 'Artist Two', duration: 200 }),
    ]

    const groups = buildMetadataGroups(tracks)
    expect(groups.size).toBe(0)
  })

  it('handles feat variations', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song (feat. Someone)', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 301 }),
    ]

    const groups = buildMetadataGroups(tracks)
    expect(groups.size).toBe(1)
  })

  it('does not group tracks with different durations', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 400 }),
    ]

    const groups = buildMetadataGroups(tracks)
    expect(groups.size).toBe(0)
  })

  it('handles empty track list', () => {
    const groups = buildMetadataGroups([])
    expect(groups.size).toBe(0)
  })

  it('groups 3+ duplicates together', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 301 }),
      makeTrack({ id: 'c', title: 'My Song', artist: 'Artist', duration: 302 }),
    ]

    const groups = buildMetadataGroups(tracks)
    expect(groups.size).toBe(1)
    const group = Array.from(groups.values())[0]
    expect(group.size).toBe(3)
  })
})
