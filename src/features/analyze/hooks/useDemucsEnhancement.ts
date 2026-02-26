import { useCallback, useRef } from 'react'
import { useProcessingStore } from '@/stores/processing-store'
import type { PcmData } from '@/types/audio'
import { BeatPipeline } from '@/workers/pipeline'
import { DemucsPipeline } from '@/workers/demucs-pipeline'

type UpdateTrackState = (trackId: string, update: Record<string, unknown>) => void

export function useDemucsEnhancement() {
  const demucsPipelineRef = useRef<DemucsPipeline | null>(null)

  const startDemucsFlow = useCallback(async (
    audioTrackIds: string[],
    cache: Map<string, PcmData>,
    createBeatPipeline: () => BeatPipeline,
    updateTrackState: UpdateTrackState,
  ): Promise<void> => {
    const drumStems = new Map<string, { samples: Float32Array; sampleRate: number }>()
    let demucsCompleteCount = 0
    const demucsExpectedCount = audioTrackIds.length

    const launchBeatOnStems = async () => {
      const beatPipeline = createBeatPipeline()
      await beatPipeline.init()

      for (const trackId of audioTrackIds) {
        const stem = drumStems.get(trackId)
        if (stem) {
          beatPipeline.enqueue(trackId, stem.samples, stem.sampleRate, 'drums')
        } else {
          const pcm = cache.get(trackId)
          if (pcm) beatPipeline.enqueue(trackId, pcm.samples.slice(), pcm.sampleRate)
        }
      }
    }

    const demucsPipeline = new DemucsPipeline({
      onProgress: (trackId, percent) => {
        updateTrackState(trackId, {
          progress: Math.round(percent * 0.4),
          status: 'analyzing',
          phase: 'separating',
        })
      },
      onComplete: async (trackId, drumStem, sampleRate) => {
        drumStems.set(trackId, { samples: drumStem, sampleRate })
        demucsCompleteCount++

        if (demucsCompleteCount >= demucsExpectedCount) {
          demucsPipeline.terminate()
          demucsPipelineRef.current = null
          await launchBeatOnStems()
        }
      },
      onError: (trackId, error) => {
        console.warn(`Demucs failed for ${trackId}, using full mix: ${error}`)
        const pcm = cache.get(trackId)
        if (pcm) drumStems.set(trackId, { samples: pcm.samples.slice(), sampleRate: pcm.sampleRate })
        demucsCompleteCount++

        if (demucsCompleteCount >= demucsExpectedCount) {
          demucsPipeline.terminate()
          demucsPipelineRef.current = null
          launchBeatOnStems()
        }
      },
    })

    demucsPipelineRef.current = demucsPipeline
    await demucsPipeline.init()

    for (const trackId of audioTrackIds) {
      const pcm = cache.get(trackId)
      if (!pcm) continue
      demucsPipeline.enqueue(trackId, pcm.samples.slice(), pcm.sampleRate)
    }
  }, [])

  const terminateDemucs = useCallback(() => {
    demucsPipelineRef.current?.terminate()
  }, [])

  return { startDemucsFlow, terminateDemucs }
}
