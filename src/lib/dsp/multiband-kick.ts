/**
 * Multi-Band Kick Detection (3 gewichtete Baender).
 * Ersetzt kick-onset.ts mit besserer Sub-Bass-Aufloesung und Anti-Leak.
 */

import { fft, magnitudeSpectrum } from './fft'
import { hanningWindow } from './windowing'

const FRAME_SIZE = 4096  // Bessere Sub-Bass-Aufloesung als 2048
const HOP_SIZE = 512
const MIN_ONSET_DISTANCE_SEC = 0.15  // Schnelle Kicks bis ~200 BPM
const ENERGY_THRESHOLD_FACTOR = 2.5
const MIN_BASS_ENERGY = 1.0

// 3 Frequency Bands mit Gewichten
const BANDS = [
  { minHz: 20, maxHz: 60, weight: 0.5 },    // Sub-Bass (Fundamental)
  { minHz: 60, maxHz: 120, weight: 1.0 },   // Low-Bass (Body, meiste Energie)
  { minHz: 120, maxHz: 250, weight: 0.3 },  // Low-Mid (Attack/Click)
] as const

// Anti-Leak: HF-Energie-Grenze
const HF_MIN_HZ = 2000
const HF_RATIO_THRESHOLD = 3.0  // Reject wenn HF > 3x Bass

/**
 * Berechnet Multi-Band Kick-Onsets (20-250 Hz, gewichtet).
 * Kompatible Signatur zu computeKickOnsets.
 */
export function computeMultibandKickOnsets(
  samples: Float32Array,
  sampleRate: number,
): number[] {
  if (samples.length < FRAME_SIZE) return []

  const window = hanningWindow(FRAME_SIZE)
  const frameCount = Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1
  const numBins = (FRAME_SIZE >> 1) + 1

  // Bin-Ranges berechnen
  const bandRanges = BANDS.map(b => ({
    binLow: Math.max(1, Math.ceil(b.minHz * FRAME_SIZE / sampleRate)),
    binHigh: Math.min(numBins - 1, Math.floor(b.maxHz * FRAME_SIZE / sampleRate)),
    weight: b.weight,
  }))
  const hfBinLow = Math.ceil(HF_MIN_HZ * FRAME_SIZE / sampleRate)

  const weightedEnergy = new Float64Array(frameCount)
  const hfEnergy = new Float64Array(frameCount)
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

    // Gewichtete Multi-Band-Energie
    let totalWeightedEnergy = 0
    for (const band of bandRanges) {
      let energy = 0
      for (let b = band.binLow; b <= band.binHigh; b++) energy += mag[b] * mag[b]
      totalWeightedEnergy += energy * band.weight
    }
    weightedEnergy[i] = totalWeightedEnergy

    // HF-Energie fuer Anti-Leak
    let hf = 0
    for (let b = hfBinLow; b < numBins; b++) hf += mag[b] * mag[b]
    hfEnergy[i] = hf
  }

  // Adaptiver Threshold via Median
  const sorted = Float64Array.from(weightedEnergy).sort()
  const median = sorted[Math.floor(sorted.length / 2)]
  const threshold = Math.max(median * ENERGY_THRESHOLD_FACTOR, MIN_BASS_ENERGY)

  // Peak Detection mit Mindestabstand + Anti-Leak
  const minDistFrames = Math.ceil(MIN_ONSET_DISTANCE_SEC * sampleRate / HOP_SIZE)
  const onsets: number[] = []
  let lastPeakFrame = -minDistFrames

  for (let i = 1; i < frameCount - 1; i++) {
    if (
      weightedEnergy[i] > threshold &&
      weightedEnergy[i] > weightedEnergy[i - 1] &&
      weightedEnergy[i] >= weightedEnergy[i + 1] &&
      i - lastPeakFrame >= minDistFrames
    ) {
      // Anti-Leak: Reject wenn HF-Energie dominiert
      if (weightedEnergy[i] > 0 && hfEnergy[i] / weightedEnergy[i] > HF_RATIO_THRESHOLD) {
        continue
      }
      onsets.push((i * HOP_SIZE + FRAME_SIZE / 2) / sampleRate)
      lastPeakFrame = i
    }
  }

  return onsets
}
