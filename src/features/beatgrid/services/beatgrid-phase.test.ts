import { describe, it, expect } from 'vitest'
import { detectOffBeat, detectOutOfPhase } from './beatgrid-phase'
import type { BeatDriftPoint } from '@/types/analysis'

function makeDriftPoints(drifts: number[]): BeatDriftPoint[] {
  return drifts.map((driftMs, i) => ({
    beatIndex: i,
    positionMs: i * 500,
    driftMs,
    severity: 'ok' as const,
  }))
}

describe('detectOffBeat', () => {
  it('gibt positiven Median zurück wenn Grid zu früh', () => {
    const points = makeDriftPoints([19, 21, 20, 18, 22])
    expect(detectOffBeat(points)).toBeCloseTo(20, 0)
  })

  it('gibt negativen Median zurück wenn Grid zu spät', () => {
    const points = makeDriftPoints([-14, -16, -15, -13, -15])
    expect(detectOffBeat(points)).toBeCloseTo(-15, 0)
  })

  it('gibt nahezu 0 bei Jitter um 0 (wird zu undefined in checkBeatgrid)', () => {
    const points = makeDriftPoints([1, -2, 1, -1, 2, -1, 0, 1])
    expect(Math.abs(detectOffBeat(points))).toBeLessThan(3)
  })

  it('gibt 0 zurück wenn weniger als 4 Punkte', () => {
    expect(detectOffBeat(makeDriftPoints([20, 20, 20]))).toBe(0)
    expect(detectOffBeat([])).toBe(0)
  })
})

describe('detectOutOfPhase', () => {
  // 4/4-Takt bei 128 BPM: Beats alle 0.468s, Kicks auf Position 0 + 2 (gerade Indizes)
  const bpmInterval = 60 / 128  // ~0.469s
  const expectedBeats = Array.from({ length: 32 }, (_, i) => i * bpmInterval)

  it('gibt 0 zurück wenn Kicks korrekt auf Taktschlägen 1+3 (Indizes 0+2)', () => {
    // Kicks auf expectedBeats[0], [2], [4], [6], [8], [10], [12], [14]
    const kicks = [0, 2, 4, 6, 8, 10, 12, 14].map((i) => expectedBeats[i] + 0.001)
    expect(detectOutOfPhase(expectedBeats, kicks)).toBe(0)
  })

  it('gibt 1 zurück wenn Kicks auf Taktschlägen 2+4 (Indizes 1+3)', () => {
    // Kicks auf expectedBeats[1], [3], [5], [7], [9], [11], [13], [15]
    const kicks = [1, 3, 5, 7, 9, 11, 13, 15].map((i) => expectedBeats[i] + 0.001)
    expect(detectOutOfPhase(expectedBeats, kicks)).toBe(1)
  })

  it('gibt null zurück wenn weniger als 8 Kicks', () => {
    const kicks = [0, 1, 2, 3, 4, 5, 6].map((i) => expectedBeats[i])
    expect(detectOutOfPhase(expectedBeats, kicks)).toBeNull()
  })
})
