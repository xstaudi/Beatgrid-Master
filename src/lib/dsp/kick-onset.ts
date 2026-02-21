import { fft, magnitudeSpectrum } from './fft'
import { hanningWindow, applyWindow } from './windowing'

const FRAME_SIZE = 2048
const HOP_SIZE = 512
const KICK_FREQ_MIN_HZ = 20
const KICK_FREQ_MAX_HZ = 150
const MIN_ONSET_DISTANCE_SEC = 0.2
const ENERGY_THRESHOLD_FACTOR = 2.0
// Absolutes Minimum gegen FFT-Leakage-Rauschen bei hochfrequenten Signalen.
// Entspricht bass-FFT-Magnitude ~1.0 (reale Kicks liegen im Bereich 10^3–10^5).
const MIN_BASS_ENERGY = 1.0

/**
 * Berechnet Kick-Drum-Onsets aus Tieffrequenz-Energie (20–150 Hz).
 * Robuster Downbeat-Kandidat fuer schlechte Beat-Detection-Qualitaet.
 */
export function computeKickOnsets(samples: Float32Array, sampleRate: number): number[] {
  if (samples.length < FRAME_SIZE) return []

  const window = hanningWindow(FRAME_SIZE)
  const binLow = Math.max(1, Math.ceil(KICK_FREQ_MIN_HZ * FRAME_SIZE / sampleRate))
  const binHigh = Math.floor(KICK_FREQ_MAX_HZ * FRAME_SIZE / sampleRate)
  const frameCount = Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1
  const bassEnergy = new Float64Array(frameCount)
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

    const real = applyWindow(floatSlice, window)
    imag.fill(0)
    fft(real, imag)
    const mag = magnitudeSpectrum(real, imag)

    let energy = 0
    for (let b = binLow; b <= binHigh; b++) energy += mag[b] * mag[b]
    bassEnergy[i] = energy
  }

  // Median fuer adaptiven Threshold (mit absolutem Minimum gegen Noise-Floor)
  const sorted = Float64Array.from(bassEnergy).sort()
  const median = sorted[Math.floor(sorted.length / 2)]
  const threshold = Math.max(median * ENERGY_THRESHOLD_FACTOR, MIN_BASS_ENERGY)

  // Peak Detection mit Mindestabstand
  const minDistFrames = Math.ceil(MIN_ONSET_DISTANCE_SEC * sampleRate / HOP_SIZE)
  const onsets: number[] = []
  let lastPeakFrame = -minDistFrames

  for (let i = 1; i < frameCount - 1; i++) {
    if (
      bassEnergy[i] > threshold &&
      bassEnergy[i] > bassEnergy[i - 1] &&
      bassEnergy[i] >= bassEnergy[i + 1] &&
      i - lastPeakFrame >= minDistFrames
    ) {
      onsets.push((i * HOP_SIZE + FRAME_SIZE / 2) / sampleRate)
      lastPeakFrame = i
    }
  }

  return onsets
}
