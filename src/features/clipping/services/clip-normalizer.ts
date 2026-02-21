import { Mp3Encoder } from 'lamejs'

export interface NormalizeResult {
  buffer: Uint8Array
  fileName: string
  mimeType: string
}

/**
 * Peak-Normalisierung einer Audio-Datei auf targetPeakDb.
 *
 * Dekodierung via AudioContext (browser built-in).
 * MP3-Output via lamejs, alle anderen Formate als WAV.
 */
export async function normalizeClipping(
  file: File,
  peakLevelLinear: number,
  targetPeakDb = -0.1,
): Promise<NormalizeResult> {
  if (peakLevelLinear <= 0) {
    throw new Error('peakLevelLinear muss > 0 sein')
  }

  const arrayBuffer = await file.arrayBuffer()
  const ctx = new AudioContext()
  let audioBuffer: AudioBuffer
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer)
  } finally {
    await ctx.close()
  }

  const targetPeakLinear = Math.pow(10, targetPeakDb / 20)
  const gainFactor = targetPeakLinear / peakLevelLinear

  const channels = audioBuffer.numberOfChannels
  const channelData: Float32Array[] = []
  for (let ch = 0; ch < channels; ch++) {
    const data = audioBuffer.getChannelData(ch)
    const out = new Float32Array(data.length)
    for (let i = 0; i < data.length; i++) {
      out[i] = Math.max(-1, Math.min(1, data[i] * gainFactor))
    }
    channelData.push(out)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'mp3') {
    const buffer = encodeToMp3(channelData, audioBuffer.sampleRate)
    const stem = file.name.replace(/\.mp3$/i, '')
    return { buffer, fileName: `${stem}-normalized.mp3`, mimeType: 'audio/mpeg' }
  }

  const buffer = encodeToWav(channelData, audioBuffer.sampleRate)
  const stem = file.name.replace(/\.[^.]+$/, '')
  return { buffer, fileName: `${stem}-normalized.wav`, mimeType: 'audio/wav' }
}

function float32ToInt16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    out[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)))
  }
  return out
}

function encodeToMp3(channelData: Float32Array[], sampleRate: number): Uint8Array {
  const numChannels = Math.min(channelData.length, 2) as 1 | 2
  const encoder = new Mp3Encoder(numChannels, sampleRate, 320)
  const chunks: Uint8Array[] = []
  const blockSize = 1152

  const left = float32ToInt16(channelData[0])
  const right = numChannels === 2 ? float32ToInt16(channelData[1]) : undefined

  for (let i = 0; i < left.length; i += blockSize) {
    const l = left.subarray(i, i + blockSize)
    const chunk = right
      ? encoder.encodeBuffer(l, right.subarray(i, i + blockSize))
      : encoder.encodeBuffer(l)
    if (chunk.length > 0) chunks.push(new Uint8Array(chunk.buffer))
  }

  const tail = encoder.flush()
  if (tail.length > 0) chunks.push(new Uint8Array(tail.buffer))

  return concatUint8Arrays(chunks)
}

function encodeToWav(channelData: Float32Array[], sampleRate: number): Uint8Array {
  const numChannels = channelData.length
  const numSamples = channelData[0].length
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = numSamples * numChannels * (bitsPerSample / 8)
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-32768, Math.min(32767, Math.round(channelData[ch][i] * 32767)))
      view.setInt16(offset, sample, true)
      offset += 2
    }
  }

  return new Uint8Array(buffer)
}

function writeString(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i))
  }
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}
