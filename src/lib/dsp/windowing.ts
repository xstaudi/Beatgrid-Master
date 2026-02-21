/**
 * Create a Hanning window of given size.
 */
export function hanningWindow(size: number): Float64Array {
  const window = new Float64Array(size)
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)))
  }
  return window
}

/**
 * Apply a precomputed window to samples, returning a new Float64Array.
 */
export function applyWindow(samples: Float32Array, window: Float64Array): Float64Array {
  const out = new Float64Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    out[i] = samples[i] * window[i]
  }
  return out
}
