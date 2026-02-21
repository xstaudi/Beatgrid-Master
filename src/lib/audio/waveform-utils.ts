export interface WaveformBucket {
  min: number
  max: number
  rms: number
}

export function downsampleForWaveform(
  samples: Float32Array,
  bucketCount: number,
): WaveformBucket[] {
  if (samples.length === 0 || bucketCount <= 0) return []

  const samplesPerBucket = samples.length / bucketCount
  const buckets: WaveformBucket[] = new Array(bucketCount)

  for (let i = 0; i < bucketCount; i++) {
    const start = Math.floor(i * samplesPerBucket)
    const end = Math.min(Math.floor((i + 1) * samplesPerBucket), samples.length)

    let min = Infinity
    let max = -Infinity
    let sumSquares = 0
    const count = end - start

    for (let j = start; j < end; j++) {
      const val = samples[j]
      if (val < min) min = val
      if (val > max) max = val
      sumSquares += val * val
    }

    buckets[i] = {
      min: count > 0 ? min : 0,
      max: count > 0 ? max : 0,
      rms: count > 0 ? Math.sqrt(sumSquares / count) : 0,
    }
  }

  return buckets
}
