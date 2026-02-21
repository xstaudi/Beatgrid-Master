import type { WaveformBandBucket, WaveformBandData } from '../types'

const FFT_SIZE = 2048
const HOP_SIZE = 512

/**
 * Radix-2 Cooley-Tukey FFT (in-place, iterative).
 * Inlined to work in Web Worker context.
 */
function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length
  if (n <= 1) return

  // Bit-reversal permutation
  let j = 0
  for (let i = 1; i < n; i++) {
    let bit = n >> 1
    while (j & bit) {
      j ^= bit
      bit >>= 1
    }
    j ^= bit
    if (i < j) {
      let tmp = real[i]; real[i] = real[j]; real[j] = tmp
      tmp = imag[i]; imag[i] = imag[j]; imag[j] = tmp
    }
  }

  // Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1
    const angle = (-2 * Math.PI) / len
    const wReal = Math.cos(angle)
    const wImag = Math.sin(angle)

    for (let i = 0; i < n; i += len) {
      let curReal = 1
      let curImag = 0

      for (let k = 0; k < halfLen; k++) {
        const evenIdx = i + k
        const oddIdx = i + k + halfLen
        const tReal = curReal * real[oddIdx] - curImag * imag[oddIdx]
        const tImag = curReal * imag[oddIdx] + curImag * real[oddIdx]
        real[oddIdx] = real[evenIdx] - tReal
        imag[oddIdx] = imag[evenIdx] - tImag
        real[evenIdx] += tReal
        imag[evenIdx] += tImag
        const newCurReal = curReal * wReal - curImag * wImag
        curImag = curReal * wImag + curImag * wReal
        curReal = newCurReal
      }
    }
  }
}

function createHanningWindow(size: number): Float64Array {
  const window = new Float64Array(size)
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)))
  }
  return window
}

/**
 * Compute 3-band waveform data from PCM samples via STFT.
 *
 * Band ranges (at 22050 Hz sample rate, FFT 2048 → bin resolution ~10.77 Hz):
 * - Low:  20-250 Hz  (bins 2-23)
 * - Mid:  250-2500 Hz (bins 24-232)
 * - High: 2500+ Hz   (bins 233-1024)
 */
export function computeBandData(
  samples: Float32Array,
  sampleRate: number,
  bucketCount: number,
): WaveformBandData {
  const duration = samples.length / sampleRate
  const window = createHanningWindow(FFT_SIZE)
  const binResolution = sampleRate / FFT_SIZE

  // Frequency band bin boundaries
  const lowStart = Math.max(1, Math.round(20 / binResolution))
  const lowEnd = Math.round(250 / binResolution)
  const midEnd = Math.round(2500 / binResolution)
  const halfN = FFT_SIZE >> 1

  // Compute STFT frames
  const totalFrames = Math.max(1, Math.floor((samples.length - FFT_SIZE) / HOP_SIZE) + 1)
  const frameLow = new Float64Array(totalFrames)
  const frameMid = new Float64Array(totalFrames)
  const frameHigh = new Float64Array(totalFrames)
  const frameMin = new Float64Array(totalFrames)
  const frameMax = new Float64Array(totalFrames)

  const real = new Float64Array(FFT_SIZE)
  const imag = new Float64Array(FFT_SIZE)

  for (let f = 0; f < totalFrames; f++) {
    const offset = f * HOP_SIZE

    // Apply window and copy to real, zero imag
    for (let i = 0; i < FFT_SIZE; i++) {
      const idx = offset + i
      const val = idx < samples.length ? samples[idx] : 0
      real[i] = val * window[i]
      imag[i] = 0
    }

    // Track min/max in this frame's time-domain window
    let minVal = Infinity
    let maxVal = -Infinity
    for (let i = 0; i < FFT_SIZE; i++) {
      const idx = offset + i
      if (idx < samples.length) {
        const val = samples[idx]
        if (val < minVal) minVal = val
        if (val > maxVal) maxVal = val
      }
    }
    frameMin[f] = minVal === Infinity ? 0 : minVal
    frameMax[f] = maxVal === -Infinity ? 0 : maxVal

    fft(real, imag)

    // Sum energy in each band
    let lowEnergy = 0
    let midEnergy = 0
    let highEnergy = 0

    for (let i = lowStart; i <= Math.min(lowEnd, halfN); i++) {
      lowEnergy += real[i] * real[i] + imag[i] * imag[i]
    }
    for (let i = lowEnd + 1; i <= Math.min(midEnd, halfN); i++) {
      midEnergy += real[i] * real[i] + imag[i] * imag[i]
    }
    for (let i = midEnd + 1; i <= halfN; i++) {
      highEnergy += real[i] * real[i] + imag[i] * imag[i]
    }

    frameLow[f] = Math.sqrt(lowEnergy)
    frameMid[f] = Math.sqrt(midEnergy)
    frameHigh[f] = Math.sqrt(highEnergy)
  }

  // Downsample frames to bucketCount buckets
  const buckets: WaveformBandBucket[] = new Array(bucketCount)
  const framesPerBucket = totalFrames / bucketCount

  // Find global max for normalization
  let globalMaxEnergy = 0
  for (let f = 0; f < totalFrames; f++) {
    const total = frameLow[f] + frameMid[f] + frameHigh[f]
    if (total > globalMaxEnergy) globalMaxEnergy = total
  }
  if (globalMaxEnergy === 0) globalMaxEnergy = 1

  for (let b = 0; b < bucketCount; b++) {
    const startFrame = Math.floor(b * framesPerBucket)
    const endFrame = Math.min(Math.floor((b + 1) * framesPerBucket), totalFrames)
    const count = endFrame - startFrame

    let lowSum = 0, midSum = 0, highSum = 0
    let minVal = Infinity, maxVal = -Infinity

    for (let f = startFrame; f < endFrame; f++) {
      lowSum += frameLow[f]
      midSum += frameMid[f]
      highSum += frameHigh[f]
      if (frameMin[f] < minVal) minVal = frameMin[f]
      if (frameMax[f] > maxVal) maxVal = frameMax[f]
    }

    if (count > 0) {
      lowSum /= count
      midSum /= count
      highSum /= count
    }

    // Normalize band energies so dominant band = 1
    const maxBand = Math.max(lowSum, midSum, highSum)
    const norm = maxBand > 0 ? 1 / maxBand : 0

    buckets[b] = {
      min: minVal === Infinity ? 0 : minVal,
      max: maxVal === -Infinity ? 0 : maxVal,
      low: lowSum * norm,
      mid: midSum * norm,
      high: highSum * norm,
    }
  }

  return { buckets, sampleRate, duration }
}
