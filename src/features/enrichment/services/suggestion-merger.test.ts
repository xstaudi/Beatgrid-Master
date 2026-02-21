import { describe, it, expect } from 'vitest'
import { mergeSuggestions, getMissingFields } from './suggestion-merger'
import type { FieldSuggestion } from '@/types/enrichment'

function makeSuggestion(
  overrides: Partial<FieldSuggestion> = {},
): FieldSuggestion {
  return {
    field: 'artist',
    value: 'Test Artist',
    source: 'filename',
    confidence: 50,
    status: 'pending',
    ...overrides,
  }
}

describe('mergeSuggestions', () => {
  it('behaelt einzelnen Vorschlag fuer ein Feld', () => {
    const suggestions = [makeSuggestion({ field: 'artist', confidence: 80 })]
    const result = mergeSuggestions(suggestions, new Set(['artist']))

    expect(result).toHaveLength(1)
    expect(result[0].field).toBe('artist')
    expect(result[0].confidence).toBe(80)
  })

  it('waehlt hoechste Konfidenz bei mehreren Quellen pro Feld', () => {
    const suggestions = [
      makeSuggestion({
        field: 'artist',
        value: 'From Filename',
        source: 'filename',
        confidence: 50,
      }),
      makeSuggestion({
        field: 'artist',
        value: 'From MusicBrainz',
        source: 'musicbrainz',
        confidence: 80,
      }),
      makeSuggestion({
        field: 'artist',
        value: 'From Discogs',
        source: 'discogs',
        confidence: 70,
      }),
    ]
    const result = mergeSuggestions(suggestions, new Set(['artist']))

    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('From MusicBrainz')
    expect(result[0].confidence).toBe(80)
  })

  it('filtert Vorschlaege unter MIN_SUGGESTION_CONFIDENCE', () => {
    const suggestions = [
      makeSuggestion({ field: 'artist', confidence: 30 }),
      makeSuggestion({ field: 'title', value: 'Test', confidence: 10 }),
    ]
    const result = mergeSuggestions(
      suggestions,
      new Set(['artist', 'title']),
    )

    expect(result).toHaveLength(0)
  })

  it('filtert Vorschlaege fuer nicht-fehlende Felder', () => {
    const suggestions = [
      makeSuggestion({ field: 'artist', confidence: 80 }),
      makeSuggestion({ field: 'title', value: 'Test', confidence: 80 }),
    ]
    // Nur artist fehlt, title nicht
    const result = mergeSuggestions(suggestions, new Set(['artist']))

    expect(result).toHaveLength(1)
    expect(result[0].field).toBe('artist')
  })

  it('gibt leeres Array bei leerer Eingabe', () => {
    const result = mergeSuggestions([], new Set(['artist', 'title']))
    expect(result).toHaveLength(0)
  })

  it('gibt leeres Array wenn keine Felder fehlen', () => {
    const suggestions = [
      makeSuggestion({ field: 'artist', confidence: 80 }),
    ]
    const result = mergeSuggestions(suggestions, new Set())
    expect(result).toHaveLength(0)
  })

  it('mergt verschiedene Felder aus verschiedenen Quellen', () => {
    const suggestions = [
      makeSuggestion({
        field: 'artist',
        value: 'Artist Name',
        source: 'musicbrainz',
        confidence: 80,
      }),
      makeSuggestion({
        field: 'title',
        value: 'Track Title',
        source: 'filename',
        confidence: 50,
      }),
      makeSuggestion({
        field: 'album',
        value: 'Album Name',
        source: 'discogs',
        confidence: 70,
      }),
      makeSuggestion({
        field: 'genre',
        value: 'Techno',
        source: 'discogs',
        confidence: 70,
      }),
    ]
    const result = mergeSuggestions(
      suggestions,
      new Set(['artist', 'title', 'album', 'genre']),
    )

    expect(result).toHaveLength(4)
    const fields = result.map((s) => s.field)
    expect(fields).toContain('artist')
    expect(fields).toContain('title')
    expect(fields).toContain('album')
    expect(fields).toContain('genre')
  })

  it('behaelt nur den besten Vorschlag pro Feld bei Gleichstand', () => {
    const suggestions = [
      makeSuggestion({
        field: 'artist',
        value: 'First',
        source: 'filename',
        confidence: 70,
      }),
      makeSuggestion({
        field: 'artist',
        value: 'Second',
        source: 'discogs',
        confidence: 70,
      }),
    ]
    const result = mergeSuggestions(suggestions, new Set(['artist']))

    expect(result).toHaveLength(1)
    // Bei gleicher Konfidenz bleibt der erste (kein Override)
    expect(result[0].value).toBe('First')
  })

  it('behaelt Grenzwert-Konfidenz (genau MIN_SUGGESTION_CONFIDENCE)', () => {
    const suggestions = [
      makeSuggestion({ field: 'artist', confidence: 40 }),
    ]
    const result = mergeSuggestions(suggestions, new Set(['artist']))

    expect(result).toHaveLength(1)
  })

  it('filtert knapp unter Grenzwert', () => {
    const suggestions = [
      makeSuggestion({ field: 'artist', confidence: 39 }),
    ]
    const result = mergeSuggestions(suggestions, new Set(['artist']))

    expect(result).toHaveLength(0)
  })
})

describe('getMissingFields', () => {
  const fullTrack = {
    title: 'Around The World',
    artist: 'Daft Punk',
    album: 'Homework',
    genre: 'Electronic',
    year: 1997,
    label: 'Virgin',
    composer: 'Thomas Bangalter',
  }

  it('gibt nur isrc und coverUrl fuer vollstaendigen Track', () => {
    const missing = getMissingFields(fullTrack)

    expect(missing.has('title')).toBe(false)
    expect(missing.has('artist')).toBe(false)
    expect(missing.has('album')).toBe(false)
    expect(missing.has('genre')).toBe(false)
    expect(missing.has('year')).toBe(false)
    expect(missing.has('label')).toBe(false)
    expect(missing.has('composer')).toBe(false)
    // isrc und coverUrl sind immer "missing"
    expect(missing.has('isrc')).toBe(true)
    expect(missing.has('coverUrl')).toBe(true)
  })

  it('erkennt leeren Title als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, title: '' })
    expect(missing.has('title')).toBe(true)
  })

  it('erkennt Whitespace-Only Title als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, title: '   ' })
    expect(missing.has('title')).toBe(true)
  })

  it('erkennt leeren Artist als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, artist: '' })
    expect(missing.has('artist')).toBe(true)
  })

  it('erkennt leeres Album als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, album: '' })
    expect(missing.has('album')).toBe(true)
  })

  it('erkennt leeres Genre als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, genre: '' })
    expect(missing.has('genre')).toBe(true)
  })

  it('erkennt null Year als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, year: null })
    expect(missing.has('year')).toBe(true)
  })

  it('erkennt Year < 1900 als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, year: 0 })
    expect(missing.has('year')).toBe(true)
  })

  it('akzeptiert Year >= 1900', () => {
    const missing = getMissingFields({ ...fullTrack, year: 1900 })
    expect(missing.has('year')).toBe(false)
  })

  it('erkennt leeres Label als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, label: '' })
    expect(missing.has('label')).toBe(true)
  })

  it('erkennt leeren Composer als fehlend', () => {
    const missing = getMissingFields({ ...fullTrack, composer: '' })
    expect(missing.has('composer')).toBe(true)
  })

  it('erkennt komplett leeren Track', () => {
    const emptyTrack = {
      title: '',
      artist: '',
      album: '',
      genre: '',
      year: null,
      label: '',
      composer: '',
    }
    const missing = getMissingFields(emptyTrack)

    expect(missing.has('title')).toBe(true)
    expect(missing.has('artist')).toBe(true)
    expect(missing.has('album')).toBe(true)
    expect(missing.has('genre')).toBe(true)
    expect(missing.has('year')).toBe(true)
    expect(missing.has('label')).toBe(true)
    expect(missing.has('composer')).toBe(true)
    expect(missing.has('isrc')).toBe(true)
    expect(missing.has('coverUrl')).toBe(true)
    expect(missing.size).toBe(9)
  })
})
