import { useCallback, useRef } from 'react'
import { useTrackStore } from '@/stores/track-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useProcessingStore } from '@/stores/processing-store'
import type { RawBeatResult, RawKeyResult, RawClipResult, RawFingerprintResult } from '@/types/audio'
import { BeatPipeline } from '@/workers/pipeline'
import { KeyPipeline, ClipPipeline, FingerprintPipeline } from '@/workers/analysis-pipelines'

export function useAnalysisPipelines() {
  const { updateTrackState } = useProcessingStore()
  const { storeRawBeatResult, storeRawKeyResult, storeRawClipResult, storeFingerprintResult } = useAnalysisStore()

  const beatPipelineRef = useRef<BeatPipeline | null>(null)
  const keyPipelineRef = useRef<KeyPipeline | null>(null)
  const clipPipelineRef = useRef<ClipPipeline | null>(null)
  const fingerprintPipelineRef = useRef<FingerprintPipeline | null>(null)
  const expectedBeatCountRef = useRef(0)
  const beatResultCountRef = useRef(0)
  const activePipelinesRef = useRef(0)
  const completedPipelinesRef = useRef(0)

  const checkAllPipelinesComplete = useCallback(() => {
    completedPipelinesRef.current++
    if (completedPipelinesRef.current >= activePipelinesRef.current) {
      const currentTracks = useTrackStore.getState().getActiveTracks()
      useAnalysisStore.getState().finalizeAudioAnalysis(currentTracks)
    }
  }, [])

  const startAnalysisPipelines = useCallback(async () => {
    const { pcmCache: cache } = useProcessingStore.getState()
    const audioTrackIds = Array.from(cache.keys())

    if (audioTrackIds.length === 0) {
      const currentTracks = useTrackStore.getState().getActiveTracks()
      useAnalysisStore.getState().finalizeAudioAnalysis(currentTracks)
      return
    }

    const { config } = useAnalysisStore.getState()
    const needsBeat = config.checks.some((c) => c === 'beatgrid' || c === 'bpm')
    const needsKey = config.checks.includes('key')
    const needsClip = config.checks.includes('clipping')
    const needsFingerprint = config.checks.includes('duplicates')

    activePipelinesRef.current = [needsBeat, needsKey, needsClip, needsFingerprint].filter(Boolean).length
    completedPipelinesRef.current = 0

    if (activePipelinesRef.current === 0) {
      const currentTracks = useTrackStore.getState().getActiveTracks()
      useAnalysisStore.getState().finalizeAudioAnalysis(currentTracks)
      return
    }

    // Beat Pipeline
    if (needsBeat) {
      expectedBeatCountRef.current = audioTrackIds.length
      beatResultCountRef.current = 0

      const beatPipeline = new BeatPipeline({
        onProgress: (trackId, percent) => {
          updateTrackState(trackId, { progress: percent })
        },
        onComplete: (trackId, result: RawBeatResult) => {
          storeRawBeatResult(trackId, result)
          updateTrackState(trackId, { status: 'complete', progress: 100 })
          beatResultCountRef.current++
          if (beatResultCountRef.current >= expectedBeatCountRef.current) {
            beatPipeline.terminate()
            beatPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
        onError: (trackId, error) => {
          updateTrackState(trackId, { status: 'error', error })
          beatResultCountRef.current++
          if (beatResultCountRef.current >= expectedBeatCountRef.current) {
            beatPipeline.terminate()
            beatPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
        onStateChange: (trackId, update) => {
          updateTrackState(trackId, {
            status: update.status as 'analyzing',
            phase: update.phase as 'loading' | 'analyzing' | 'done',
          })
        },
      })

      beatPipelineRef.current = beatPipeline
      await beatPipeline.init()

      for (const trackId of audioTrackIds) {
        const pcm = cache.get(trackId)
        if (!pcm) continue
        beatPipeline.enqueue(trackId, pcm.samples.slice(), pcm.sampleRate)
      }
    }

    // Key Pipeline
    if (needsKey) {
      let keyResultCount = 0
      const expectedKeyCount = audioTrackIds.length

      const keyPipeline = new KeyPipeline({
        onComplete: (trackId, result: RawKeyResult) => {
          storeRawKeyResult(trackId, result)
          keyResultCount++
          if (keyResultCount >= expectedKeyCount) {
            keyPipeline.terminate()
            keyPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
        onError: (trackId, error) => {
          updateTrackState(trackId, { status: 'error', error })
          keyResultCount++
          if (keyResultCount >= expectedKeyCount) {
            keyPipeline.terminate()
            keyPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
      })

      keyPipelineRef.current = keyPipeline
      await keyPipeline.init()

      for (const trackId of audioTrackIds) {
        const pcm = cache.get(trackId)
        if (!pcm) continue
        keyPipeline.enqueue(trackId, pcm.samples.slice(), pcm.sampleRate)
      }
    }

    // Clip Pipeline
    if (needsClip) {
      let clipResultCount = 0
      const expectedClipCount = audioTrackIds.length

      const clipPipeline = new ClipPipeline({
        onComplete: (trackId, result: RawClipResult) => {
          storeRawClipResult(trackId, result)
          clipResultCount++
          if (clipResultCount >= expectedClipCount) {
            clipPipeline.terminate()
            clipPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
        onError: (trackId, error) => {
          updateTrackState(trackId, { status: 'error', error })
          clipResultCount++
          if (clipResultCount >= expectedClipCount) {
            clipPipeline.terminate()
            clipPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
      })

      clipPipelineRef.current = clipPipeline
      await clipPipeline.init()

      for (const trackId of audioTrackIds) {
        const pcm = cache.get(trackId)
        if (!pcm) continue
        clipPipeline.enqueue(trackId, pcm.samples.slice(), pcm.sampleRate)
      }
    }

    // Fingerprint Pipeline
    if (needsFingerprint) {
      let fingerprintResultCount = 0
      const expectedFingerprintCount = audioTrackIds.length

      const fingerprintPipeline = new FingerprintPipeline({
        onComplete: (trackId, result: RawFingerprintResult) => {
          storeFingerprintResult(trackId, result)
          fingerprintResultCount++
          if (fingerprintResultCount >= expectedFingerprintCount) {
            fingerprintPipeline.terminate()
            fingerprintPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
        onError: (trackId, error) => {
          updateTrackState(trackId, { status: 'error', error })
          fingerprintResultCount++
          if (fingerprintResultCount >= expectedFingerprintCount) {
            fingerprintPipeline.terminate()
            fingerprintPipelineRef.current = null
            checkAllPipelinesComplete()
          }
        },
      })

      fingerprintPipelineRef.current = fingerprintPipeline
      await fingerprintPipeline.init()

      for (const trackId of audioTrackIds) {
        const pcm = cache.get(trackId)
        if (!pcm) continue
        fingerprintPipeline.enqueue(trackId, pcm.samples.slice(), pcm.sampleRate)
      }
    }
  }, [storeRawBeatResult, storeRawKeyResult, storeRawClipResult, storeFingerprintResult, updateTrackState, checkAllPipelinesComplete])

  const terminateAll = useCallback(() => {
    beatPipelineRef.current?.terminate()
    keyPipelineRef.current?.terminate()
    clipPipelineRef.current?.terminate()
    fingerprintPipelineRef.current?.terminate()
  }, [])

  return { startAnalysisPipelines, terminateAll }
}
