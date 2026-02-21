import { describe, it, expect } from 'vitest'
import { generateBeatgrid } from './beatgrid-generation'
import type { RawBeatResult } from '@/types/audio'
import type { TempoMarker } from '@/types/track'

function makeRawBeat(overrides: Partial<RawBeatResult> = {}): RawBeatResult {
  return {
    trackId: 'test-1',
    beatTimestamps: [],
    bpmEstimate: 128,
    segmentBpms: [128, 128, 128, 128],
    avgConfidence: 0.9,
    sampleRate: 22050,
    duration: 300,
    ...overrides,
  }
}

function generateEvenBeats(bpm: number, duration: number, offset = 0): number[] {
  const interval = 60 / bpm
  const beats: number[] = []
  let pos = offset
  while (pos < duration) {
    beats.push(pos)
    pos += interval
  }
  return beats
}

describe('generateBeatgrid', () => {
  it('generiert Static Grid fuer 128 BPM gleichmaessige Beats', () => {
    const beats = generateEvenBeats(128, 300, 0.142)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 127.9, 128.1, 128],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.medianBpm).toBeCloseTo(128, 0)
    expect(result.phaseOffsetSec).toBeCloseTo(0.142, 3)
    expect(result.tempoMarkers).toHaveLength(1)
    expect(result.tempoMarkers[0].beat).toBe(1)
    expect(result.tempoMarkers[0].meter).toBe('4/4')
    expect(result.confidence).toBeGreaterThan(80)
  })

  it('skippt bei Variable BPM (Varianz >5%)', () => {
    const beats = generateEvenBeats(128, 300, 0.1)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [120, 128, 140, 125, 135],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('skipped')
    expect(result.skipReason).toBe('variable-bpm')
    expect(result.isVariableBpm).toBe(true)
  })

  it('skippt bei <10 Beats', () => {
    const rawBeat = makeRawBeat({
      beatTimestamps: [0.1, 0.57, 1.04, 1.51],
      bpmEstimate: 128,
      segmentBpms: [128],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('skipped')
    expect(result.skipReason).toBe('too-few-beats')
  })

  it('generiert auch bei existierenden TempoMarkern (fuer Vergleich)', () => {
    const beats = generateEvenBeats(128, 300, 0.1)
    const rawBeat = makeRawBeat({ beatTimestamps: beats })
    const existingMarkers: TempoMarker[] = [
      { position: 0.1, bpm: 128, meter: '4/4', beat: 1 },
    ]

    const result = generateBeatgrid(rawBeat, existingMarkers)

    expect(result.method).toBe('static')
    expect(result.skipReason).toBeUndefined()
  })

  it('Half/Double Guard: 64 BPM detected vs. 128 estimate', () => {
    // Beats im 64-BPM-Takt (jeder 2. Beat)
    const beats = generateEvenBeats(64, 300, 0.1)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [64, 64, 64, 64],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // sollte auf 128 adjustiert werden (double)
    expect(result.medianBpm).toBeCloseTo(128, 0)
  })

  it('Beats mit Jitter: Median-BPM trotzdem korrekt', () => {
    // Deterministischer Jitter (sinusfoermig, max ±3ms)
    const interval = 60 / 128
    const beats: number[] = []
    let pos = 0.1
    for (let i = 0; i < 50; i++) {
      const jitter = Math.sin(i * 1.7) * 0.003
      beats.push(pos + jitter)
      pos += interval
    }

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [127.5, 128.2, 127.8, 128.5],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.medianBpm).toBeCloseTo(128, 0)
    expect(result.confidence).toBeGreaterThan(70)
  })
})
