import { describe, it, expect } from 'vitest'
import { generateBeatgrid, generateDynamicSegments } from './beatgrid-generation'
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

  it('generiert Grid trotz Variable BPM (>5% Varianz), flaggt aber isVariableBpm', () => {
    const beats = generateEvenBeats(128, 300, 0.1)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [120, 128, 140, 125, 135],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.isVariableBpm).toBe(true)
    expect(result.tempoMarkers).toHaveLength(1)
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

  it('Phase-Histogramm: ignoriert fruehen Pickup-Beat', () => {
    const interval = 60 / 128
    // 1 Pickup bei 0.05s, echte Beats ab 0.28s
    const beats: number[] = [0.05]
    let pos = 0.28
    for (let i = 0; i < 60; i++) {
      beats.push(pos)
      pos += interval
    }

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // Downbeat soll ~0.28s sein, NICHT 0.05s
    expect(result.phaseOffsetSec).toBeCloseTo(0.28, 2)
  })

  it('Phase-Histogramm: mehrere Pickup-Beats werden ignoriert', () => {
    const interval = 60 / 128
    // 3 Pickups vor dem Grid
    const beats: number[] = [0.02, 0.08, 0.15]
    let pos = 0.35
    for (let i = 0; i < 80; i++) {
      beats.push(pos)
      pos += interval
    }

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // Downbeat soll ~0.35s sein
    expect(result.phaseOffsetSec).toBeCloseTo(0.35, 2)
  })

  it('Phase-Histogramm: Track ohne Pickup bleibt unveraendert', () => {
    // Alle Beats perfekt im Raster ab 0.142s
    const beats = generateEvenBeats(128, 300, 0.142)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // Erster Beat = Downbeat (kein Pickup)
    expect(result.phaseOffsetSec).toBeCloseTo(0.142, 3)
  })

  it('Phase-Histogramm: spaerliche Intro-Beats vor dichtem Hauptteil', () => {
    const interval = 60 / 128
    // 3 vereinzelte Intro-Onsets (nicht im Raster)
    const beats: number[] = [0.5, 1.2, 2.0]
    // Dichter Hauptteil ab 3.0s
    let pos = 3.0
    for (let i = 0; i < 100; i++) {
      beats.push(pos)
      pos += interval
    }

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // Downbeat soll im Hauptteil liegen (~3.0s), nicht bei Intro-Onsets
    expect(result.phaseOffsetSec).toBeGreaterThanOrEqual(3.0)
    expect(result.phaseOffsetSec).toBeLessThan(3.5)
  })

  it('generiert Grid fuer 30 BPM (langsam)', () => {
    const beats = generateEvenBeats(30, 300, 0.5)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 30,
      segmentBpms: [30, 30, 30, 30],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.medianBpm).toBeCloseTo(30, 0)
    expect(result.phaseOffsetSec).toBeCloseTo(0.5, 2)
    expect(result.confidence).toBeGreaterThan(70)
  })

  it('generiert Grid fuer 240 BPM (schnell)', () => {
    const beats = generateEvenBeats(240, 300, 0.05)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 240,
      segmentBpms: [240, 240, 240, 240],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.medianBpm).toBeCloseTo(240, 0)
    expect(result.phaseOffsetSec).toBeCloseTo(0.05, 2)
    expect(result.confidence).toBeGreaterThan(70)
  })

  it('Dynamic Grid: Variable BPM (120→128→124) -> method dynamic + 3 Marker via generateBeatgrid', () => {
    // 6 Segmente: 2x120, 2x128, 2x124 -> 3 Gruppen (>2% BPM-Diff zwischen Gruppen)
    // Varianz: median=124, max-dev=|116-124|/124=6.5% > 5% -> isVariableBpm=true
    const segmentBpms = [116, 116, 128, 128, 124, 124]
    const beats = [
      ...generateEvenBeats(116, 60, 0.1),
      ...generateEvenBeats(128, 60, 60.1),
      ...generateEvenBeats(124, 60, 120.1),
    ]
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      segmentBpms,
      bpmEstimate: 123,
      duration: 180,
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('dynamic')
    expect(result.isVariableBpm).toBe(true)
    expect(result.tempoMarkers).toHaveLength(3)
    expect(result.tempoMarkers[0].bpm).toBe(116)
    expect(result.tempoMarkers[1].bpm).toBe(128)
    expect(result.tempoMarkers[2].bpm).toBe(124)
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

describe('generateDynamicSegments', () => {
  it('Kleine Fluktuation (<2%) -> ein Marker (alles zusammengefuehrt)', () => {
    const rawBeat = makeRawBeat({
      segmentBpms: [120, 120.5, 121, 120.8, 120.2, 120.7],
      beatTimestamps: generateEvenBeats(120, 180, 0.1),
      duration: 180,
    })

    const markers = generateDynamicSegments(rawBeat)

    expect(markers).toHaveLength(1)
  })

  it('Zu wenig Segmente (<4) -> generateBeatgrid Fallback zu static', () => {
    // isVariableBpm=true (17% Varianz) aber segmentBpms.length=3 < 4 -> static
    const rawBeat = makeRawBeat({
      beatTimestamps: generateEvenBeats(120, 90, 0.1),
      segmentBpms: [100, 135, 115],
      bpmEstimate: 120,
      duration: 90,
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.isVariableBpm).toBe(true)
  })

  it('Phase-Anchor: erster Kick im Zeitfenster bestimmt Position des ersten Markers', () => {
    const bpm = 120
    const intervalSec = 60 / bpm  // 0.5s
    const kickOffset = 0.3
    const rawBeat = makeRawBeat({
      segmentBpms: [120, 120, 128, 128],
      beatTimestamps: generateEvenBeats(120, 120, kickOffset),
      kickOnsets: [kickOffset, 5.0, 10.0, 20.0, 30.0],
      duration: 120,
    })

    const markers = generateDynamicSegments(rawBeat)

    // Erster Marker: phase = kickOffset % intervalSec
    expect(markers[0].position).toBeCloseTo(kickOffset % intervalSec, 3)
  })

  it('Phase-Anchor Fallback: ohne kickOnsets via Beat-Histogramm', () => {
    const beatOffset = 0.25
    const rawBeat = makeRawBeat({
      segmentBpms: [120, 120, 128, 128],
      beatTimestamps: generateEvenBeats(120, 120, beatOffset),
      // kein kickOnsets
      duration: 120,
    })

    const markers = generateDynamicSegments(rawBeat)

    // Phase aus Beat-Histogramm -> ≈ beatOffset
    expect(markers[0].position).toBeCloseTo(beatOffset, 2)
  })
})
