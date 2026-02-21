import { describe, it, expect } from 'vitest'
import { estimateKey } from './key-estimation'

describe('estimateKey', () => {
  it('should detect C major from C major HPCP profile', () => {
    // Simulate HPCP that strongly emphasizes C major tones (C, E, G)
    const hpcp = new Float64Array(12)
    hpcp[0] = 1.0  // C
    hpcp[4] = 0.8  // E
    hpcp[7] = 0.7  // G
    hpcp[5] = 0.3  // F (common in C major)
    hpcp[2] = 0.2  // D

    const result = estimateKey(hpcp, 'krumhansl')
    expect(result.key).toBe('C')
    expect(result.scale).toBe('major')
    expect(result.pitchClass).toBe(0)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.correlation).toBeGreaterThan(0)
  })

  it('should detect A minor from A minor HPCP profile', () => {
    const hpcp = new Float64Array(12)
    hpcp[9] = 1.0  // A
    hpcp[0] = 0.7  // C
    hpcp[4] = 0.8  // E
    hpcp[7] = 0.3  // G
    hpcp[2] = 0.2  // D

    const result = estimateKey(hpcp, 'krumhansl')
    expect(result.key).toBe('Am')
    expect(result.scale).toBe('minor')
    expect(result.pitchClass).toBe(9)
  })

  it('should return confidence between 0 and 1', () => {
    const hpcp = new Float64Array(12)
    hpcp[0] = 1.0
    hpcp[7] = 0.5

    const result = estimateKey(hpcp, 'edmm')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('should work with all profile types', () => {
    const hpcp = new Float64Array(12)
    hpcp[0] = 1.0
    hpcp[4] = 0.7
    hpcp[7] = 0.5

    for (const profile of ['krumhansl', 'temperley', 'edmm'] as const) {
      const result = estimateKey(hpcp, profile)
      expect(result.key).toBeTruthy()
      expect(['major', 'minor']).toContain(result.scale)
    }
  })

  it('should handle flat HPCP (all equal)', () => {
    const hpcp = new Float64Array(12).fill(0.5)
    const result = estimateKey(hpcp, 'edmm')
    // Should still return a key (deterministic, even if low confidence)
    expect(result.key).toBeTruthy()
  })

  it('should handle empty HPCP (all zeros)', () => {
    const hpcp = new Float64Array(12)
    const result = estimateKey(hpcp, 'edmm')
    expect(result.key).toBeTruthy()
    expect(result.confidence).toBe(0)
  })
})
