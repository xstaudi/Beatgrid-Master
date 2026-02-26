/**
 * Demucs Stem-Separation Worker.
 * Isoliert die Drum-Spur fuer praezisere Beat-Detection.
 */

import type { DemucsRequest, DemucsResponse } from '@/types/audio'
import { getDemucs, releaseDemucs } from '@/wasm/demucs'

function post(msg: DemucsResponse, transfer?: Transferable[]) {
  postMessage(msg, { transfer })
}

async function separate(trackId: string, samples: Float32Array, sampleRate: number) {
  try {
    // Phase 1: Model laden (0-30%)
    post({ type: 'progress', trackId, phase: 'loading-model', percent: 10 })
    const demucs = await getDemucs((percent) => {
      post({ type: 'progress', trackId, phase: 'loading-model', percent: Math.round(percent * 0.3) })
    })

    // Phase 2: Stem-Separation (30-95%)
    post({ type: 'progress', trackId, phase: 'separating', percent: 35 })
    const result = await demucs.separate(samples, sampleRate)

    // Phase 3: Transfer (95-100%)
    post({ type: 'progress', trackId, phase: 'separating', percent: 95 })

    const drumStem = result.drums
    post(
      { type: 'complete', trackId, drumStem, sampleRate },
      [drumStem.buffer],
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    post({ type: 'error', trackId, message })
  }
}

// Worker message handler
self.onmessage = (event: MessageEvent<DemucsRequest>) => {
  const msg = event.data
  switch (msg.type) {
    case 'separate':
      separate(msg.trackId, msg.samples, msg.sampleRate)
      break
    case 'ping':
      post({ type: 'ready' })
      break
    case 'terminate':
      releaseDemucs()
      self.close()
      break
  }
}

// Signal ready
post({ type: 'ready' })
