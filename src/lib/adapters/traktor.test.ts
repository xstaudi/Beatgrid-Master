import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { TraktorAdapter } from './traktor'

const fixtureNml = readFileSync(
  resolve(__dirname, '../../test/fixtures/traktor-sample.nml'),
  'utf-8'
)

describe('TraktorAdapter', () => {
  const adapter = new TraktorAdapter()

  it('parses all entries from fixture', () => {
    const result = adapter.parse(fixtureNml)
    expect(result.tracks).toHaveLength(4)
    expect(result.source).toBe('traktor')
    expect(result.version).toBe('19')
    expect(result.totalTracks).toBe(4)
  })

  it('parses full entry metadata correctly', () => {
    const result = adapter.parse(fixtureNml)
    const track = result.tracks[0]

    expect(track.id).toBe('tr-abc123')
    expect(track.source).toBe('traktor')
    expect(track.sourceId).toBe('abc123')
    expect(track.title).toBe('Acid Dreams')
    expect(track.artist).toBe('Acid Producer')
    expect(track.album).toBe('Acid Collection')
    expect(track.genre).toBe('Acid House')
    expect(track.label).toBe('Acid Records')
    expect(track.comment).toBe('Classic acid')
    expect(track.year).toBe(2022)
    expect(track.duration).toBe(245.5)
    expect(track.dateAdded).toBe('2022-05-10')
  })

  it('builds file paths from LOCATION element', () => {
    const result = adapter.parse(fixtureNml)
    const track = result.tracks[0]

    expect(track.filePath).toBe('//Users/dj/Music/Acid/acid_dreams.mp3')
    expect(track.fileName).toBe('acid_dreams.mp3')
  })

  it('maps Traktor key values to musical notation', () => {
    const result = adapter.parse(fixtureNml)
    expect(result.tracks[0].key).toBe('Am') // VALUE=21
    expect(result.tracks[2].key).toBe('C') // VALUE=0
  })

  it('rounds BPM to 2 decimal places', () => {
    const result = adapter.parse(fixtureNml)
    expect(result.tracks[0].bpm).toBe(126.12) // 126.123456 -> 126.12
    expect(result.tracks[2].bpm).toBe(128.56) // 128.555555 -> 128.56
  })

  it('converts bitrate from bps to kbps', () => {
    const result = adapter.parse(fixtureNml)
    expect(result.tracks[0].bitrate).toBe(320) // 320000 / 1000
    expect(result.tracks[1].bitrate).toBe(1411) // 1411000 / 1000
  })

  it('handles missing fields with defaults', () => {
    const result = adapter.parse(fixtureNml)
    const track = result.tracks[3] // Minimal entry

    expect(track.bpm).toBeNull()
    expect(track.key).toBeNull()
    expect(track.genre).toBe('')
    expect(track.rating).toBe(0)
    expect(track.bitrate).toBeNull()
  })

  it('parses TempoMarker position from CUE_V2[TYPE=4]', () => {
    const result = adapter.parse(fixtureNml)
    const track = result.tracks[0] // abc123 hat CUE_V2 TYPE=4 START=123.5

    expect(track.tempoMarkers).toHaveLength(1)
    expect(track.tempoMarkers[0].position).toBeCloseTo(0.1235, 4) // 123.5ms → 0.1235s
    expect(track.tempoMarkers[0].bpm).toBe(126.12)
  })

  it('defaults TempoMarker position to 0 when no CUE_V2[TYPE=4]', () => {
    const result = adapter.parse(fixtureNml)
    const track = result.tracks[1] // def456 hat kein CUE_V2

    expect(track.tempoMarkers).toHaveLength(1)
    expect(track.tempoMarkers[0].position).toBe(0)
  })

  it('parses CUE_V2 elements', () => {
    const result = adapter.parse(fixtureNml)
    const track = result.tracks[0]

    expect(track.cuePoints).toHaveLength(4)
    expect(track.cuePoints[0]).toMatchObject({
      name: 'Start',
      type: 'cue',
      start: 0.5, // 500ms -> 0.5s
      hotcue: 0,
    })
    expect(track.cuePoints[2]).toMatchObject({
      name: 'Grid',
      type: 'grid',
      start: 0.1235, // 123.5ms -> 0.1235s
    })
    expect(track.cuePoints[3]).toMatchObject({
      name: 'Loop A',
      type: 'loop',
      start: 32, // 32000ms -> 32s
      end: 48, // 32000 + 16000 = 48000ms -> 48s
    })
  })

  it('throws on invalid XML', () => {
    expect(() => adapter.parse('<broken xml<<<')).toThrow('Invalid XML')
  })
})
