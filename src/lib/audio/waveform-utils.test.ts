import { describe, it, expect } from 'vitest'
import { downsampleForWaveform } from './waveform-utils'

describe('downsampleForWaveform', () => {
  it('returns empty array for empty samples', () => {
    expect(downsampleForWaveform(new Float32Array(0), 10)).toEqual([])
  })

  it('returns empty array for zero bucket count', () => {
    expect(downsampleForWaveform(new Float32Array([1, 2, 3]), 0)).toEqual([])
  })

  it('produces correct number of buckets', () => {
    const samples = new Float32Array(1000)
    const result = downsampleForWaveform(samples, 100)
    expect(result).toHaveLength(100)
  })

  it('calculates min/max correctly', () => {
    const samples = new Float32Array([-0.5, 0.3, -0.8, 0.9])
    const result = downsampleForWaveform(samples, 1)
    expect(result[0].min).toBeCloseTo(-0.8, 5)
    expect(result[0].max).toBeCloseTo(0.9, 5)
  })

  it('calculates RMS correctly', () => {
    // RMS of [1, -1, 1, -1] = 1
    const samples = new Float32Array([1, -1, 1, -1])
    const result = downsampleForWaveform(samples, 1)
    expect(result[0].rms).toBeCloseTo(1.0)
  })

  it('handles single sample per bucket', () => {
    const samples = new Float32Array([0.5, -0.3, 0.7])
    const result = downsampleForWaveform(samples, 3)
    expect(result[0].min).toBe(0.5)
    expect(result[0].max).toBe(0.5)
    expect(result[0].rms).toBeCloseTo(0.5)
  })

  it('handles more buckets than samples', () => {
    const samples = new Float32Array([0.5, -0.3])
    const result = downsampleForWaveform(samples, 10)
    expect(result).toHaveLength(10)
  })
})
