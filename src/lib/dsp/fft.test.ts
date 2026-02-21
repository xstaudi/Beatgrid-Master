import { describe, it, expect } from 'vitest'
import { fft, magnitudeSpectrum } from './fft'

describe('fft', () => {
  it('should handle DC signal', () => {
    const n = 8
    const real = new Float64Array(n).fill(1)
    const imag = new Float64Array(n).fill(0)
    fft(real, imag)

    // DC component should be N, all others ~0
    expect(real[0]).toBeCloseTo(n, 5)
    for (let i = 1; i < n; i++) {
      expect(Math.abs(real[i])).toBeLessThan(1e-10)
      expect(Math.abs(imag[i])).toBeLessThan(1e-10)
    }
  })

  it('should detect pure sine at bin frequency', () => {
    const n = 256
    const real = new Float64Array(n)
    const imag = new Float64Array(n)
    const targetBin = 10

    // Generate sine at exactly bin 10
    for (let i = 0; i < n; i++) {
      real[i] = Math.sin((2 * Math.PI * targetBin * i) / n)
    }

    fft(real, imag)
    const mag = magnitudeSpectrum(real, imag)

    // Peak should be at bin 10
    let maxBin = 0
    let maxVal = 0
    for (let i = 0; i <= n / 2; i++) {
      if (mag[i] > maxVal) {
        maxVal = mag[i]
        maxBin = i
      }
    }
    expect(maxBin).toBe(targetBin)
    expect(maxVal).toBeGreaterThan(n / 4) // Strong peak
  })

  it('should handle single-element input', () => {
    const real = new Float64Array([42])
    const imag = new Float64Array([0])
    fft(real, imag)
    expect(real[0]).toBe(42)
  })

  it('should produce correct magnitude spectrum size', () => {
    const n = 64
    const real = new Float64Array(n)
    const imag = new Float64Array(n)
    fft(real, imag)
    const mag = magnitudeSpectrum(real, imag)
    expect(mag.length).toBe(n / 2 + 1)
  })
})
