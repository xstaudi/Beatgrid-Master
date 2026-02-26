/**
 * Demucs Pipeline: Sequenzielle Stem-Separation (1 Worker, RAM-begrenzt).
 * Folgt dem ClipPipeline-Pattern.
 */

import type { DemucsResponse } from '@/types/audio'
import { shouldThrottleWorkers, getMemorySnapshot } from '@/lib/audio/memory-monitor'

interface DemucsQueueItem {
  trackId: string
  samples: Float32Array
  sampleRate: number
}

export interface DemucsPipelineCallbacks {
  onProgress?: (trackId: string, percent: number) => void
  onComplete?: (trackId: string, drumStem: Float32Array, sampleRate: number) => void
  onError?: (trackId: string, error: string) => void
}

const DEMUCS_MEMORY_BUDGET_MB = 1500  // ~1.5 GB Budget fuer Demucs

export class DemucsPipeline {
  private worker: Worker | null = null
  private queue: DemucsQueueItem[] = []
  private activeTrackId: string | null = null
  private callbacks: DemucsPipelineCallbacks

  constructor(callbacks?: DemucsPipelineCallbacks) {
    this.callbacks = callbacks ?? {}
  }

  async init(): Promise<void> {
    const worker = new Worker(
      new URL('./demucs-worker.ts', import.meta.url),
      { type: 'module' },
    )

    const readyPromise = new Promise<void>((resolve) => {
      const handler = (e: MessageEvent<DemucsResponse>) => {
        if (e.data.type === 'ready') {
          resolve()
        } else {
          this.handleWorkerMessage(e.data)
        }
      }
      worker.addEventListener('message', handler)
    })

    worker.onerror = (e) => {
      if (this.activeTrackId) {
        this.handleError(this.activeTrackId, e.message || 'Demucs worker error')
      }
    }

    this.worker = worker
    await readyPromise
  }

  enqueue(trackId: string, samples: Float32Array, sampleRate: number): void {
    this.queue.push({ trackId, samples, sampleRate })
    this.dispatchNext()
  }

  terminate(): void {
    this.worker?.terminate()
    this.worker = null
    this.queue = []
    this.activeTrackId = null
  }

  private dispatchNext(): void {
    if (this.queue.length === 0 || !this.worker || this.activeTrackId) return

    // Memory-Check: Throttle wenn RAM knapp
    const snapshot = getMemorySnapshot()
    if (snapshot && shouldThrottleWorkers(DEMUCS_MEMORY_BUDGET_MB, snapshot.usedJSHeapSizeMb)) {
      // Retry nach kurzer Pause
      setTimeout(() => this.dispatchNext(), 2000)
      return
    }

    const item = this.queue.shift()!
    this.activeTrackId = item.trackId

    this.worker.postMessage(
      {
        type: 'separate',
        trackId: item.trackId,
        samples: item.samples,
        sampleRate: item.sampleRate,
      },
      [item.samples.buffer],
    )
  }

  private handleWorkerMessage(msg: DemucsResponse): void {
    switch (msg.type) {
      case 'progress': {
        this.callbacks.onProgress?.(msg.trackId, msg.percent)
        break
      }
      case 'complete': {
        this.activeTrackId = null
        this.callbacks.onComplete?.(msg.trackId, msg.drumStem, msg.sampleRate)
        this.dispatchNext()
        break
      }
      case 'error': {
        this.handleError(msg.trackId, msg.message)
        break
      }
      case 'ready':
        break
    }
  }

  private handleError(trackId: string, message: string): void {
    this.activeTrackId = null
    this.callbacks.onError?.(trackId, message)
    this.dispatchNext()
  }
}
