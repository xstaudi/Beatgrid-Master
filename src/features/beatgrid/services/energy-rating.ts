/**
 * Energy-Rating: RMS-basierte Energie-Bewertung auf 1-10 Skala.
 *
 * Mapping: -40 dBFS → 1, -6 dBFS → 10 (linear interpoliert, clamped).
 */
export function computeEnergyRating(samples: Float32Array): number {
  if (samples.length === 0) return 1

  let sumSq = 0
  for (let i = 0; i < samples.length; i++) {
    sumSq += samples[i] * samples[i]
  }
  const rms = Math.sqrt(sumSq / samples.length)
  if (rms === 0) return 1

  const dbfs = 20 * Math.log10(rms)
  // -40 dB → 1, -6 dB → 10
  const rating = 1 + ((dbfs - (-40)) / ((-6) - (-40))) * 9
  return Math.round(Math.min(10, Math.max(1, rating)))
}
