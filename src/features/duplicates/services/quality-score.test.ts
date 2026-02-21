import { describe, it, expect } from 'vitest'
import { computeQualityScore } from './quality-score'
import type { Track } from '@/types/track'

function makeTrack(overrides: Partial<Track>): Track {
  return {
    id: 'test',
    source: 'rekordbox',
    sourceId: 'test',
    title: 'Test',
    artist: 'Artist',
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    duration: 300,
    bpm: null,
    key: null,
    bitrate: 320,
    sampleRate: 44100,
    fileSize: 12_000_000,
    fileType: 'mp3',
    filePath: '/test.mp3',
    fileName: 'test.mp3',
    tempoMarkers: [],
    cuePoints: [],
    dateAdded: null,
    ...overrides,
  }
}

describe('computeQualityScore', () => {
  it('scores FLAC higher than MP3 at same bitrate', () => {
    const flac = makeTrack({ fileType: 'flac', bitrate: 320 })
    const mp3 = makeTrack({ fileType: 'mp3', bitrate: 320 })

    expect(computeQualityScore(flac)).toBeGreaterThan(computeQualityScore(mp3))
  })

  it('scores 320kbps higher than 128kbps', () => {
    const high = makeTrack({ bitrate: 320 })
    const low = makeTrack({ bitrate: 128 })

    expect(computeQualityScore(high)).toBeGreaterThan(computeQualityScore(low))
  })

  it('returns a score between 0 and 100', () => {
    const track = makeTrack({})
    const score = computeQualityScore(track)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('handles null bitrate', () => {
    const track = makeTrack({ bitrate: null })
    const score = computeQualityScore(track)
    expect(score).toBeGreaterThan(0)
  })

  it('handles null fileSize', () => {
    const track = makeTrack({ fileSize: null })
    const score = computeQualityScore(track)
    expect(score).toBeGreaterThan(0)
  })

  it('scores WAV equal to FLAC', () => {
    const wav = makeTrack({ fileType: 'wav', bitrate: 1411 })
    const flac = makeTrack({ fileType: 'flac', bitrate: 1411 })

    // Same format tier, same bitrate → similar scores
    const wavScore = computeQualityScore(wav)
    const flacScore = computeQualityScore(flac)
    expect(Math.abs(wavScore - flacScore)).toBeLessThan(5)
  })
})
