import { resample } from 'wave-resampler'

/**
 * Averages stereo (or multi-channel) data down to mono.
 */
export function stereoToMono(channelData: Float32Array[]): Float32Array {
  if (channelData.length === 1) return channelData[0]

  const length = channelData[0].length
  const mono = new Float32Array(length)
  const channels = channelData.length
  const scale = 1 / channels

  for (let i = 0; i < length; i++) {
    let sum = 0
    for (let ch = 0; ch < channels; ch++) {
      sum += channelData[ch][i]
    }
    mono[i] = sum * scale
  }
  return mono
}

/**
 * Downsamples PCM data from one sample rate to another via wave-resampler.
 */
export function downsample(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return samples
  const resampled = resample(samples, fromRate, toRate)
  return new Float32Array(resampled)
}

/**
 * Estimates memory usage of a Float32Array in MB.
 */
export function estimateMemoryMb(samples: Float32Array): number {
  return samples.byteLength / (1024 * 1024)
}
