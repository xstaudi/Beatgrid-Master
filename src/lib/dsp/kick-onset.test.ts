import { describe, it, expect } from 'vitest'
import { computeKickOnsets } from './kick-onset'

const FRAME_SIZE = 2048
const SAMPLE_RATE = 22050

function makeSilence(durationSec: number): Float32Array {
  return new Float32Array(Math.round(durationSec * SAMPLE_RATE))
}

/** Kurzer Kick-artiger Burst: 80 Hz mit Exponent-Decay */
function addKickBurst(samples: Float32Array, startSec: number, sampleRate: number, amplitude = 1): void {
  const startIdx = Math.round(startSec * sampleRate)
  const kickDurSamples = Math.round(0.05 * sampleRate)
  for (let j = 0; j < kickDurSamples && startIdx + j < samples.length; j++) {
    const t = j / sampleRate
    samples[startIdx + j] += Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 40) * amplitude
  }
}

describe('computeKickOnsets', () => {
  it('gibt leeres Array fuer Stille zurueck', () => {
    const result = computeKickOnsets(makeSilence(1), SAMPLE_RATE)
    expect(result).toEqual([])
  })

  it('gibt leeres Array fuer zu kurzes Audio (<FRAME_SIZE) zurueck', () => {
    const short = new Float32Array(FRAME_SIZE - 1).fill(0.5)
    const result = computeKickOnsets(short, SAMPLE_RATE)
    expect(result).toEqual([])
  })

  it('erkennt Kick-Onsets bei periodischen Bass-Bursts (120 BPM)', () => {
    const beatIntervalSec = 60 / 120  // 0.5s
    const durationSec = 5
    const samples = makeSilence(durationSec)

    const beatCount = Math.floor(durationSec / beatIntervalSec)
    for (let beat = 0; beat < beatCount; beat++) {
      addKickBurst(samples, beat * beatIntervalSec, SAMPLE_RATE)
    }

    const onsets = computeKickOnsets(samples, SAMPLE_RATE)

    expect(onsets.length).toBeGreaterThan(3)

    // Abstaende zwischen Onsets muessen ~0.5s betragen
    for (let i = 1; i < onsets.length; i++) {
      const gap = onsets[i] - onsets[i - 1]
      expect(gap).toBeGreaterThan(0.35)
      expect(gap).toBeLessThan(0.7)
    }
  })

  it('gibt leeres Array fuer hochfrequentes Signal (keine Bass-Energie) zurueck', () => {
    const durationSec = 2
    const numSamples = Math.round(durationSec * SAMPLE_RATE)
    const samples = new Float32Array(numSamples)
    for (let i = 0; i < numSamples; i++) {
      samples[i] = Math.sin(2 * Math.PI * 5000 * i / SAMPLE_RATE)
    }

    const result = computeKickOnsets(samples, SAMPLE_RATE)
    expect(result).toEqual([])
  })

  it('erkennt einzelnen Bass-Impuls bei ~0.5s', () => {
    const durationSec = 3
    const samples = makeSilence(durationSec)

    // Prominenter Einzel-Kick bei 0.5s
    addKickBurst(samples, 0.5, SAMPLE_RATE, 100)

    const onsets = computeKickOnsets(samples, SAMPLE_RATE)

    expect(onsets.length).toBeGreaterThanOrEqual(1)

    // Naechster Onset muss innerhalb von 150ms an 0.5s liegen
    const closest = onsets.reduce((best, t) =>
      Math.abs(t - 0.5) < Math.abs(best - 0.5) ? t : best
    )
    expect(Math.abs(closest - 0.5)).toBeLessThan(0.15)
  })
})
