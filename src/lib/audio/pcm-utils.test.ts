import { describe, it, expect } from 'vitest'
import { stereoToMono, downsample, estimateMemoryMb } from './pcm-utils'

describe('stereoToMono', () => {
  it('returns single channel unchanged', () => {
    const mono = new Float32Array([1, 2, 3, 4])
    expect(stereoToMono([mono])).toBe(mono)
  })

  it('averages two channels', () => {
    const left = new Float32Array([1, 0, 0.5])
    const right = new Float32Array([0, 1, 0.5])
    const result = stereoToMono([left, right])
    expect(result[0]).toBeCloseTo(0.5)
    expect(result[1]).toBeCloseTo(0.5)
    expect(result[2]).toBeCloseTo(0.5)
  })

  it('handles silence', () => {
    const left = new Float32Array([0, 0, 0])
    const right = new Float32Array([0, 0, 0])
    const result = stereoToMono([left, right])
    expect(result.every((v) => v === 0)).toBe(true)
  })

  it('handles 4-channel data', () => {
    const ch = () => new Float32Array([1, 1])
    const result = stereoToMono([ch(), ch(), ch(), ch()])
    expect(result[0]).toBeCloseTo(1)
    expect(result[1]).toBeCloseTo(1)
  })
})

describe('downsample', () => {
  it('returns input when rates match', () => {
    const samples = new Float32Array([1, 2, 3])
    expect(downsample(samples, 44100, 44100)).toBe(samples)
  })

  it('reduces sample count when downsampling', () => {
    const samples = new Float32Array(44100) // 1 second at 44100
    for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i)
    const result = downsample(samples, 44100, 22050)
    // Should be roughly half the samples
    expect(result.length).toBeGreaterThan(22000)
    expect(result.length).toBeLessThan(22100)
  })
})

describe('estimateMemoryMb', () => {
  it('calculates correct memory for known size', () => {
    const samples = new Float32Array(262144) // 1 MB (262144 * 4 bytes)
    expect(estimateMemoryMb(samples)).toBeCloseTo(1, 1)
  })

  it('returns 0 for empty array', () => {
    expect(estimateMemoryMb(new Float32Array(0))).toBe(0)
  })
})
