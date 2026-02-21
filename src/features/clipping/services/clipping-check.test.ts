import { describe, it, expect } from 'vitest'
import type { Track } from '@/types/track'
import type { RawClipResult } from '@/types/audio'
import { checkClipping, checkClippingLibrary } from './clipping-check'

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    source: 'rekordbox',
    sourceId: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: '', genre: '', composer: '', label: '', comment: '',
    year: null, rating: 0, duration: 180, bpm: 128, key: null,
    bitrate: 320, sampleRate: 44100, fileSize: null,
    fileType: 'mp3', filePath: '/test.mp3', fileName: 'test.mp3',
    tempoMarkers: [{ position: 0, bpm: 128, meter: '4/4', beat: 1 }],
    cuePoints: [], dateAdded: null,
    ...overrides,
  }
}

function makeRawClip(overrides: Partial<RawClipResult> = {}): RawClipResult {
  return {
    trackId: 'track-1',
    hasClipping: false,
    clipCount: 0,
    totalClippedSamples: 0,
    peakLevelLinear: 0.5,
    peakLevelDb: -6,
    regions: [],
    ...overrides,
  }
}

describe('checkClipping', () => {
  it('should return ok for clean track', () => {
    const result = checkClipping(makeTrack(), makeRawClip())
    expect(result.overallSeverity).toBe('ok')
    expect(result.hasClipping).toBe(false)
  })

  it('should return warning for minor clipping', () => {
    const result = checkClipping(makeTrack(), makeRawClip({
      hasClipping: true,
      clipCount: 2,
      regions: [
        { startTime: 10, endTime: 10.01, duration: 0.01 },
        { startTime: 30, endTime: 30.02, duration: 0.02 },
      ],
    }))
    expect(result.overallSeverity).toBe('warning')
  })

  it('should return error for significant clipping (many regions)', () => {
    const regions = Array.from({ length: 10 }, (_, i) => ({
      startTime: i * 10,
      endTime: i * 10 + 0.01,
      duration: 0.01,
    }))
    const result = checkClipping(makeTrack(), makeRawClip({
      hasClipping: true,
      clipCount: 10,
      regions,
    }))
    expect(result.overallSeverity).toBe('error')
  })

  it('should return error for long clipping duration', () => {
    const result = checkClipping(makeTrack(), makeRawClip({
      hasClipping: true,
      clipCount: 1,
      regions: [{ startTime: 10, endTime: 10.5, duration: 0.5 }],
    }))
    expect(result.overallSeverity).toBe('error')
  })

  it('should return skipReason when no raw result', () => {
    const result = checkClipping(makeTrack(), null)
    expect(result.skipReason).toBe('no-pcm')
    expect(result.overallSeverity).toBe('ok')
  })
})

describe('checkClippingLibrary', () => {
  it('should aggregate stats correctly', () => {
    const tracks = [
      makeTrack({ id: 't1' }),
      makeTrack({ id: 't2' }),
    ]
    const rawClips = new Map<string, RawClipResult>([
      ['t1', makeRawClip({ trackId: 't1', peakLevelDb: -3 })],
      ['t2', makeRawClip({
        trackId: 't2',
        hasClipping: true,
        clipCount: 10,
        peakLevelDb: -0.5,
        regions: Array.from({ length: 10 }, (_, i) => ({
          startTime: i, endTime: i + 0.01, duration: 0.01,
        })),
      })],
    ])

    const result = checkClippingLibrary(tracks, rawClips)
    expect(result.type).toBe('clipping')
    expect(result.libraryStats.tracksClean).toBe(1)
    expect(result.libraryStats.tracksWithClipping).toBe(1)
    expect(result.libraryStats.avgPeakLevelDb).toBeCloseTo(-1.75)
  })

  it('should handle empty tracks', () => {
    const result = checkClippingLibrary([], new Map())
    expect(result.tracks).toHaveLength(0)
    expect(result.libraryStats.totalTracks).toBe(0)
  })
})
