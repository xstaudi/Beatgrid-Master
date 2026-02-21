// --- Audio Codec Types ---

export type AudioCodec =
  | 'mp3'
  | 'flac'
  | 'ogg-vorbis'
  | 'ogg-opus'
  | 'aac'
  | 'm4a'
  | 'wav'
  | 'aiff'

export type DecoderType = 'wasm-native' | 'ffmpeg-fallback'

// --- PCM Data ---

export interface PcmData {
  samples: Float32Array
  sampleRate: number
  duration: number
  originalSampleRate: number
  originalChannels: number
  truePeakLinear?: number   // Pre-mix true peak aus allen Kanaelen (vor stereoToMono)
}

// --- Worker Message Protocol (Discriminated Unions) ---

export type DecodeRequest =
  | { type: 'decode'; trackId: string; audioData: ArrayBuffer; codec: AudioCodec }
  | { type: 'ping' }
  | { type: 'terminate' }

export type DecodeResponse =
  | { type: 'progress'; trackId: string; phase: DecodePhase; percent: number }
  | { type: 'complete'; trackId: string; pcm: PcmData }
  | { type: 'error'; trackId: string; message: string; fallbackAvailable: boolean }
  | { type: 'ready' }

export type DecodePhase = 'loading' | 'decoding' | 'processing'

// --- Beat Analysis ---

export type BeatAnalysisPhase = 'loading' | 'analyzing' | 'done'

export type BeatRequest =
  | { type: 'analyze'; trackId: string; samples: Float32Array; sampleRate: number }
  | { type: 'ping' }
  | { type: 'terminate' }

export type BeatResponse =
  | { type: 'progress'; trackId: string; phase: BeatAnalysisPhase; percent: number }
  | { type: 'complete'; trackId: string; result: RawBeatResult }
  | { type: 'error'; trackId: string; message: string }
  | { type: 'ready' }

export interface RawBeatResult {
  trackId: string
  beatTimestamps: number[]    // Sekunden
  bpmEstimate: number         // Globaler BPM-Durchschnitt
  segmentBpms: number[]       // BPM pro ~30s Segment
  avgConfidence: number       // 0-1
  sampleRate: number
  duration: number
}

// --- Key Analysis ---

export type KeyAnalysisPhase = 'loading' | 'analyzing' | 'done'

export type KeyRequest =
  | { type: 'analyze'; trackId: string; samples: Float32Array; sampleRate: number }
  | { type: 'ping' }
  | { type: 'terminate' }

export type KeyResponse =
  | { type: 'progress'; trackId: string; phase: KeyAnalysisPhase; percent: number }
  | { type: 'complete'; trackId: string; result: RawKeyResult }
  | { type: 'error'; trackId: string; message: string }
  | { type: 'ready' }

export interface RawKeyResult {
  trackId: string
  detectedKey: string         // "Am", "C", "F#m"
  scale: 'major' | 'minor'
  confidence: number          // 0-1
  camelot: string
  openKey: string
}

// --- Clipping Analysis ---

export type ClipAnalysisPhase = 'analyzing' | 'done'

export type ClipRequest =
  | { type: 'analyze'; trackId: string; samples: Float32Array; sampleRate: number; truePeakLinear?: number }
  | { type: 'ping' }
  | { type: 'terminate' }

export type ClipResponse =
  | { type: 'progress'; trackId: string; phase: ClipAnalysisPhase; percent: number }
  | { type: 'complete'; trackId: string; result: RawClipResult }
  | { type: 'error'; trackId: string; message: string }
  | { type: 'ready' }

export interface RawClipResult {
  trackId: string
  hasClipping: boolean
  clipCount: number
  totalClippedSamples: number
  peakLevelLinear: number       // 0.0-1.0
  peakLevelDb: number           // dBFS
  regions: { startTime: number; endTime: number; duration: number }[]
}

// --- Fingerprint Analysis ---

export type FingerprintPhase = 'loading' | 'resampling' | 'fingerprinting' | 'done'

export type FingerprintRequest =
  | { type: 'fingerprint'; trackId: string; samples: Float32Array; sampleRate: number }
  | { type: 'ping' }
  | { type: 'terminate' }

export type FingerprintResponse =
  | { type: 'progress'; trackId: string; phase: FingerprintPhase; percent: number }
  | { type: 'complete'; trackId: string; result: RawFingerprintResult }
  | { type: 'error'; trackId: string; message: string }
  | { type: 'ready' }

export interface RawFingerprintResult {
  trackId: string
  fingerprint: Int32Array
  duration: number
}

// --- Track Processing ---

export type TrackProcessingStatus =
  | 'queued'
  | 'decoding'
  | 'processing'
  | 'analyzing'
  | 'complete'
  | 'error'
  | 'skipped'

export interface TrackProcessingState {
  trackId: string
  status: TrackProcessingStatus
  progress: number // 0-100
  phase: DecodePhase | BeatAnalysisPhase | KeyAnalysisPhase | ClipAnalysisPhase | FingerprintPhase | null
  error: string | null
}

// --- Pipeline Config ---

export interface PipelineConfig {
  maxWorkers: number
  targetSampleRate: number
  memoryBudgetMb: number
}

export function getDefaultPipelineConfig(): PipelineConfig {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4
  return {
    maxWorkers: Math.max(1, Math.floor((cores ?? 4) * 0.75)),
    targetSampleRate: 22050,
    memoryBudgetMb: 256,
  }
}

// --- Helpers ---

const FILE_TYPE_CODEC_MAP: Record<string, AudioCodec> = {
  mp3: 'mp3',
  flac: 'flac',
  ogg: 'ogg-vorbis', // OGG container defaults to Vorbis; Opus uses .opus extension
  aac: 'aac',
  m4a: 'm4a',
  wav: 'wav',
  wave: 'wav',
  aif: 'aiff',
  aiff: 'aiff',
  alac: 'm4a',
}

export function codecFromFileType(fileType: string): AudioCodec | null {
  const normalized = fileType.toLowerCase().replace(/^\./, '')
  return FILE_TYPE_CODEC_MAP[normalized] ?? null
}

const NATIVE_CODECS: Set<AudioCodec> = new Set(['mp3', 'flac', 'ogg-vorbis', 'ogg-opus'])

export function isNativeCodec(codec: AudioCodec): boolean {
  return NATIVE_CODECS.has(codec)
}
