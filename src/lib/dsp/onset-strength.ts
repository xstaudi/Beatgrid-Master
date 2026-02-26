/**
 * Librosa-inspirierte Onset-Staerke via Mel-Spectrogramm.
 * Berechnet 1D Onset-Funktion + Peak-Picking.
 */

import { fft, magnitudeSpectrum } from './fft'
import { hanningWindow } from './windowing'
import { createMelFilterbank } from './mel'

const FRAME_SIZE = 2048
const HOP_SIZE = 512
const NUM_MEL_FILTERS = 40
const LOG_FLOOR_DB = -80
const PEAK_MIN_DISTANCE_SEC = 0.1
const PEAK_THRESHOLD_FACTOR = 0.3

export interface OnsetStrengthResult {
  envelope: Float64Array
  peaks: number[]  // Zeitstempel in Sekunden
}

/**
 * Berechnet Onset-Strength-Envelope via Mel-Spectrogramm.
 */
export function computeOnsetStrength(
  samples: Float32Array,
  sampleRate: number,
): OnsetStrengthResult {
  if (samples.length < FRAME_SIZE) return { envelope: new Float64Array(0), peaks: [] }

  const window = hanningWindow(FRAME_SIZE)
  const melBank = createMelFilterbank(NUM_MEL_FILTERS, FRAME_SIZE, sampleRate)
  const frameCount = Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1
  const numBins = (FRAME_SIZE >> 1) + 1

  // Mel-Log-Spektrogramm berechnen
  const logFloorLin = Math.pow(10, LOG_FLOOR_DB / 10)
  const melFrames = new Array<Float64Array>(frameCount)
  const imag = new Float64Array(FRAME_SIZE)

  for (let i = 0; i < frameCount; i++) {
    const offset = i * HOP_SIZE
    const slice = samples.subarray(offset, offset + FRAME_SIZE)
    let floatSlice: Float32Array
    if (slice.length < FRAME_SIZE) {
      floatSlice = new Float32Array(FRAME_SIZE)
      floatSlice.set(slice)
    } else {
      floatSlice = slice
    }

    // Windowed FFT
    const real = new Float64Array(FRAME_SIZE)
    for (let j = 0; j < FRAME_SIZE; j++) real[j] = floatSlice[j] * window[j]
    imag.fill(0)
    fft(real, imag)
    const mag = magnitudeSpectrum(real, imag)

    // Power-Spektrum
    const power = new Float64Array(numBins)
    for (let k = 0; k < numBins; k++) power[k] = mag[k] * mag[k]

    // Mel-Filterbank anwenden + Log-Magnitude
    const melVec = new Float64Array(NUM_MEL_FILTERS)
    for (let m = 0; m < NUM_MEL_FILTERS; m++) {
      let sum = 0
      const filter = melBank[m]
      for (let k = 0; k < numBins; k++) sum += power[k] * filter[k]
      melVec[m] = Math.log10(Math.max(sum, logFloorLin))
    }
    melFrames[i] = melVec
  }

  // First-Order Difference + Half-Wave Rectification + Summe ueber Mel-Bands
  const envelope = new Float64Array(frameCount)
  for (let i = 1; i < frameCount; i++) {
    let sum = 0
    for (let m = 0; m < NUM_MEL_FILTERS; m++) {
      const diff = melFrames[i][m] - melFrames[i - 1][m]
      if (diff > 0) sum += diff
    }
    envelope[i] = sum
  }

  // Normalisierung [0,1]
  let maxVal = 0
  for (let i = 0; i < frameCount; i++) {
    if (envelope[i] > maxVal) maxVal = envelope[i]
  }
  if (maxVal > 0) {
    for (let i = 0; i < frameCount; i++) envelope[i] /= maxVal
  }

  // Peak-Pick: Adaptive Threshold (median + 0.3*std, min distance)
  const peaks = pickPeaks(envelope, sampleRate, HOP_SIZE)

  return { envelope, peaks }
}

function pickPeaks(envelope: Float64Array, sampleRate: number, hopSize: number): number[] {
  const n = envelope.length
  if (n < 3) return []

  // Median + Std berechnen
  const sorted = Float64Array.from(envelope).sort()
  const median = sorted[Math.floor(n / 2)]
  let variance = 0
  for (let i = 0; i < n; i++) {
    const d = envelope[i] - median
    variance += d * d
  }
  const std = Math.sqrt(variance / n)
  const threshold = median + PEAK_THRESHOLD_FACTOR * std

  const minDistFrames = Math.ceil(PEAK_MIN_DISTANCE_SEC * sampleRate / hopSize)
  const peaks: number[] = []
  let lastPeakFrame = -minDistFrames

  for (let i = 1; i < n - 1; i++) {
    if (
      envelope[i] > threshold &&
      envelope[i] > envelope[i - 1] &&
      envelope[i] >= envelope[i + 1] &&
      i - lastPeakFrame >= minDistFrames
    ) {
      peaks.push((i * hopSize + FRAME_SIZE / 2) / sampleRate)
      lastPeakFrame = i
    }
  }

  return peaks
}
