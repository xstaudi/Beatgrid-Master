import type { ClipRequest, ClipResponse, ClipAnalysisPhase, RawClipResult } from '@/types/audio'
import { CLIP_THRESHOLD, MIN_CONSECUTIVE_SAMPLES } from '@/features/clipping/constants'

function post(msg: ClipResponse) {
  postMessage(msg)
}

function postProgress(trackId: string, phase: ClipAnalysisPhase, percent: number) {
  post({ type: 'progress', trackId, phase, percent })
}

async function analyze(trackId: string, samples: Float32Array, sampleRate: number) {
  try {
    postProgress(trackId, 'analyzing', 10)

    let peakLevel = 0
    let consecutiveClips = 0
    let clipRegionStart = -1
    const regions: { startTime: number; endTime: number; duration: number }[] = []
    let totalClippedSamples = 0
    const progressInterval = Math.max(1, Math.floor(samples.length / 10))

    for (let i = 0; i < samples.length; i++) {
      const absVal = Math.abs(samples[i])

      if (absVal > peakLevel) peakLevel = absVal

      if (absVal >= CLIP_THRESHOLD) {
        consecutiveClips++
        if (consecutiveClips === MIN_CONSECUTIVE_SAMPLES) {
          clipRegionStart = i - MIN_CONSECUTIVE_SAMPLES + 1
        }
        if (consecutiveClips >= MIN_CONSECUTIVE_SAMPLES) {
          totalClippedSamples++
        }
      } else {
        if (consecutiveClips >= MIN_CONSECUTIVE_SAMPLES && clipRegionStart >= 0) {
          const startTime = clipRegionStart / sampleRate
          const endTime = i / sampleRate
          regions.push({ startTime, endTime, duration: endTime - startTime })
        }
        consecutiveClips = 0
        clipRegionStart = -1
      }

      if (i % progressInterval === 0) {
        postProgress(trackId, 'analyzing', 10 + Math.round((i / samples.length) * 80))
      }
    }

    // Close last region if still clipping at end
    if (consecutiveClips >= MIN_CONSECUTIVE_SAMPLES && clipRegionStart >= 0) {
      const startTime = clipRegionStart / sampleRate
      const endTime = samples.length / sampleRate
      regions.push({ startTime, endTime, duration: endTime - startTime })
    }

    const peakLevelDb = peakLevel > 0 ? 20 * Math.log10(peakLevel) : -Infinity

    const result: RawClipResult = {
      trackId,
      hasClipping: regions.length > 0,
      clipCount: regions.length,
      totalClippedSamples,
      peakLevelLinear: peakLevel,
      peakLevelDb,
      regions,
    }

    postProgress(trackId, 'done', 100)
    post({ type: 'complete', trackId, result })
  } catch (err) {
    post({ type: 'error', trackId, message: err instanceof Error ? err.message : String(err) })
  }
}

self.onmessage = (event: MessageEvent<ClipRequest>) => {
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
