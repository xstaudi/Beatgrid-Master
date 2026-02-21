/**
 * Harmonic Pitch Class Profile (HPCP) computation after Gomez (2006).
 */
import { fft, magnitudeSpectrum } from './fft'
import { hanningWindow, applyWindow } from './windowing'

export interface HpcpConfig {
  frameSize: number   // 4096
  hopSize: number     // 2048
  sampleRate: number  // 22050
  numBins: number     // 12
  minFreq: number     // 100 Hz
  maxFreq: number     // 5000 Hz
  refFreq: number     // 440 Hz (A4)
}

export const DEFAULT_HPCP_CONFIG: HpcpConfig = {
  frameSize: 4096,
  hopSize: 2048,
  sampleRate: 22050,
  numBins: 12,
  minFreq: 100,
  maxFreq: 5000,
  refFreq: 440,
}

/**
 * Compute HPCP vector averaged over all frames.
 * Returns a Float64Array of length numBins (12).
 */
export function computeHpcp(samples: Float32Array, config: HpcpConfig = DEFAULT_HPCP_CONFIG): Float64Array {
  const { frameSize, hopSize, sampleRate, numBins, minFreq, maxFreq, refFreq } = config

  const window = hanningWindow(frameSize)
  const hpcp = new Float64Array(numBins)
  let frameCount = 0

  const freqResolution = sampleRate / frameSize
  const minBin = Math.ceil(minFreq / freqResolution)
  const maxBin = Math.min(Math.floor(maxFreq / freqResolution), frameSize / 2)

  // Threshold for spectral peak detection (relative to frame max)
  const PEAK_THRESHOLD = 0.01

  if (samples.length < frameSize) return hpcp

  for (let frameStart = 0; frameStart + frameSize <= samples.length; frameStart += hopSize) {
    const frame = samples.subarray(frameStart, frameStart + frameSize)
    const windowed = applyWindow(frame, window)

    // FFT
    const imag = new Float64Array(frameSize)
    fft(windowed, imag)

    const mag = magnitudeSpectrum(windowed, imag)

    // Find max magnitude for threshold
    let maxMag = 0
    for (let i = minBin; i <= maxBin; i++) {
      if (mag[i] > maxMag) maxMag = mag[i]
    }
    const threshold = maxMag * PEAK_THRESHOLD
    if (maxMag === 0) continue

    // Spectral peak detection + pitch class mapping
    for (let i = minBin + 1; i < maxBin; i++) {
      // Local maximum check
      if (mag[i] <= mag[i - 1] || mag[i] <= mag[i + 1]) continue
      if (mag[i] < threshold) continue

      const freq = i * freqResolution
      // Map frequency to pitch class (semitones from ref, mod 12)
      const semitones = 12 * Math.log2(freq / refFreq)
      const pitchClass = ((semitones % 12) + 12) % 12
      const bin = Math.round(pitchClass * (numBins / 12)) % numBins

      // Weight by magnitude squared (energy)
      hpcp[bin] += mag[i] * mag[i]
    }

    frameCount++
  }

  // Average over frames
  if (frameCount > 0) {
    for (let i = 0; i < numBins; i++) {
      hpcp[i] /= frameCount
    }
  }

  // Normalize to max = 1
  let maxVal = 0
  for (let i = 0; i < numBins; i++) {
    if (hpcp[i] > maxVal) maxVal = hpcp[i]
  }
  if (maxVal > 0) {
    for (let i = 0; i < numBins; i++) {
      hpcp[i] /= maxVal
    }
  }

  return hpcp
}
