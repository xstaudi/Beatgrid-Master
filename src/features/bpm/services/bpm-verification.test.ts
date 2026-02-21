import { describe, it, expect } from 'vitest'
import { verifyBpm, verifyBpmLibrary, applyHalfDoubleGuard, computeVariance } from './bpm-verification'
import type { Track } from '@/types/track'
import type { RawBeatResult } from '@/types/audio'

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    source: 'rekordbox',
    sourceId: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    duration: 180,
    bpm: 128,
    key: null,
    bitrate: 320,
    sampleRate: 44100,
    fileSize: null,
    fileType: 'mp3',
    filePath: '/test.mp3',
    fileName: 'test.mp3',
    tempoMarkers: [{ position: 0, bpm: 128, meter: '4/4', beat: 1 }],
    cuePoints: [],
    dateAdded: null,
    ...overrides,
  }
}

function makeRawBeat(overrides: Partial<RawBeatResult> = {}): RawBeatResult {
  return {
    trackId: 'track-1',
    beatTimestamps: [0, 0.46875, 0.9375], // Some beats
    bpmEstimate: 128,
    segmentBpms: [128, 128, 128, 128],
    avgConfidence: 0.9,
    sampleRate: 22050,
    duration: 180,
    ...overrides,
  }
}

describe('verifyBpm', () => {
  it('stored=128, detected=128 → ok (kein Delta)', () => {
    const track = makeTrack({ bpm: 128 })
    const raw = makeRawBeat() // segmentBpms=[128,128,128,128] → median=128
    const result = verifyBpm(track, raw)

    expect(result.overallSeverity).toBe('ok')
    expect(result.bpmDelta).toBeCloseTo(0)
    expect(result.halfDoubleAdjusted).toBe(false)
  })

  it('stored=128, detected=127.0 → warning (delta=1 ≤ 2.0 BPM)', () => {
    const track = makeTrack({ bpm: 128 })
    // segmentBpms geben median=127 → delta=-1 → warning
    const raw = makeRawBeat({ segmentBpms: [127, 127, 127, 127] })
    const result = verifyBpm(track, raw)

    expect(result.overallSeverity).toBe('warning')
    expect(result.bpmDelta).toBeCloseTo(-1)
  })

  it('stored=128, detected≈127.5 → warning (delta<1)', () => {
    const track = makeTrack({ bpm: 128 })
    // segmentBpms median=127 → delta=-1 → warning
    const raw = makeRawBeat({ segmentBpms: [127, 127, 127, 128] })
    const result = verifyBpm(track, raw)

    expect(result.overallSeverity).toBe('warning')
  })

  it('stored=128, detected=125 → error (delta=3 > 2.0 BPM)', () => {
    const track = makeTrack({ bpm: 128 })
    const raw = makeRawBeat({ segmentBpms: [125, 125, 125, 125] })
    const result = verifyBpm(track, raw)

    expect(result.overallSeverity).toBe('error')
    expect(result.bpmDelta).toBeCloseTo(-3)
  })

  it('half-tempo guard: stored=128, detected=64 → adjusted=128', () => {
    const track = makeTrack({ bpm: 128 })
    // segmentBpms auf 64 setzen → median=64, applyHalfDoubleGuard wählt 128
    const raw = makeRawBeat({ bpmEstimate: 64, segmentBpms: [64, 64, 64, 64] })
    const result = verifyBpm(track, raw)

    expect(result.detectedBpm).toBe(128)
    expect(result.halfDoubleAdjusted).toBe(true)
    expect(result.overallSeverity).toBe('ok')
  })

  it('double-tempo guard: stored=128, detected=256 → adjusted=128', () => {
    const track = makeTrack({ bpm: 128 })
    // segmentBpms auf 256 setzen → median=256, applyHalfDoubleGuard wählt 128
    const raw = makeRawBeat({ bpmEstimate: 256, segmentBpms: [256, 256, 256, 256] })
    const result = verifyBpm(track, raw)

    expect(result.detectedBpm).toBe(128)
    expect(result.halfDoubleAdjusted).toBe(true)
    expect(result.overallSeverity).toBe('ok')
  })

  it('no stored BPM → warning, detectedBpm gesetzt, kein skipReason', () => {
    const track = makeTrack({ bpm: null })
    const raw = makeRawBeat()
    const result = verifyBpm(track, raw)

    expect(result.skipReason).toBeUndefined()
    expect(result.overallSeverity).toBe('warning')
    expect(result.detectedBpm).toBe(128)
    expect(result.storedBpm).toBeNull()
    expect(result.bpmDelta).toBeNull()
  })

  it('no rawBeat → skipReason no-pcm', () => {
    const track = makeTrack()
    const result = verifyBpm(track, null)

    expect(result.skipReason).toBe('no-pcm')
  })

  it('no beats detected → skipReason no-beats-detected', () => {
    const track = makeTrack()
    const raw = makeRawBeat({ beatTimestamps: [] })
    const result = verifyBpm(track, raw)

    expect(result.skipReason).toBe('no-beats-detected')
  })

  it('variable BPM → variance calculated, error capped to warning', () => {
    const track = makeTrack({ bpm: 128 })
    const raw = makeRawBeat({
      bpmEstimate: 130, // Would be error (delta=2)
      segmentBpms: [125, 128, 135, 128, 122], // High variance
    })
    const result = verifyBpm(track, raw)

    expect(result.isVariableBpm).toBe(true)
    expect(result.bpmVariancePercent).toBeGreaterThan(2)
    // Error gets capped to warning for variable BPM
    expect(result.overallSeverity).not.toBe('error')
  })
})

describe('applyHalfDoubleGuard', () => {
  it('returns unchanged when detected is close to stored', () => {
    const { adjusted, wasAdjusted } = applyHalfDoubleGuard(128, 128)
    expect(adjusted).toBe(128)
    expect(wasAdjusted).toBe(false)
  })

  it('adjusts half-tempo', () => {
    const { adjusted, wasAdjusted } = applyHalfDoubleGuard(64, 128)
    expect(adjusted).toBe(128)
    expect(wasAdjusted).toBe(true)
  })

  it('adjusts double-tempo', () => {
    const { adjusted, wasAdjusted } = applyHalfDoubleGuard(256, 128)
    expect(adjusted).toBe(128)
    expect(wasAdjusted).toBe(true)
  })
})

describe('computeVariance', () => {
  it('returns 0 variance for consistent BPMs', () => {
    const { variancePercent, isVariableBpm } = computeVariance([128, 128, 128, 128])
    expect(variancePercent).toBe(0)
    expect(isVariableBpm).toBe(false)
  })

  it('detects variable BPM with high variance', () => {
    const { variancePercent, isVariableBpm } = computeVariance([120, 128, 136])
    expect(variancePercent).toBeGreaterThan(2)
    expect(isVariableBpm).toBe(true)
  })

  it('returns not variable for < 3 segments', () => {
    const { isVariableBpm } = computeVariance([120, 130])
    expect(isVariableBpm).toBe(false)
  })
})

describe('verifyBpmLibrary', () => {
  it('aggregates library stats correctly', () => {
    const tracks = [
      makeTrack({ id: 't1', bpm: 128 }),
      makeTrack({ id: 't2', bpm: null }),
      makeTrack({ id: 't3', bpm: 140 }),
    ]

    const rawBeats = new Map<string, RawBeatResult>()
    rawBeats.set('t1', makeRawBeat({ trackId: 't1', bpmEstimate: 128 }))
    rawBeats.set('t2', makeRawBeat({ trackId: 't2', bpmEstimate: 125 }))
    rawBeats.set('t3', makeRawBeat({ trackId: 't3', bpmEstimate: 140 }))

    const result = verifyBpmLibrary(tracks, rawBeats)

    expect(result.type).toBe('bpm')
    expect(result.libraryStats.totalTracks).toBe(3)
    expect(result.libraryStats.tracksOk).toBeGreaterThanOrEqual(1)      // t1 ok
    expect(result.libraryStats.tracksWithWarnings).toBeGreaterThanOrEqual(1) // t2 kein stored BPM → warning
    expect(result.libraryStats.tracksSkipped).toBe(0)                   // kein skip mehr
    expect(result.libraryStats.avgDetectedBpm).toBeGreaterThan(0)
  })
})
