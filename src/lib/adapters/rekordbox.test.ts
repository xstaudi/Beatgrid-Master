import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { RekordboxAdapter } from './rekordbox'

const fixtureXml = readFileSync(
  resolve(__dirname, '../../test/fixtures/rekordbox-sample.xml'),
  'utf-8'
)

describe('RekordboxAdapter', () => {
  const adapter = new RekordboxAdapter()

  it('parses all tracks from fixture', () => {
    const result = adapter.parse(fixtureXml)
    expect(result.tracks).toHaveLength(4)
    expect(result.source).toBe('rekordbox')
    expect(result.version).toBe('6.7.4')
    expect(result.totalTracks).toBe(4)
  })

  it('parses full track metadata correctly', () => {
    const result = adapter.parse(fixtureXml)
    const track = result.tracks[0]

    expect(track.id).toBe('rb-1')
    expect(track.source).toBe('rekordbox')
    expect(track.sourceId).toBe('1')
    expect(track.title).toBe('Deep House Vibes')
    expect(track.artist).toBe('DJ Producer')
    expect(track.album).toBe('Summer Collection')
    expect(track.genre).toBe('Deep House')
    expect(track.composer).toBe('Producer')
    expect(track.label).toBe('House Records')
    expect(track.comment).toBe('Great track')
    expect(track.year).toBe(2023)
    expect(track.duration).toBe(225)
    expect(track.bpm).toBe(124)
    expect(track.key).toBe('Am')
    expect(track.bitrate).toBe(320)
    expect(track.sampleRate).toBe(44100)
    expect(track.fileSize).toBe(9012345)
    expect(track.fileType).toBe('MP3')
    expect(track.dateAdded).toBe('2023-06-15')
  })

  it('normalizes rating from 0-255 to 0-5', () => {
    const result = adapter.parse(fixtureXml)
    expect(result.tracks[0].rating).toBe(5) // 255 -> 5
    expect(result.tracks[2].rating).toBe(3) // 153 -> 3
    expect(result.tracks[3].rating).toBe(1) // 51 -> 1
  })

  it('handles missing fields with defaults', () => {
    const result = adapter.parse(fixtureXml)
    const track = result.tracks[1] // Track without genre, key, year, etc.

    expect(track.genre).toBe('')
    expect(track.key).toBeNull()
    expect(track.year).toBeNull()
    expect(track.album).toBe('')
    expect(track.rating).toBe(0) // No Rating attribute
  })

  it('decodes URL-encoded paths', () => {
    const result = adapter.parse(fixtureXml)
    const track = result.tracks[2] // URL-encoded path

    expect(track.filePath).toBe('/Users/dj/Music/München Sessions/träume der nacht.mp3')
    expect(track.fileName).toBe('träume der nacht.mp3')
  })

  it('parses TEMPO markers', () => {
    const result = adapter.parse(fixtureXml)
    const track = result.tracks[0]

    expect(track.tempoMarkers).toHaveLength(2)
    expect(track.tempoMarkers[0]).toEqual({
      position: 0.123,
      bpm: 124,
      meter: '4/4',
      beat: 1,
    })
    expect(track.tempoMarkers[1].bpm).toBe(124.02)
  })

  it('parses POSITION_MARK cue points', () => {
    const result = adapter.parse(fixtureXml)
    const track = result.tracks[0]

    expect(track.cuePoints).toHaveLength(3)
    expect(track.cuePoints[0]).toEqual({
      name: 'Drop',
      type: 'cue',
      start: 64.234,
      hotcue: 0,
      color: { r: 40, g: 226, b: 20 },
    })
    expect(track.cuePoints[2]).toEqual({
      name: 'Loop 1',
      type: 'loop',
      start: 32,
      end: 48,
      hotcue: 2,
    })
  })

  it('throws on invalid XML', () => {
    expect(() => adapter.parse('<not valid xml<<<')).toThrow('Invalid XML')
  })
})
