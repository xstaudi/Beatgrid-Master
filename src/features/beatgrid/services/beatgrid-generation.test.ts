import { describe, it, expect } from 'vitest'
import { generateBeatgrid } from './beatgrid-generation'
import type { RawBeatResult } from '@/types/audio'
import type { TempoMarker } from '@/types/track'
import { PHASE_BIN_WIDTH_MS } from '../constants'

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

  it('generiert Grid trotz Variable BPM, flaggt isVariableBpm bei echtem variablem Tempo', () => {
    // Echte variable Beats: abwechselnd 128 BPM und 100 BPM Intervalle
    const beats: number[] = []
    let t = 0.1
    for (let i = 0; i < 200; i++) {
      beats.push(t)
      t += i % 2 === 0 ? 0.47 : 0.6  // ~128 BPM / ~100 BPM
    }
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 112,
      segmentBpms: [120, 128, 140, 125, 135],
      duration: t,
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.isVariableBpm).toBe(true)
    expect(result.tempoMarkers).toHaveLength(1)
  })

  it('flaggt gleichmaessigen Electronic-Track NICHT als variable BPM', () => {
    const beats = generateEvenBeats(128, 300, 0.1)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [126, 128, 130, 127, 129],  // Leichte Segment-Varianz
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    expect(result.isVariableBpm).toBe(false)
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
    // Downbeat soll ~0.28s sein, NICHT 0.05s (±15ms durch LS-BPM-Refinement)
    expect(result.phaseOffsetSec).toBeCloseTo(0.28, 1)
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
    // Downbeat soll ~0.35s sein (±15ms durch LS-BPM-Refinement)
    expect(result.phaseOffsetSec).toBeCloseTo(0.35, 1)
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
    // Phase basiert auf dem dichten Hauptteil (3.0s), nicht auf Intro-Onsets
    // 3.0 % interval = Phase des Hauptteils
    const expectedPhase = 3.0 % interval
    expect(result.phaseOffsetSec).toBeCloseTo(expectedPhase, 2)
    // Grid muss die Hauptteil-Beats treffen: phaseOffset + N*interval = 3.0
    const beatsToDrop = Math.round((3.0 - result.phaseOffsetSec) / interval)
    expect(result.phaseOffsetSec + beatsToDrop * interval).toBeCloseTo(3.0, 2)
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

  // --- Plan-Tests: Phase-Praezision, Drop-Downbeat, Kick-Histogram, BPM-Validierung, Feinere Bins ---

  it('Phase-Praezision: ±8ms Jitter → Grid-Phase innerhalb 5ms vom Ideal', () => {
    const interval = 60 / 128
    const idealPhase = 0.2
    const beats: number[] = []
    let pos = idealPhase
    for (let i = 0; i < 200; i++) {
      // Deterministischer Jitter ±8ms (realistisch fuer Beat-Detection)
      const jitter = Math.sin(i * 2.3) * 0.008
      beats.push(pos + jitter)
      pos += interval
    }

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
    })

    // BPM via existingMarkers fixieren damit Phase-Praezision isoliert getestet wird
    // (Jitter verschiebt computeMedianBpm minimal, was Phase-Modulo verzerrt)
    const existingMarkers: TempoMarker[] = [
      { position: 0.0, bpm: 128, meter: '4/4', beat: 1 },
    ]

    const result = generateBeatgrid(rawBeat, existingMarkers)

    expect(result.method).toBe('static')
    expect(result.medianBpm).toBe(128)
    // Phase muss innerhalb 5ms vom Ideal liegen
    const expectedPhase = idealPhase % interval
    const phaseDiffMs = Math.abs(result.phaseOffsetSec % interval - expectedPhase) * 1000
    expect(phaseDiffMs).toBeLessThan(5)
  })

  it('Drop-Downbeat: Kick-freies Intro + Drop → Downbeat auf erstem Drop-Kick', () => {
    const interval = 60 / 128
    const barLen = interval * 4

    // Beats durchgehend
    const beats = generateEvenBeats(128, 300, 0.1)

    // Kick-Pattern: 32 Bars Kicks, 16 Bars Breakdown (keine Kicks), dann Drop
    const breakdownStart = 32 * barLen
    const dropStart = 48 * barLen

    const kickOnsets: number[] = []
    // Intro-Kicks (32 Bars)
    let pos = 0.1
    while (pos < breakdownStart) {
      kickOnsets.push(pos)
      pos += interval
    }
    // Breakdown: keine Kicks (16 Bars)
    // Drop-Kicks ab Bar 48
    pos = dropStart
    while (pos < 300) {
      kickOnsets.push(pos)
      pos += interval
    }

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
      kickOnsets,
      duration: 300,
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // Erster Drop-Kick muss auf Downbeat (barPos 0) fallen
    const dropKickBeatIdx = Math.round((dropStart - result.phaseOffsetSec) / interval)
    const barPos = ((dropKickBeatIdx % 4) + 4) % 4
    expect(barPos).toBe(0)
  })

  it('Kick-Histogram Downbeat: Track ohne Drop → Downbeat auf dominanter Kick-Bar-Position', () => {
    const interval = 60 / 128
    const barInterval = interval * 4

    // Beats durchgehend
    const beats = generateEvenBeats(128, 300, 0.1)

    // Kicks nur auf Downbeat-Positionen (jeder 4. Beat) - gleichmaessig, kein Drop
    const kickOnsets: number[] = []
    let pos = 0.1
    while (pos < 300) {
      kickOnsets.push(pos)
      pos += barInterval
    }

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
      kickOnsets,
      duration: 300,
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // Kick-Positionen muessen auf Downbeat (barPos 0) fallen
    const kickBeatIdx = Math.round((0.1 - result.phaseOffsetSec) / interval)
    const barPos = ((kickBeatIdx % 4) + 4) % 4
    expect(barPos).toBe(0)
  })

  it('BPM-Validierung: Existierender BPM 128, detektiert ~192 → wird adjustiert', () => {
    // Beats im 192-BPM-Takt
    const beats = generateEvenBeats(192, 300, 0.1)
    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 192,
      segmentBpms: [192, 192, 192, 192],
    })

    const existingMarkers: TempoMarker[] = [
      { position: 0.1, bpm: 128, meter: '4/4', beat: 1 },
    ]

    const result = generateBeatgrid(rawBeat, existingMarkers)

    expect(result.method).toBe('static')
    // 192 ist weder Haelfte noch Doppeltes von 128 (Faktor 1.5x)
    // Half/Double Guard: candidates [192, 384, 96] → 96 closest to 128
    // Deviation |96-128|/128 = 25% > 2% → adjusted (96) wird verwendet, NICHT blind 128
    expect(result.medianBpm).not.toBe(128)
  })

  it('Feinere Bins: korrekte Phase bei 10ms Phasen-Abstand (5ms Bins trennen, 15ms nicht)', () => {
    const interval = 60 / 128  // 0.46875s

    // Hauptgruppe: 80 Beats bei Phase 200ms
    // Nebengruppe: 20 Beats bei Phase 210ms (nur 10ms Abstand)
    // Mit 5ms Bins: bin 40 vs bin 42 → circDiff=2 → getrennte Cluster
    // Mit 15ms Bins: beide in bin 13 → selber Cluster → Median verschoben
    const beats: number[] = []
    for (let i = 0; i < 80; i++) {
      beats.push(0.200 + i * interval)
    }
    for (let i = 0; i < 20; i++) {
      beats.push(0.210 + i * interval)
    }
    beats.sort((a, b) => a - b)

    const rawBeat = makeRawBeat({
      beatTimestamps: beats,
      bpmEstimate: 128,
      segmentBpms: [128, 128, 128, 128],
    })

    const result = generateBeatgrid(rawBeat, [])

    expect(result.method).toBe('static')
    // Sanity: wir nutzen tatsaechlich 5ms Bins
    expect(PHASE_BIN_WIDTH_MS).toBe(5)
    // Phase sollte auf Hauptgruppe (200ms) liegen, nicht durch Nebengruppe verschoben
    const expectedPhase = 0.200 % interval
    const phaseDiffMs = Math.abs(result.phaseOffsetSec % interval - expectedPhase) * 1000
    expect(phaseDiffMs).toBeLessThan(8)
  })
})
