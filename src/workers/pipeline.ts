import type { AudioCodec, DecodeResponse, BeatResponse, PcmData, RawBeatResult, PipelineConfig } from '@/types/audio'
import { getDefaultPipelineConfig } from '@/types/audio'
import { shouldThrottleWorkers } from '@/lib/audio/memory-monitor'

interface QueueItem {
  trackId: string
  audioData: ArrayBuffer
  codec: AudioCodec
}

type ProgressCallback = (trackId: string, percent: number) => void
type CompleteCallback = (trackId: string, pcm: PcmData) => void
type ErrorCallback = (trackId: string, error: string) => void
type StateCallback = (trackId: string, update: { status: string; phase?: string }) => void

export interface PipelineCallbacks {
  onProgress?: ProgressCallback
  onComplete?: CompleteCallback
  onError?: ErrorCallback
  onStateChange?: StateCallback
  getMemoryUsageMb?: () => number
}

export class DecodePipeline {
  private workers: Worker[] = []
  private idleWorkers: Set<number> = new Set()
  private queue: QueueItem[] = []
  private activeJobs = new Map<number, string>() // workerIndex → trackId
  private config: PipelineConfig
  private callbacks: PipelineCallbacks

  constructor(config?: Partial<PipelineConfig>, callbacks?: PipelineCallbacks) {
    this.config = { ...getDefaultPipelineConfig(), ...config }
    this.callbacks = callbacks ?? {}
  }

  /**
   * Spawns the worker pool. Waits for all workers to signal ready.
   */
  async init(): Promise<void> {
    const count = this.config.maxWorkers
    const readyPromises: Promise<void>[] = []

    for (let i = 0; i < count; i++) {
      const worker = new Worker(
        new URL('./decode-worker.ts', import.meta.url),
        { type: 'module' },
      )

      const readyPromise = new Promise<void>((resolve) => {
        const handler = (e: MessageEvent<DecodeResponse>) => {
          if (e.data.type === 'ready') {
            resolve()
          } else {
            this.handleWorkerMessage(i, e.data)
          }
        }
        worker.addEventListener('message', handler)
      })

      worker.onerror = (e) => {
        const trackId = this.activeJobs.get(i)
        if (trackId) {
          this.handleError(i, trackId, e.message || 'Worker error')
        }
      }

      this.workers.push(worker)
      readyPromises.push(readyPromise)
    }

    await Promise.all(readyPromises)
    for (let i = 0; i < count; i++) {
      this.idleWorkers.add(i)
    }
  }

  /**
   * Adds a track to the decode queue.
   */
  enqueue(trackId: string, audioData: ArrayBuffer, codec: AudioCodec): void {
    this.queue.push({ trackId, audioData, codec })
    this.dispatchNext()
  }

  /**
   * Terminates all workers immediately and cleans up.
   */
  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers = []
    this.idleWorkers.clear()
    this.queue = []
    this.activeJobs.clear()
  }

  private dispatchNext(): void {
    if (this.queue.length === 0) return

    // Memory throttling via injected callback
    if (this.callbacks.getMemoryUsageMb) {
      const currentMemory = this.callbacks.getMemoryUsageMb()
      if (shouldThrottleWorkers(this.config.memoryBudgetMb, currentMemory)) {
        if (this.activeJobs.size >= 1) return
      }
    }

    const workerIndex = this.getIdleWorker()
    if (workerIndex === null) return

    const item = this.queue.shift()!
    this.idleWorkers.delete(workerIndex)
    this.activeJobs.set(workerIndex, item.trackId)

    this.callbacks.onStateChange?.(item.trackId, { status: 'decoding', phase: 'loading' })

    this.workers[workerIndex].postMessage(
      {
        type: 'decode',
        trackId: item.trackId,
        audioData: item.audioData,
        codec: item.codec,
      },
      [item.audioData], // Transfer
    )
  }

  private getIdleWorker(): number | null {
    const first = this.idleWorkers.values().next()
    return first.done ? null : first.value
  }

  private handleWorkerMessage(workerIndex: number, msg: DecodeResponse): void {
    switch (msg.type) {
      case 'progress': {
        this.callbacks.onStateChange?.(msg.trackId, {
          status: msg.phase === 'processing' ? 'processing' : 'decoding',
          phase: msg.phase,
        })
        this.callbacks.onProgress?.(msg.trackId, msg.percent)
        break
      }

      case 'complete': {
        this.activeJobs.delete(workerIndex)
        this.idleWorkers.add(workerIndex)
        this.callbacks.onComplete?.(msg.trackId, msg.pcm)
        this.dispatchNext()
        break
      }

      case 'error': {
        this.handleError(workerIndex, msg.trackId, msg.message)
        break
      }

      case 'ready':
        break
    }
  }

  private handleError(workerIndex: number, trackId: string, message: string): void {
    this.activeJobs.delete(workerIndex)
    this.idleWorkers.add(workerIndex)
    this.callbacks.onError?.(trackId, message)
    this.dispatchNext()
  }
}

// --- Beat Analysis Pipeline ---

interface BeatQueueItem {
  trackId: string
  samples: Float32Array
  sampleRate: number
  stemSource?: 'mix' | 'drums'
}

type BeatProgressCallback = (trackId: string, percent: number) => void
type BeatCompleteCallback = (trackId: string, result: RawBeatResult) => void
type BeatErrorCallback = (trackId: string, error: string) => void
type BeatStateCallback = (trackId: string, update: { status: string; phase?: string }) => void

export interface BeatPipelineCallbacks {
  onProgress?: BeatProgressCallback
  onComplete?: BeatCompleteCallback
  onError?: BeatErrorCallback
  onStateChange?: BeatStateCallback
}

export class BeatPipeline {
  private workers: Worker[] = []
  private idleWorkers: Set<number> = new Set()
  private queue: BeatQueueItem[] = []
  private activeJobs = new Map<number, string>()
  private maxWorkers: number
  private callbacks: BeatPipelineCallbacks

  constructor(callbacks?: BeatPipelineCallbacks) {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4
    this.maxWorkers = Math.max(1, Math.floor((cores ?? 4) * 0.5))
    this.callbacks = callbacks ?? {}
  }

  async init(): Promise<void> {
    const count = this.maxWorkers
    const readyPromises: Promise<void>[] = []

    for (let i = 0; i < count; i++) {
      const worker = new Worker(
        new URL('./beat-worker.ts', import.meta.url),
        { type: 'module' },
      )

      const readyPromise = new Promise<void>((resolve) => {
        const handler = (e: MessageEvent<BeatResponse>) => {
          if (e.data.type === 'ready') {
            resolve()
          } else {
            this.handleWorkerMessage(i, e.data)
          }
        }
        worker.addEventListener('message', handler)
      })

      worker.onerror = (e) => {
        const trackId = this.activeJobs.get(i)
        if (trackId) {
          this.handleError(i, trackId, e.message || 'Beat worker error')
        }
      }

      this.workers.push(worker)
      readyPromises.push(readyPromise)
    }

    await Promise.all(readyPromises)
    for (let i = 0; i < count; i++) {
      this.idleWorkers.add(i)
    }
  }

  enqueue(trackId: string, samples: Float32Array, sampleRate: number, stemSource?: 'mix' | 'drums'): void {
    this.queue.push({ trackId, samples, sampleRate, stemSource })
    this.dispatchNext()
  }

  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers = []
    this.idleWorkers.clear()
    this.queue = []
    this.activeJobs.clear()
  }

  private dispatchNext(): void {
    if (this.queue.length === 0) return

    const workerIndex = this.getIdleWorker()
    if (workerIndex === null) return

    const item = this.queue.shift()!
    this.idleWorkers.delete(workerIndex)
    this.activeJobs.set(workerIndex, item.trackId)

    this.callbacks.onStateChange?.(item.trackId, { status: 'analyzing', phase: 'loading' })

    this.workers[workerIndex].postMessage(
      {
        type: 'analyze',
        trackId: item.trackId,
        samples: item.samples,
        sampleRate: item.sampleRate,
        stemSource: item.stemSource,
      },
      [item.samples.buffer],
    )
  }

  private getIdleWorker(): number | null {
    const first = this.idleWorkers.values().next()
    return first.done ? null : first.value
  }

  private handleWorkerMessage(workerIndex: number, msg: BeatResponse): void {
    switch (msg.type) {
      case 'progress': {
        this.callbacks.onStateChange?.(msg.trackId, {
          status: 'analyzing',
          phase: msg.phase,
        })
        this.callbacks.onProgress?.(msg.trackId, msg.percent)
        break
      }

      case 'complete': {
        this.activeJobs.delete(workerIndex)
        this.idleWorkers.add(workerIndex)
        this.callbacks.onComplete?.(msg.trackId, msg.result)
        this.dispatchNext()
        break
      }

      case 'error': {
        this.handleError(workerIndex, msg.trackId, msg.message)
        break
      }

      case 'ready':
        break
    }
  }

  private handleError(workerIndex: number, trackId: string, message: string): void {
    this.activeJobs.delete(workerIndex)
    this.idleWorkers.add(workerIndex)
    this.callbacks.onError?.(trackId, message)
    this.dispatchNext()
  }
}
