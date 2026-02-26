/**
 * Demucs ONNX Runtime Loader (Lazy-Load, Singleton).
 * Laedt das Demucs Stem-Separation Modell via ONNX Runtime Web.
 */

import * as ort from 'onnxruntime-web'
import { resample } from 'wave-resampler'

// --- Constants ---

const DEMUCS_SAMPLE_RATE = 44100
const CHUNK_SECONDS = 10
const OVERLAP_SECONDS = 0.5
const CACHE_NAME = 'beatgrid-demucs-v1'
const DEFAULT_MODEL_URL =
  'https://huggingface.co/webai-community/models/resolve/main/demucs.onnx'

/** Drums = Index 0 in Demucs Output (drums, bass, other, vocals) */
const DRUMS_STEM_INDEX = 0

// --- Types ---

export interface DemucsModule {
  separate(samples: Float32Array, sampleRate: number): Promise<{
    drums: Float32Array
  }>
}

type ProgressCallback = (percent: number) => void

// --- Singleton State ---

let demucsModule: DemucsModule | null = null
let loadingPromise: Promise<DemucsModule> | null = null
let ortSession: ort.InferenceSession | null = null
let detectedChannels: number | null = null

// --- Public API ---

/**
 * Laedt das Demucs ONNX-Modell (einmalig pro Session).
 * Model-Weights (~170 MB) werden beim ersten Aufruf heruntergeladen und gecached.
 */
export async function getDemucs(onProgress?: ProgressCallback): Promise<DemucsModule> {
  if (demucsModule) return demucsModule

  if (!loadingPromise) {
    loadingPromise = initDemucs(onProgress).catch((err) => {
      loadingPromise = null
      throw err
    })
  }

  demucsModule = await loadingPromise
  return demucsModule
}

export function releaseDemucs(): void {
  ortSession?.release()
  ortSession = null
  demucsModule = null
  loadingPromise = null
  detectedChannels = null
}

export function isDemucsLoaded(): boolean {
  return demucsModule != null
}

// --- URL Resolution (blob:-Worker-kompatibel) ---

function resolvePublicUrl(path: string): string {
  try {
    const origin = self.location.origin
    if (origin && origin !== 'null') return `${origin}${path}`
  } catch { /* blob worker */ }

  try {
    const match = self.location.href.match(/^blob:(https?:\/\/[^/]+)/)
    if (match) return `${match[1]}${path}`
  } catch { /* no location */ }

  return `http://localhost:3000${path}`
}

function getModelUrl(): string {
  try {
    const envUrl = process.env.NEXT_PUBLIC_DEMUCS_MODEL_URL
    if (envUrl) return envUrl
  } catch { /* Worker context */ }
  return DEFAULT_MODEL_URL
}

// --- ORT Configuration ---

function configureOrt(): void {
  ort.env.wasm.wasmPaths = resolvePublicUrl('/onnx/')
  ort.env.wasm.proxy = false
  ort.env.wasm.numThreads = 1
  ort.env.wasm.simd = true
}

// --- Model Loading with Cache API ---

async function loadModelWithCache(onProgress?: ProgressCallback): Promise<ArrayBuffer> {
  const modelUrl = getModelUrl()

  // Cache API first (persistiert zwischen Sessions)
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(modelUrl)
      if (cached) {
        onProgress?.(100)
        return cached.arrayBuffer()
      }
    } catch { /* Cache API nicht verfuegbar */ }
  }

  // Streaming-Download mit Progress
  const response = await fetch(modelUrl, { mode: 'cors' })
  if (!response.ok) {
    throw new Error(`Demucs Modell-Download fehlgeschlagen: HTTP ${response.status}`)
  }

  const contentLength = Number(response.headers.get('content-length') || 0)
  const reader = response.body?.getReader()

  if (!reader) {
    const buffer = await response.arrayBuffer()
    onProgress?.(100)
    return buffer
  }

  const chunks: Uint8Array[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (contentLength > 0) {
      onProgress?.(Math.round((received / contentLength) * 100))
    }
  }

  const buffer = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.length
  }

  // In Cache speichern fuer naechste Session
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(modelUrl, new Response(buffer.slice()))
    } catch { /* Cache-Write fehlgeschlagen — nicht kritisch */ }
  }

  return buffer.buffer
}

// --- Initialization ---

async function initDemucs(onProgress?: ProgressCallback): Promise<DemucsModule> {
  configureOrt()

  // Phase 1: Modell laden (0-80%)
  const modelBuffer = await loadModelWithCache((percent) => {
    onProgress?.(percent * 0.8)
  })

  // Phase 2: ONNX Session erstellen (80-95%)
  onProgress?.(82)
  const session = await ort.InferenceSession.create(
    new Uint8Array(modelBuffer),
    { executionProviders: ['wasm'] },
  )
  ortSession = session

  console.log('[Demucs] Session erstellt')
  console.log('[Demucs] Inputs:', session.inputNames)
  console.log('[Demucs] Outputs:', session.outputNames)

  onProgress?.(100)

  return {
    async separate(samples: Float32Array, sampleRate: number) {
      const drums = await runInference(session, samples, sampleRate)
      return { drums }
    },
  }
}

// --- Chunk Inference ---

async function inferChunk(
  session: ort.InferenceSession,
  chunk: Float32Array,
  channels: number,
): Promise<Float32Array> {
  const chunkSize = chunk.length

  // Input: Mono duplizieren fuer Stereo-Modell
  let inputData: Float32Array
  if (channels === 2) {
    inputData = new Float32Array(2 * chunkSize)
    inputData.set(chunk, 0)
    inputData.set(chunk, chunkSize)
  } else {
    inputData = chunk
  }

  const inputTensor = new ort.Tensor('float32', inputData, [1, channels, chunkSize])
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: inputTensor }
  const results = await session.run(feeds)
  const outputTensor = results[session.outputNames[0]]
  const outputData = outputTensor.data as Float32Array
  const dims = outputTensor.dims

  // Output parsen: 4D (stereo) oder 3D (mono)
  if (dims.length === 4) {
    // [batch, stems=4, channels, samples]
    const stemChannels = Number(dims[2])
    const stemSamples = Number(dims[3])
    const offset = DRUMS_STEM_INDEX * stemChannels * stemSamples
    const drums = new Float32Array(stemSamples)
    for (let ch = 0; ch < stemChannels; ch++) {
      for (let i = 0; i < stemSamples; i++) {
        drums[i] += outputData[offset + ch * stemSamples + i]
      }
    }
    for (let i = 0; i < stemSamples; i++) {
      drums[i] /= stemChannels
    }
    return drums
  }

  if (dims.length === 3) {
    // [batch, stems=4, samples]
    const stemSamples = Number(dims[2])
    const offset = DRUMS_STEM_INDEX * stemSamples
    return outputData.slice(offset, offset + stemSamples)
  }

  throw new Error(`Unerwartete Demucs Output-Shape: [${dims.join(', ')}]`)
}

// --- Full Inference Pipeline ---

async function runInference(
  session: ort.InferenceSession,
  samples: Float32Array,
  sampleRate: number,
): Promise<Float32Array> {
  // Resample auf 44100 Hz (Demucs-Erwartung)
  let input44k: Float32Array
  if (sampleRate !== DEMUCS_SAMPLE_RATE) {
    input44k = new Float32Array(resample(samples, sampleRate, DEMUCS_SAMPLE_RATE))
  } else {
    input44k = samples
  }

  const totalSamples = input44k.length
  const chunkSize = CHUNK_SECONDS * DEMUCS_SAMPLE_RATE
  const overlapSize = Math.round(OVERLAP_SECONDS * DEMUCS_SAMPLE_RATE)
  const stepSize = chunkSize - 2 * overlapSize

  const output = new Float32Array(totalSamples)
  const weights = new Float32Array(totalSamples)

  for (let pos = 0; pos < totalSamples; pos += stepSize) {
    const chunkStart = Math.max(0, pos - overlapSize)
    const chunkEnd = Math.min(totalSamples, chunkStart + chunkSize)
    const actualLen = chunkEnd - chunkStart

    const paddedChunk = new Float32Array(chunkSize)
    paddedChunk.set(input44k.subarray(chunkStart, chunkEnd))

    // Auto-Detection: Stereo (Standard htdemucs) → Mono Fallback
    if (detectedChannels === null) {
      try {
        const drums = await inferChunk(session, paddedChunk, 2)
        detectedChannels = 2
        applyOverlapAdd(output, weights, drums, chunkStart, actualLen)
        continue
      } catch {
        const drums = await inferChunk(session, paddedChunk, 1)
        detectedChannels = 1
        applyOverlapAdd(output, weights, drums, chunkStart, actualLen)
        continue
      }
    }

    const drums = await inferChunk(session, paddedChunk, detectedChannels)
    applyOverlapAdd(output, weights, drums, chunkStart, actualLen)
  }

  // Overlap-Add normalisieren
  for (let i = 0; i < totalSamples; i++) {
    if (weights[i] > 0) output[i] /= weights[i]
  }

  // Zurueck-Resample auf Original-Samplerate
  if (sampleRate !== DEMUCS_SAMPLE_RATE) {
    return new Float32Array(resample(output, DEMUCS_SAMPLE_RATE, sampleRate))
  }

  return output
}

function applyOverlapAdd(
  output: Float32Array,
  weights: Float32Array,
  chunk: Float32Array,
  start: number,
  length: number,
): void {
  for (let i = 0; i < length; i++) {
    output[start + i] += chunk[i]
    weights[start + i] += 1
  }
}
