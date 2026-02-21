import type { FingerprintRequest, FingerprintResponse, FingerprintPhase, RawFingerprintResult } from '@/types/audio'
import { downsample } from '@/lib/audio/pcm-utils'
import { generateFingerprint } from '@/wasm/chromaprint'

const TARGET_SAMPLE_RATE = 11025
const MAX_DURATION_SECONDS = 120

function post(msg: FingerprintResponse) {
  postMessage(msg)
}

function postProgress(trackId: string, phase: FingerprintPhase, percent: number) {
  post({ type: 'progress', trackId, phase, percent })
}

/**
 * Convert Float32 PCM [-1, 1] to Int16 PCM [-32768, 32767].
 */
function float32ToInt16(samples: Float32Array): Int16Array {
  const int16 = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    int16[i] = s < 0 ? s * 32768 : s * 32767
  }
  return int16
}

async function processTrack(trackId: string, samples: Float32Array, sampleRate: number) {
  try {
    postProgress(trackId, 'loading', 5)

    // Step 1: Downsample to 11025Hz
    postProgress(trackId, 'resampling', 10)
    let resampled = downsample(samples, sampleRate, TARGET_SAMPLE_RATE)

    // Step 2: Truncate to max 120s
    const maxSamples = MAX_DURATION_SECONDS * TARGET_SAMPLE_RATE
    if (resampled.length > maxSamples) {
      resampled = resampled.slice(0, maxSamples)
    }

    postProgress(trackId, 'resampling', 30)

    // Step 3: Convert Float32 to Int16
    const int16Samples = float32ToInt16(resampled)

    postProgress(trackId, 'fingerprinting', 40)

    // Step 4: Generate fingerprint via Chromaprint WASM
    const fingerprint = await generateFingerprint(int16Samples, TARGET_SAMPLE_RATE)

    postProgress(trackId, 'fingerprinting', 90)

    const duration = resampled.length / TARGET_SAMPLE_RATE

    const result: RawFingerprintResult = {
      trackId,
      fingerprint,
      duration,
    }

    postProgress(trackId, 'done', 100)
    post({ type: 'complete', trackId, result })
  } catch (err) {
    post({ type: 'error', trackId, message: err instanceof Error ? err.message : String(err) })
  }
}

self.onmessage = (event: MessageEvent<FingerprintRequest>) => {
  const msg = event.data
  switch (msg.type) {
    case 'fingerprint':
      processTrack(msg.trackId, msg.samples, msg.sampleRate)
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
