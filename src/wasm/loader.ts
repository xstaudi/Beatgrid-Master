import type { AudioCodec } from '@/types/audio'
import { isNativeCodec } from '@/types/audio'

// Unified decoder interface for all WASM decoders
export interface DecoderModule {
  decode(data: Uint8Array): DecodedAudio | Promise<DecodedAudio>
  free(): void
}

export interface DecodedAudio {
  channelData: Float32Array[]
  samplesDecoded: number
  sampleRate: number
}

// FFmpeg-based fallback decoder wrapper
interface FfmpegDecoder {
  sampleRate: number
  channelCount: number
  duration: number
  decodeAudioData(start?: number, duration?: number, options?: { multiChannel?: boolean }): Float32Array
  dispose(): void
}

const cache = new Map<string, DecoderModule>()
const loading = new Map<string, Promise<DecoderModule>>()

async function createNativeDecoder(codec: AudioCodec): Promise<DecoderModule> {
  switch (codec) {
    case 'mp3': {
      const { MPEGDecoder } = await import('mpg123-decoder')
      const decoder = new MPEGDecoder()
      await decoder.ready
      return {
        decode: (data: Uint8Array) => decoder.decode(data),
        free: () => decoder.free(),
      }
    }
    case 'flac': {
      const { FLACDecoder } = await import('@wasm-audio-decoders/flac')
      const decoder = new FLACDecoder()
      await decoder.ready
      return {
        decode: (data: Uint8Array) => decoder.decodeFile(data),
        free: () => decoder.free(),
      }
    }
    case 'ogg-vorbis': {
      const { OggVorbisDecoder } = await import('@wasm-audio-decoders/ogg-vorbis')
      const decoder = new OggVorbisDecoder()
      await decoder.ready
      return {
        decode: (data: Uint8Array) => decoder.decodeFile(data),
        free: () => decoder.free(),
      }
    }
    case 'ogg-opus': {
      const { OggOpusDecoder } = await import('ogg-opus-decoder')
      const decoder = new OggOpusDecoder()
      await decoder.ready
      return {
        decode: (data: Uint8Array) => decoder.decodeFile(data),
        free: () => decoder.free(),
      }
    }
    default:
      throw new Error(`No native decoder for codec: ${codec}`)
  }
}

/**
 * Resolve an absolute URL for a public asset, even inside blob: Workers.
 * Turbopack bundles Workers as blob: URLs where root-relative paths
 * (e.g. `/decode-audio.wasm`) can't be resolved by fetch().
 */
function resolvePublicUrl(path: string): string {
  try {
    const origin = self.location.origin
    if (origin && origin !== 'null') return `${origin}${path}`
  } catch { /* blob worker without valid location */ }

  try {
    const match = self.location.href.match(/^blob:(https?:\/\/[^/]+)/)
    if (match) return `${match[1]}${path}`
  } catch { /* no location at all */ }

  return `http://localhost:3000${path}`
}

async function createFfmpegDecoder(audioData: Uint8Array): Promise<DecoderModule> {
  const { getAudioDecoder } = await import('audio-file-decoder')
  const wasmPath = resolvePublicUrl('/decode-audio.wasm')
  const decoder: FfmpegDecoder = await getAudioDecoder(wasmPath, audioData.buffer as ArrayBuffer)

  return {
    decode: () => {
      const interleaved = decoder.decodeAudioData(0, -1, { multiChannel: false })
      return {
        channelData: [interleaved],
        samplesDecoded: interleaved.length,
        sampleRate: decoder.sampleRate,
      }
    },
    free: () => decoder.dispose(),
  }
}

/**
 * Gets a cached decoder for a given codec (native WASM decoders).
 * Deduplicates concurrent requests for the same codec.
 */
export async function getDecoder(codec: AudioCodec): Promise<DecoderModule> {
  const cached = cache.get(codec)
  if (cached) return cached

  const pending = loading.get(codec)
  if (pending) return pending

  const promise = createNativeDecoder(codec)
    .then((decoder) => {
      cache.set(codec, decoder)
      loading.delete(codec)
      return decoder
    })
    .catch((err) => {
      loading.delete(codec)
      throw err
    })

  loading.set(codec, promise)
  return promise
}

/**
 * Creates an FFmpeg fallback decoder for non-native codecs.
 * Not cached — one instance per file.
 */
export async function getFfmpegDecoder(audioData: Uint8Array): Promise<DecoderModule> {
  return createFfmpegDecoder(audioData)
}

/**
 * Releases a specific cached decoder, freeing WASM heap memory.
 */
export function releaseDecoder(codec: AudioCodec): void {
  const decoder = cache.get(codec)
  if (decoder) {
    decoder.free()
    cache.delete(codec)
  }
}

/**
 * Releases all cached decoders.
 */
export function releaseAllDecoders(): void {
  for (const decoder of cache.values()) {
    decoder.free()
  }
  cache.clear()
}

/**
 * Returns a list of currently loaded codec modules.
 */
export function getLoadedModules(): string[] {
  return Array.from(cache.keys())
}

export { isNativeCodec }
