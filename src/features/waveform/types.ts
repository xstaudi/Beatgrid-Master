export interface BpmSegment {
  startTime: number
  endTime: number
  bpm: number
}

export interface WaveformBandBucket {
  min: number
  max: number
  low: number
  mid: number
  high: number
}

export interface WaveformBandData {
  buckets: WaveformBandBucket[]
  sampleRate: number
  duration: number
}

export type WaveformWorkerRequest =
  | { type: 'compute'; trackId: string; samples: Float32Array; sampleRate: number; bucketCount: number }

export type WaveformWorkerResponse =
  | { type: 'complete'; trackId: string; bandData: WaveformBandData }
  | { type: 'error'; trackId: string; message: string }
