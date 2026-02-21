import { describe, it, expect } from 'vitest'
import { computeHpcp, DEFAULT_HPCP_CONFIG } from './hpcp'

describe('computeHpcp', () => {
  it('should return 12-bin vector for valid input', () => {
    const sampleRate = 22050
    const duration = 2 // 2 seconds
    const samples = new Float32Array(sampleRate * duration)

    // Generate A4 (440 Hz) sine wave
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate)
    }

    const hpcp = computeHpcp(samples, { ...DEFAULT_HPCP_CONFIG, sampleRate })
    expect(hpcp.length).toBe(12)
  })

  it('should detect A4 (440Hz) in the correct pitch class', () => {
    const sampleRate = 22050
    const duration = 2
    const samples = new Float32Array(sampleRate * duration)

    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate)
    }

    const hpcp = computeHpcp(samples, { ...DEFAULT_HPCP_CONFIG, sampleRate })

    // A = pitch class 9 (C=0, C#=1, ... A=9)
    // The max bin should be at index 9 (since ref = 440 Hz = A4)
    let maxBin = 0
    let maxVal = 0
    for (let i = 0; i < 12; i++) {
      if (hpcp[i] > maxVal) {
        maxVal = hpcp[i]
        maxBin = i
      }
    }
    // With 440Hz ref, A maps to bin 0 (0 semitones from ref)
    // The exact bin depends on how we map: semitones from ref mod 12
    // 440Hz / 440Hz = 1, log2(1) = 0, 0 * 12 = 0 semitones, bin 0
    expect(maxBin).toBe(0)
    expect(maxVal).toBe(1) // Normalized to max = 1
  })

  it('should handle silence (all zeros)', () => {
    const samples = new Float32Array(22050 * 2)
    const hpcp = computeHpcp(samples)
    // All bins should be 0
    for (let i = 0; i < 12; i++) {
      expect(hpcp[i]).toBe(0)
    }
  })

  it('should handle short input gracefully', () => {
    const samples = new Float32Array(100) // Too short for a single frame
    const hpcp = computeHpcp(samples)
    expect(hpcp.length).toBe(12)
  })
})
