import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDecoder, releaseDecoder, releaseAllDecoders, getLoadedModules } from './loader'

// Mock decoder classes (must be constructable)
vi.mock('mpg123-decoder', () => ({
  MPEGDecoder: class {
    ready = Promise.resolve()
    decode() {
      return {
        channelData: [new Float32Array(100)],
        samplesDecoded: 100,
        sampleRate: 44100,
      }
    }
    free() {}
  },
}))

vi.mock('@wasm-audio-decoders/flac', () => ({
  FLACDecoder: class {
    ready = Promise.resolve()
    decodeFile() {
      return Promise.resolve({
        channelData: [new Float32Array(100)],
        samplesDecoded: 100,
        sampleRate: 44100,
      })
    }
    free() {}
  },
}))

vi.mock('@wasm-audio-decoders/ogg-vorbis', () => ({
  OggVorbisDecoder: class {
    ready = Promise.resolve()
    decodeFile() {
      return Promise.resolve({
        channelData: [new Float32Array(100)],
        samplesDecoded: 100,
        sampleRate: 44100,
      })
    }
    free() {}
  },
}))

vi.mock('ogg-opus-decoder', () => ({
  OggOpusDecoder: class {
    ready = Promise.resolve()
    decodeFile() {
      return Promise.resolve({
        channelData: [new Float32Array(100)],
        samplesDecoded: 100,
        sampleRate: 48000,
      })
    }
    free() {}
  },
}))

beforeEach(() => {
  releaseAllDecoders()
})

describe('getDecoder', () => {
  it('loads and caches an MP3 decoder', async () => {
    const decoder = await getDecoder('mp3')
    expect(decoder).toBeDefined()
    expect(decoder.decode).toBeDefined()
    expect(decoder.free).toBeDefined()
    expect(getLoadedModules()).toContain('mp3')
  })

  it('returns cached decoder on second call', async () => {
    const first = await getDecoder('mp3')
    const second = await getDecoder('mp3')
    expect(first).toBe(second)
  })

  it('deduplicates concurrent requests', async () => {
    const [a, b] = await Promise.all([getDecoder('flac'), getDecoder('flac')])
    expect(a).toBe(b)
  })

  it('loads different codecs independently', async () => {
    await getDecoder('mp3')
    await getDecoder('flac')
    expect(getLoadedModules()).toContain('mp3')
    expect(getLoadedModules()).toContain('flac')
  })
})

describe('releaseDecoder', () => {
  it('removes a specific decoder from cache', async () => {
    await getDecoder('mp3')
    releaseDecoder('mp3')
    expect(getLoadedModules()).not.toContain('mp3')
  })

  it('does nothing for unloaded codec', () => {
    expect(() => releaseDecoder('wav')).not.toThrow()
  })
})

describe('releaseAllDecoders', () => {
  it('clears all cached decoders', async () => {
    await getDecoder('mp3')
    await getDecoder('flac')
    releaseAllDecoders()
    expect(getLoadedModules()).toEqual([])
  })
})
