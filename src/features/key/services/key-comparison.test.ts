import { describe, it, expect } from 'vitest'
import type { Track } from '@/types/track'
import type { RawKeyResult } from '@/types/audio'
import { compareKey, checkKeyLibrary } from './key-comparison'

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    source: 'rekordbox',
    sourceId: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: '', genre: '', composer: '', label: '', comment: '',
    year: null, rating: 0, duration: 180, bpm: 128, key: 'Am',
    bitrate: 320, sampleRate: 44100, fileSize: null,
    fileType: 'mp3', filePath: '/test.mp3', fileName: 'test.mp3',
    tempoMarkers: [{ position: 0, bpm: 128, meter: '4/4', beat: 1 }],
    cuePoints: [], dateAdded: null,
    ...overrides,
  }
}

function makeRawKey(overrides: Partial<RawKeyResult> = {}): RawKeyResult {
  return {
    trackId: 'track-1',
    detectedKey: 'Am',
    scale: 'minor',
    confidence: 0.8,
    camelot: '8A',
    openKey: '1m',
    ...overrides,
  }
}

describe('compareKey', () => {
  it('should return match when keys are identical', () => {
    const result = compareKey(makeTrack({ key: 'Am' }), makeRawKey({ detectedKey: 'Am' }))
    expect(result.match).toBe('match')
    expect(result.overallSeverity).toBe('ok')
  })

  it('should return relative match for Am detected vs C library', () => {
    const result = compareKey(makeTrack({ key: 'C' }), makeRawKey({ detectedKey: 'Am' }))
    expect(result.match).toBe('relative')
    expect(result.overallSeverity).toBe('warning')
  })

  it('should return mismatch for different keys', () => {
    const result = compareKey(makeTrack({ key: 'Dm' }), makeRawKey({ detectedKey: 'Am' }))
    expect(result.match).toBe('mismatch')
    expect(result.overallSeverity).toBe('error')
  })

  it('should return no-library-key when track has no key', () => {
    const result = compareKey(makeTrack({ key: null }), makeRawKey())
    expect(result.match).toBe('no-library-key')
    expect(result.overallSeverity).toBe('warning')
  })

  it('should return skipReason no-pcm when no raw result', () => {
    const result = compareKey(makeTrack(), null)
    expect(result.skipReason).toBe('no-pcm')
    expect(result.match).toBe('no-detection')
  })

  it('should normalize enharmonic equivalents (Db -> C#)', () => {
    const result = compareKey(
      makeTrack({ key: 'Db' }),
      makeRawKey({ detectedKey: 'C#', scale: 'major' }),
    )
    expect(result.match).toBe('match')
  })
})

describe('checkKeyLibrary', () => {
  it('should aggregate library stats correctly', () => {
    const tracks = [
      makeTrack({ id: 't1', key: 'Am' }),
      makeTrack({ id: 't2', key: 'C' }),
      makeTrack({ id: 't3', key: null }),
    ]
    const rawKeys = new Map<string, RawKeyResult>([
      ['t1', makeRawKey({ trackId: 't1', detectedKey: 'Am' })],
      ['t2', makeRawKey({ trackId: 't2', detectedKey: 'Am' })],     // relative
      ['t3', makeRawKey({ trackId: 't3', detectedKey: 'F#m' })],    // no library key
    ])

    const result = checkKeyLibrary(tracks, rawKeys)
    expect(result.type).toBe('key')
    expect(result.libraryStats.tracksMatched).toBe(1)
    expect(result.libraryStats.tracksRelativeKey).toBe(1)
    expect(result.libraryStats.tracksNoLibraryKey).toBe(1)
    expect(result.libraryStats.totalTracks).toBe(3)
  })

  it('should handle empty tracks', () => {
    const result = checkKeyLibrary([], new Map())
    expect(result.tracks).toHaveLength(0)
    expect(result.libraryStats.totalTracks).toBe(0)
  })
})
