import { describe, it, expect } from 'vitest'
import { parseFilename, suggestFromFilename } from './filename-parser'

describe('parseFilename', () => {
  it('parst Standard "Artist - Title.mp3"', () => {
    const result = parseFilename('Daft Punk - Around The World.mp3')
    expect(result.artist).toBe('Daft Punk')
    expect(result.title).toBe('Around The World')
  })

  it('parst mit Track-Nummer "01 Artist - Title.mp3"', () => {
    const result = parseFilename('01 Daft Punk - Around The World.mp3')
    expect(result.artist).toBe('Daft Punk')
    expect(result.title).toBe('Around The World')
  })

  it('parst mit Punkt-Track-Nummer "01. Artist - Title.mp3"', () => {
    const result = parseFilename('01. Daft Punk - Around The World.mp3')
    expect(result.artist).toBe('Daft Punk')
    expect(result.title).toBe('Around The World')
  })

  it('parst dreistellige Track-Nummer "123 Artist - Title.mp3"', () => {
    const result = parseFilename('123 Artist - Title.mp3')
    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('parst Underscores "Artist_-_Title.mp3"', () => {
    const result = parseFilename('Daft_Punk_-_Around_The_World.mp3')
    expect(result.artist).toBe('Daft Punk')
    expect(result.title).toBe('Around The World')
  })

  it('parst En-Dash "Artist – Title.mp3"', () => {
    const result = parseFilename('Daft Punk – Around The World.mp3')
    expect(result.artist).toBe('Daft Punk')
    expect(result.title).toBe('Around The World')
  })

  it('behaelt Remix-Info im Titel "Artist - Title (Club Mix).mp3"', () => {
    const result = parseFilename('Daft Punk - Around The World (Club Mix).mp3')
    expect(result.artist).toBe('Daft Punk')
    expect(result.title).toBe('Around The World (Club Mix)')
  })

  it('parst Remix mit Track-Nummer', () => {
    const result = parseFilename('03 Tiesto - Adagio For Strings (Remix).flac')
    expect(result.artist).toBe('Tiesto')
    expect(result.title).toBe('Adagio For Strings (Remix)')
  })

  it('gibt nur Title zurueck wenn kein Separator vorhanden', () => {
    const result = parseFilename('SomeTrackWithoutSeparator.mp3')
    expect(result.artist).toBeNull()
    expect(result.title).toBe('SomeTrackWithoutSeparator')
  })

  it('behandelt .flac Extension', () => {
    const result = parseFilename('Artist - Title.flac')
    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('behandelt .m4a Extension', () => {
    const result = parseFilename('Artist - Title.m4a')
    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('behandelt .wav Extension', () => {
    const result = parseFilename('Artist - Title.wav')
    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('behandelt .aiff Extension', () => {
    const result = parseFilename('Artist - Title.aiff')
    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('behandelt leeren String', () => {
    const result = parseFilename('')
    expect(result.artist).toBeNull()
    expect(result.title).toBeNull()
  })

  it('behandelt nur Extension ".mp3"', () => {
    const result = parseFilename('.mp3')
    expect(result.artist).toBeNull()
    expect(result.title).toBeNull()
  })

  it('behandelt Dateiname ohne Extension', () => {
    const result = parseFilename('Artist - Title')
    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('behandelt mehrere Bindestriche im Titel', () => {
    const result = parseFilename('DJ Snake - Turn Down for What - Original.mp3')
    expect(result.artist).toBe('DJ Snake')
    expect(result.title).toBe('Turn Down for What - Original')
  })

  it('entfernt fuehrende und abschliessende Leerzeichen', () => {
    const result = parseFilename('  Artist  -  Title  .mp3')
    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('kollabiert mehrfache Leerzeichen', () => {
    const result = parseFilename('Some   Artist  -  Some   Title.mp3')
    expect(result.artist).toBe('Some Artist')
    expect(result.title).toBe('Some Title')
  })
})

describe('suggestFromFilename', () => {
  it('schlaegt Artist und Title vor wenn beide fehlen', () => {
    const suggestions = suggestFromFilename(
      'Daft Punk - Around The World.mp3',
      new Set(['artist', 'title']),
    )
    expect(suggestions).toHaveLength(2)
    expect(suggestions[0]).toMatchObject({
      field: 'artist',
      value: 'Daft Punk',
      source: 'filename',
      confidence: 50,
      status: 'pending',
    })
    expect(suggestions[1]).toMatchObject({
      field: 'title',
      value: 'Around The World',
      source: 'filename',
      confidence: 50,
      status: 'pending',
    })
  })

  it('schlaegt nur Artist vor wenn nur Artist fehlt', () => {
    const suggestions = suggestFromFilename(
      'Daft Punk - Around The World.mp3',
      new Set(['artist']),
    )
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].field).toBe('artist')
  })

  it('schlaegt nur Title vor wenn nur Title fehlt', () => {
    const suggestions = suggestFromFilename(
      'Daft Punk - Around The World.mp3',
      new Set(['title']),
    )
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].field).toBe('title')
  })

  it('gibt leeres Array wenn keine Felder fehlen', () => {
    const suggestions = suggestFromFilename(
      'Daft Punk - Around The World.mp3',
      new Set(),
    )
    expect(suggestions).toHaveLength(0)
  })

  it('gibt leeres Array wenn Felder fehlen aber nicht parsbar', () => {
    const suggestions = suggestFromFilename(
      '.mp3',
      new Set(['artist', 'title']),
    )
    expect(suggestions).toHaveLength(0)
  })

  it('schlaegt nur Title vor bei Datei ohne Separator', () => {
    const suggestions = suggestFromFilename(
      'SomeTrack.mp3',
      new Set(['artist', 'title']),
    )
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].field).toBe('title')
    expect(suggestions[0].value).toBe('SomeTrack')
  })

  it('ignoriert nicht-relevante fehlende Felder', () => {
    const suggestions = suggestFromFilename(
      'Artist - Title.mp3',
      new Set(['album', 'genre', 'year']),
    )
    expect(suggestions).toHaveLength(0)
  })
})
