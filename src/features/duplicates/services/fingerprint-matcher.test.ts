import { describe, it, expect } from 'vitest'
import { popcount, hammingSimilarity } from './fingerprint-matcher'

describe('popcount', () => {
  it('returns 0 for 0', () => {
    expect(popcount(0)).toBe(0)
  })

  it('returns 1 for powers of 2', () => {
    expect(popcount(1)).toBe(1)
    expect(popcount(2)).toBe(1)
    expect(popcount(4)).toBe(1)
    expect(popcount(1024)).toBe(1)
  })

  it('counts all bits in 0xFF', () => {
    expect(popcount(0xff)).toBe(8)
  })

  it('counts all bits in 0xFFFFFFFF', () => {
    expect(popcount(0xffffffff)).toBe(32)
  })

  it('counts mixed bits', () => {
    expect(popcount(0b10101010)).toBe(4)
    expect(popcount(0b11110000)).toBe(4)
  })
})

describe('hammingSimilarity', () => {
  it('returns 1.0 for identical fingerprints', () => {
    const fp = new Int32Array([1, 2, 3, 4, 5])
    expect(hammingSimilarity(fp, fp)).toBe(1)
  })

  it('returns close to 0 for completely different fingerprints', () => {
    const a = new Int32Array([0, 0, 0, 0])
    const b = new Int32Array([-1, -1, -1, -1]) // all bits set
    const sim = hammingSimilarity(a, b)
    expect(sim).toBe(0)
  })

  it('returns partial similarity', () => {
    const a = new Int32Array([0b11110000, 0b10101010])
    const b = new Int32Array([0b11110000, 0b10101011]) // 1 bit different
    const sim = hammingSimilarity(a, b)
    expect(sim).toBeGreaterThan(0.9)
    expect(sim).toBeLessThan(1)
  })

  it('returns 0 for empty arrays', () => {
    expect(hammingSimilarity(new Int32Array([]), new Int32Array([]))).toBe(0)
  })

  it('returns 0 when overlap is less than 50%', () => {
    const a = new Int32Array([1, 2])
    const b = new Int32Array([1, 2, 3, 4, 5])
    const sim = hammingSimilarity(a, b)
    expect(sim).toBe(0)
  })

  it('compares when overlap is sufficient', () => {
    const a = new Int32Array([1, 2, 3])
    const b = new Int32Array([1, 2, 3, 4])
    const sim = hammingSimilarity(a, b)
    expect(sim).toBe(1)
  })
})
