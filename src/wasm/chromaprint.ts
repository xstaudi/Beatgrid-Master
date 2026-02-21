import type { MainModule } from '@unimusic/chromaprint/dist/chromaprint'

let chromaprintModule: MainModule | null = null
let loadingPromise: Promise<void> | null = null

/**
 * Resolve an absolute URL for a public asset, even inside blob: Workers.
 * Turbopack bundles Workers as blob: URLs where root-relative paths
 * (e.g. `/chromaprint.wasm`) can't be resolved by fetch().
 */
function resolvePublicUrl(path: string): string {
  try {
    const origin = self.location.origin
    if (origin && origin !== 'null') {
      return `${origin}${path}`
    }
  } catch { /* blob worker without valid location */ }

  try {
    const match = self.location.href.match(/^blob:(https?:\/\/[^/]+)/)
    if (match) return `${match[1]}${path}`
  } catch { /* no location at all */ }

  return `http://localhost:3000${path}`
}

export async function getChromaprint(): Promise<MainModule> {
  if (chromaprintModule) return chromaprintModule

  if (!loadingPromise) {
    loadingPromise = (async () => {
      // Pre-fetch WASM binary to bypass Emscripten URL resolution in blob Workers.
      // Emscripten's internal fetch() can't resolve root-relative paths in blob: context.
      // Passing wasmBinary directly skips locateFile + fetch entirely.
      const wasmResponse = await fetch(resolvePublicUrl('/chromaprint.wasm'))
      if (!wasmResponse.ok) {
        throw new Error(`Failed to fetch chromaprint.wasm: ${wasmResponse.status}`)
      }
      const wasmBinary = await wasmResponse.arrayBuffer()

      const factory = (await import('@unimusic/chromaprint/dist/chromaprint.js')).default
      chromaprintModule = await factory({ wasmBinary })
    })()
  }

  await loadingPromise
  return chromaprintModule!
}

export function releaseChromaprint(): void {
  chromaprintModule = null
  loadingPromise = null
}

export function isChromaprintLoaded(): boolean {
  return chromaprintModule != null
}

/**
 * Generate a raw audio fingerprint from Int16 PCM samples.
 * Calls the low-level Chromaprint C API directly via WASM.
 *
 * @param samples - Mono Int16 PCM at targetSampleRate
 * @param sampleRate - Sample rate of the input (typically 11025)
 * @returns Raw fingerprint as Int32Array
 */
export async function generateFingerprint(
  samples: Int16Array,
  sampleRate: number,
): Promise<Int32Array> {
  const Module = await getChromaprint()

  // Algorithm 2 = Chromaprint default (Test2)
  const ctx = Module._chromaprint_new(2)
  if (!ctx) throw new Error('Failed to create Chromaprint context')

  try {
    if (!Module._chromaprint_start(ctx, sampleRate, 1)) {
      throw new Error('Failed to start Chromaprint')
    }

    // Allocate WASM memory and copy Int16 samples
    const bytesNeeded = samples.length * 2
    const dataPtr = Module._malloc(bytesNeeded)
    if (!dataPtr) throw new Error('Failed to allocate WASM memory')

    try {
      // HEAP16 uses 2-byte indices; malloc guarantees alignment
      Module.HEAP16.set(samples, dataPtr >> 1)

      if (!Module._chromaprint_feed(ctx, dataPtr, samples.length)) {
        throw new Error('Failed to feed audio data')
      }
    } finally {
      Module._free(dataPtr)
    }

    if (!Module._chromaprint_finish(ctx)) {
      throw new Error('Failed to finish fingerprinting')
    }

    // Get raw fingerprint
    const sizePtr = Module._malloc(4)
    const fpPtrPtr = Module._malloc(4)

    try {
      if (!Module._chromaprint_get_raw_fingerprint_size(ctx, sizePtr)) {
        throw new Error('Could not get fingerprint size')
      }
      // HEAP32 uses 4-byte indices; malloc guarantees 4-byte alignment
      const size = Module.HEAP32[sizePtr >> 2]
      if (size <= 0) throw new Error('Empty fingerprint')

      if (!Module._chromaprint_get_raw_fingerprint(ctx, fpPtrPtr, sizePtr)) {
        throw new Error('Could not get raw fingerprint')
      }

      const fpPtr = Module.HEAP32[fpPtrPtr >> 2]
      const fingerprint = new Int32Array(size)
      for (let i = 0; i < size; i++) {
        fingerprint[i] = Module.HEAP32[(fpPtr >> 2) + i]
      }

      Module._free(fpPtr)
      return fingerprint
    } finally {
      Module._free(sizePtr)
      Module._free(fpPtrPtr)
    }
  } finally {
    Module._chromaprint_free(ctx)
  }
}
