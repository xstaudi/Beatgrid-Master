import type { KeyRequest, KeyResponse, KeyAnalysisPhase, RawKeyResult } from '@/types/audio'
import { computeHpcp, DEFAULT_HPCP_CONFIG } from '@/lib/dsp/hpcp'
import { estimateKey } from '@/lib/dsp/key-estimation'
import { musicalToCamelot, musicalToOpenKey } from '@/features/key/services/key-notation'

function post(msg: KeyResponse) {
  postMessage(msg)
}

function postProgress(trackId: string, phase: KeyAnalysisPhase, percent: number) {
  post({ type: 'progress', trackId, phase, percent })
}

async function analyze(trackId: string, samples: Float32Array, sampleRate: number) {
  try {
    postProgress(trackId, 'analyzing', 10)

    const hpcp = computeHpcp(samples, { ...DEFAULT_HPCP_CONFIG, sampleRate })
    postProgress(trackId, 'analyzing', 80)

    const estimation = estimateKey(hpcp, 'edmm')

    const result: RawKeyResult = {
      trackId,
      detectedKey: estimation.key,
      scale: estimation.scale,
      confidence: estimation.confidence,
      camelot: musicalToCamelot(estimation.key) ?? '',
      openKey: musicalToOpenKey(estimation.key) ?? '',
    }

    postProgress(trackId, 'done', 100)
    post({ type: 'complete', trackId, result })
  } catch (err) {
    post({ type: 'error', trackId, message: err instanceof Error ? err.message : String(err) })
  }
}

self.onmessage = (event: MessageEvent<KeyRequest>) => {
  const msg = event.data
  switch (msg.type) {
    case 'analyze':
      analyze(msg.trackId, msg.samples, msg.sampleRate)
      break
    case 'ping':
      post({ type: 'ready' })
      break
    case 'terminate':
      self.close()
      break
  }
}

post({ type: 'ready' })
