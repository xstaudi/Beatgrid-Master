import type { KeyResponse, ClipResponse, FingerprintResponse, RawKeyResult, RawClipResult, RawFingerprintResult } from '@/types/audio'

// --- Key Pipeline ---

interface KeyQueueItem {
  trackId: string
  samples: Float32Array
  sampleRate: number
}

export interface KeyPipelineCallbacks {
  onProgress?: (trackId: string, percent: number) => void
  onComplete?: (trackId: string, result: RawKeyResult) => void
  onError?: (trackId: string, error: string) => void
  onStateChange?: (trackId: string, update: { status: string; phase?: string }) => void
}

export class KeyPipeline {
  private workers: Worker[] = []
  private idleWorkers: Set<number> = new Set()
  private queue: KeyQueueItem[] = []
  private activeJobs = new Map<number, string>()
  private maxWorkers: number
  private callbacks: KeyPipelineCallbacks

  constructor(callbacks?: KeyPipelineCallbacks) {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4
    this.maxWorkers = Math.max(1, Math.floor((cores ?? 4) * 0.5))
    this.callbacks = callbacks ?? {}
  }

  async init(): Promise<void> {
    const count = this.maxWorkers
    const readyPromises: Promise<void>[] = []

    for (let i = 0; i < count; i++) {
      const worker = new Worker(
        new URL('./key-worker.ts', import.meta.url),
        { type: 'module' },
      )

      const readyPromise = new Promise<void>((resolve) => {
        const handler = (e: MessageEvent<KeyResponse>) => {
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
          this.handleError(i, trackId, e.message || 'Key worker error')
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

  enqueue(trackId: string, samples: Float32Array, sampleRate: number): void {
    this.queue.push({ trackId, samples, sampleRate })
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

    this.callbacks.onStateChange?.(item.trackId, { status: 'analyzing', phase: 'analyzing' })

    this.workers[workerIndex].postMessage(
      {
        type: 'analyze',
        trackId: item.trackId,
        samples: item.samples,
        sampleRate: item.sampleRate,
      },
      [item.samples.buffer],
    )
  }

  private getIdleWorker(): number | null {
    const first = this.idleWorkers.values().next()
    return first.done ? null : first.value
  }

  private handleWorkerMessage(workerIndex: number, msg: KeyResponse): void {
    switch (msg.type) {
      case 'progress': {
        this.callbacks.onStateChange?.(msg.trackId, { status: 'analyzing', phase: msg.phase })
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

// --- Clip Pipeline ---

interface ClipQueueItem {
  trackId: string
  samples: Float32Array
  sampleRate: number
}

export interface ClipPipelineCallbacks {
  onProgress?: (trackId: string, percent: number) => void
  onComplete?: (trackId: string, result: RawClipResult) => void
  onError?: (trackId: string, error: string) => void
  onStateChange?: (trackId: string, update: { status: string; phase?: string }) => void
}

export class ClipPipeline {
  private workers: Worker[] = []
  private idleWorkers: Set<number> = new Set()
  private queue: ClipQueueItem[] = []
  private activeJobs = new Map<number, string>()
  private callbacks: ClipPipelineCallbacks

  constructor(callbacks?: ClipPipelineCallbacks) {
    this.callbacks = callbacks ?? {}
  }

  async init(): Promise<void> {
    // Single worker — clipping detection is fast enough
    const worker = new Worker(
      new URL('./clip-worker.ts', import.meta.url),
      { type: 'module' },
    )

    const readyPromise = new Promise<void>((resolve) => {
      const handler = (e: MessageEvent<ClipResponse>) => {
        if (e.data.type === 'ready') {
          resolve()
        } else {
          this.handleWorkerMessage(0, e.data)
        }
      }
      worker.addEventListener('message', handler)
    })

    worker.onerror = (e) => {
      const trackId = this.activeJobs.get(0)
      if (trackId) {
        this.handleError(0, trackId, e.message || 'Clip worker error')
      }
    }

    this.workers.push(worker)
    await readyPromise
    this.idleWorkers.add(0)
  }

  enqueue(trackId: string, samples: Float32Array, sampleRate: number): void {
    this.queue.push({ trackId, samples, sampleRate })
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

    this.callbacks.onStateChange?.(item.trackId, { status: 'analyzing', phase: 'analyzing' })

    this.workers[workerIndex].postMessage(
      {
        type: 'analyze',
        trackId: item.trackId,
        samples: item.samples,
        sampleRate: item.sampleRate,
      },
      [item.samples.buffer],
    )
  }

  private getIdleWorker(): number | null {
    const first = this.idleWorkers.values().next()
    return first.done ? null : first.value
  }

  private handleWorkerMessage(workerIndex: number, msg: ClipResponse): void {
    switch (msg.type) {
      case 'progress': {
        this.callbacks.onStateChange?.(msg.trackId, { status: 'analyzing', phase: msg.phase })
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

// --- Fingerprint Pipeline ---

interface FingerprintQueueItem {
  trackId: string
  samples: Float32Array
  sampleRate: number
}

export interface FingerprintPipelineCallbacks {
  onProgress?: (trackId: string, percent: number) => void
  onComplete?: (trackId: string, result: RawFingerprintResult) => void
  onError?: (trackId: string, error: string) => void
  onStateChange?: (trackId: string, update: { status: string; phase?: string }) => void
}

export class FingerprintPipeline {
  private workers: Worker[] = []
  private idleWorkers: Set<number> = new Set()
  private queue: FingerprintQueueItem[] = []
  private activeJobs = new Map<number, string>()
  private maxWorkers: number
  private callbacks: FingerprintPipelineCallbacks

  constructor(callbacks?: FingerprintPipelineCallbacks) {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4
    this.maxWorkers = Math.max(1, Math.floor((cores ?? 4) * 0.25))
    this.callbacks = callbacks ?? {}
  }

  async init(): Promise<void> {
    const count = this.maxWorkers
    const readyPromises: Promise<void>[] = []

    for (let i = 0; i < count; i++) {
      const worker = new Worker(
        new URL('./fingerprint-worker.ts', import.meta.url),
        { type: 'module' },
      )

      const readyPromise = new Promise<void>((resolve) => {
        const handler = (e: MessageEvent<FingerprintResponse>) => {
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
          this.handleError(i, trackId, e.message || 'Fingerprint worker error')
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

  enqueue(trackId: string, samples: Float32Array, sampleRate: number): void {
    this.queue.push({ trackId, samples, sampleRate })
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

    this.callbacks.onStateChange?.(item.trackId, { status: 'analyzing', phase: 'fingerprinting' })

    this.workers[workerIndex].postMessage(
      {
        type: 'fingerprint',
        trackId: item.trackId,
        samples: item.samples,
        sampleRate: item.sampleRate,
      },
      [item.samples.buffer],
    )
  }

  private getIdleWorker(): number | null {
    const first = this.idleWorkers.values().next()
    return first.done ? null : first.value
  }

  private handleWorkerMessage(workerIndex: number, msg: FingerprintResponse): void {
    switch (msg.type) {
      case 'progress': {
        this.callbacks.onStateChange?.(msg.trackId, { status: 'analyzing', phase: msg.phase })
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
