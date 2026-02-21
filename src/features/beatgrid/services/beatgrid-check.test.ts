import { describe, it, expect } from 'vitest'
import { checkBeatgrid, checkBeatgridLibrary } from './beatgrid-check'
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
  // Generate perfect 128 BPM beats for 180 seconds
  const interval = 60 / 128
  const beats: number[] = []
  for (let t = 0; t < 180; t += interval) {
    beats.push(t)
  }

  return {
    trackId: 'track-1',
    beatTimestamps: beats,
    bpmEstimate: 128,
    segmentBpms: [128, 128, 128, 128, 128, 128],
    avgConfidence: 0.9,
    sampleRate: 22050,
    duration: 180,
    ...overrides,
  }
}

describe('checkBeatgrid', () => {
  it('perfect grid → all ok, high confidence', () => {
    const track = makeTrack()
    const raw = makeRawBeat()
    const result = checkBeatgrid(track, raw)

    expect(result.overallSeverity).toBe('ok')
    expect(result.confidence).toBeCloseTo(90)
    expect(result.avgDriftMs).toBeLessThan(1)
    expect(result.beatsAnalyzed).toBeGreaterThan(0)
    expect(result.beatsMatched).toBeGreaterThan(0)
    expect(result.isVariableBpm).toBe(false)
    expect(result.skipReason).toBeUndefined()
  })

  it('5ms drift → ok severity', () => {
    const track = makeTrack()
    const interval = 60 / 128
    const beats: number[] = []
    for (let t = 0; t < 180; t += interval) {
      beats.push(t + 0.005) // 5ms drift
    }
    const raw = makeRawBeat({ beatTimestamps: beats })
    const result = checkBeatgrid(track, raw)

    expect(result.overallSeverity).toBe('ok')
    expect(result.avgDriftMs).toBeLessThanOrEqual(10)
  })

  it('15ms drift → warning severity', () => {
    const track = makeTrack()
    const interval = 60 / 128
    const beats: number[] = []
    for (let t = 0; t < 180; t += interval) {
      beats.push(t + 0.015) // 15ms drift
    }
    const raw = makeRawBeat({ beatTimestamps: beats })
    const result = checkBeatgrid(track, raw)

    expect(result.overallSeverity).toBe('warning')
  })

  it('35ms drift → error severity', () => {
    const track = makeTrack()
    const interval = 60 / 128
    const beats: number[] = []
    for (let t = 0; t < 180; t += interval) {
      beats.push(t + 0.035) // 35ms drift
    }
    const raw = makeRawBeat({ beatTimestamps: beats })
    const result = checkBeatgrid(track, raw)

    expect(result.overallSeverity).toBe('error')
  })

  it('empty tempoMarkers → skipReason no-grid', () => {
    const track = makeTrack({ tempoMarkers: [] })
    const raw = makeRawBeat()
    const result = checkBeatgrid(track, raw)

    expect(result.skipReason).toBe('no-grid')
    expect(result.overallSeverity).toBe('warning')
  })

  it('null rawBeat → skipReason no-pcm', () => {
    const track = makeTrack()
    const result = checkBeatgrid(track, null)

    expect(result.skipReason).toBe('no-pcm')
  })

  it('empty beatTimestamps → skipReason no-beats-detected', () => {
    const track = makeTrack()
    const raw = makeRawBeat({ beatTimestamps: [] })
    const result = checkBeatgrid(track, raw)

    expect(result.skipReason).toBe('no-beats-detected')
  })

  it('variable BPM → isVariableBpm + error capped to warning', () => {
    const track = makeTrack({
      tempoMarkers: [
        { position: 0, bpm: 120, meter: '4/4', beat: 1 },
        { position: 60, bpm: 140, meter: '4/4', beat: 1 },
      ],
    })
    // Beats that would cause error drift against single-tempo grid
    const interval = 60 / 128
    const beats: number[] = []
    for (let t = 0; t < 180; t += interval) {
      beats.push(t + 0.05) // 50ms drift
    }
    const raw = makeRawBeat({ beatTimestamps: beats })
    const result = checkBeatgrid(track, raw)

    expect(result.isVariableBpm).toBe(true)
    expect(result.overallSeverity).not.toBe('error') // capped to warning
  })

  it('few outlier beats do not ruin overall ok severity', () => {
    const track = makeTrack()
    const interval = 60 / 128
    const beats: number[] = []
    for (let i = 0; i < 384; i++) {
      const t = i * interval
      // 3 outliers with 50ms drift out of 384 beats
      const drift = i === 10 || i === 200 || i === 350 ? 0.05 : 0.003
      beats.push(t + drift)
    }
    const raw = makeRawBeat({ beatTimestamps: beats, duration: 180 })
    const result = checkBeatgrid(track, raw)

    expect(result.overallSeverity).toBe('ok')
  })

  it('many error beats escalate to error even if median is ok', () => {
    const track = makeTrack()
    const interval = 60 / 128
    const beats: number[] = []
    for (let i = 0; i < 100; i++) {
      const t = i * interval
      // 40% of beats have 50ms drift → > 30% threshold
      const drift = i % 5 < 2 ? 0.05 : 0.003
      beats.push(t + drift)
    }
    const raw = makeRawBeat({ beatTimestamps: beats, duration: 50 })
    const result = checkBeatgrid(track, raw)

    expect(result.overallSeverity).toBe('error')
  })

  it('multiple tempoMarkers → piecewise grid', () => {
    const track = makeTrack({
      tempoMarkers: [
        { position: 0, bpm: 120, meter: '4/4', beat: 1 },
        { position: 60, bpm: 130, meter: '4/4', beat: 1 },
      ],
    })

    // Build matching beats for the piecewise grid
    const beats: number[] = []
    // First 60s at 120 BPM
    const interval1 = 60 / 120
    for (let t = 0; t < 60; t += interval1) beats.push(t)
    // Next at 130 BPM
    const interval2 = 60 / 130
    for (let t = 60; t < 180; t += interval2) beats.push(t)

    const raw = makeRawBeat({ beatTimestamps: beats, duration: 180 })
    const result = checkBeatgrid(track, raw)

    expect(result.beatsMatched).toBeGreaterThan(0)
    expect(result.avgDriftMs).toBeLessThan(5)
  })
})

describe('checkBeatgridLibrary', () => {
  it('aggregates library stats correctly', () => {
    const tracks = [
      makeTrack({ id: 't1' }),
      makeTrack({ id: 't2', tempoMarkers: [] }),
      makeTrack({ id: 't3' }),
    ]

    const rawBeats = new Map<string, RawBeatResult>()
    rawBeats.set('t1', makeRawBeat({ trackId: 't1' }))
    // t2 has no raw beat (skipped)
    rawBeats.set('t3', makeRawBeat({ trackId: 't3' }))

    const result = checkBeatgridLibrary(tracks, rawBeats)

    expect(result.type).toBe('beatgrid')
    expect(result.libraryStats.totalTracks).toBe(3)
    expect(result.libraryStats.tracksOk).toBeGreaterThanOrEqual(1)
    expect(result.libraryStats.tracksSkipped).toBeGreaterThanOrEqual(1) // t2 has no-grid
    expect(result.libraryStats.avgConfidence).toBeGreaterThan(0)
  })
})
