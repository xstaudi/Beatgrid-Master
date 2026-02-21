import { computeBandData } from '@/features/waveform/services/band-analyzer'
import type { WaveformWorkerRequest, WaveformWorkerResponse } from '@/features/waveform/types'

self.onmessage = (e: MessageEvent<WaveformWorkerRequest>) => {
  const msg = e.data
  if (msg.type !== 'compute') return

  try {
    const bandData = computeBandData(msg.samples, msg.sampleRate, msg.bucketCount)
    const response: WaveformWorkerResponse = {
      type: 'complete',
      trackId: msg.trackId,
      bandData,
    }
    self.postMessage(response)
  } catch (err) {
    const response: WaveformWorkerResponse = {
      type: 'error',
      trackId: msg.trackId,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
    self.postMessage(response)
  }
}
