import type { BeatRequest, BeatResponse, BeatAnalysisPhase, RawBeatResult } from '@/types/audio'
import { getAubio, releaseAubio } from '@/wasm/aubio'
import { SEGMENT_DURATION_SECONDS } from '@/features/bpm/constants'
import { computeMultibandKickOnsets } from '@/lib/dsp/multiband-kick'
import { computeOnsetStrength } from '@/lib/dsp/onset-strength'
import { fuseBeats } from '@/lib/dsp/beat-fusion'
import { computeEnergyRating } from '@/features/beatgrid/services/energy-rating'

const HOP_SIZE = 256
const BUF_SIZE = 1024

function post(msg: BeatResponse, transfer?: Transferable[]) {
  postMessage(msg, { transfer })
}

function postProgress(trackId: string, phase: BeatAnalysisPhase, percent: number) {
  post({ type: 'progress', trackId, phase, percent })
}

async function analyze(trackId: string, samples: Float32Array, sampleRate: number, stemSource: 'mix' | 'drums' = 'mix') {
  try {
    // Phase 1: Load Aubio
    postProgress(trackId, 'loading', 5)
    const aubio = await getAubio()

    // Phase 2: Analyze beats
    postProgress(trackId, 'analyzing', 10)
    const tempo = new aubio.Tempo(BUF_SIZE, HOP_SIZE, sampleRate)

    const beatTimestamps: number[] = []
    const confidences: number[] = []
    const totalHops = Math.floor(samples.length / HOP_SIZE)
    const progressInterval = Math.max(1, Math.floor(totalHops / 10))

    for (let i = 0; i < totalHops; i++) {
      const hop = samples.subarray(i * HOP_SIZE, i * HOP_SIZE + HOP_SIZE)

      // Pad last hop if shorter than HOP_SIZE
      let input: Float32Array
      if (hop.length < HOP_SIZE) {
        input = new Float32Array(HOP_SIZE)
        input.set(hop)
      } else {
        input = hop
      }

      const isBeat = tempo.do(input)
      if (isBeat) {
        const timestamp = (i * HOP_SIZE) / sampleRate
        beatTimestamps.push(timestamp)
        confidences.push(tempo.getConfidence())
      }

      if (i % progressInterval === 0) {
        const percent = 10 + Math.round((i / totalHops) * 48)  // 10-58% fuer Aubio
        postProgress(trackId, 'analyzing', percent)
      }
    }

    postProgress(trackId, 'analyzing', 58)

    // Calculate segment BPMs
    const duration = samples.length / sampleRate
    const segmentBpms = computeSegmentBpms(beatTimestamps, duration)

    // Global BPM from aubio
    const bpmEstimate = tempo.getBpm()

    // Average confidence
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0

    // Phase 3: Onset-Strength + Multi-Band Kick (parallel im selben Worker)
    postProgress(trackId, 'analyzing', 60)
    const { peaks: onsetStrengthPeaks } = computeOnsetStrength(samples, sampleRate)

    postProgress(trackId, 'analyzing', 70)
    const multibandKickOnsets = computeMultibandKickOnsets(samples, sampleRate)

    // Phase 4: Beat Fusion
    postProgress(trackId, 'fusing', 80)
    const { fusedBeats, confidence: fusionConfidence } = fuseBeats({
      aubioBeats: beatTimestamps,
      onsetPeaks: onsetStrengthPeaks,
      kickOnsets: multibandKickOnsets,
      bpm: bpmEstimate,
    })

    // Phase 5: Energy-Rating + Kick-Onsets
    postProgress(trackId, 'analyzing', 92)
    const energyRating = computeEnergyRating(samples)

    const result: RawBeatResult = {
      trackId,
      beatTimestamps,
      bpmEstimate,
      segmentBpms,
      avgConfidence,
      sampleRate,
      duration,
      kickOnsets: multibandKickOnsets,
      onsetStrengthPeaks,
      multibandKickOnsets,
      fusedBeats,
      fusionConfidence,
      stemSource,
      energyRating,
    }

    postProgress(trackId, 'done', 100)
    post({ type: 'complete', trackId, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    post({ type: 'error', trackId, message })
  }
}

function computeSegmentBpms(beats: number[], duration: number): number[] {
  if (beats.length < 2) return []

  const segmentCount = Math.max(1, Math.ceil(duration / SEGMENT_DURATION_SECONDS))
  const segmentBpms: number[] = []

  for (let seg = 0; seg < segmentCount; seg++) {
    const segStart = seg * SEGMENT_DURATION_SECONDS
    const segEnd = segStart + SEGMENT_DURATION_SECONDS
    const segBeats = beats.filter((t) => t >= segStart && t < segEnd)

    if (segBeats.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < segBeats.length; i++) {
        intervals.push(segBeats[i] - segBeats[i - 1])
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      segmentBpms.push(60 / avgInterval)
    }
  }

  return segmentBpms
}

// Worker message handler
self.onmessage = (event: MessageEvent<BeatRequest>) => {
  const msg = event.data
  switch (msg.type) {
    case 'analyze':
      analyze(msg.trackId, msg.samples, msg.sampleRate, msg.stemSource)
      break
    case 'ping':
      post({ type: 'ready' })
      break
    case 'terminate':
      releaseAubio()
      self.close()
      break
  }
}

// Signal ready
post({ type: 'ready' })
