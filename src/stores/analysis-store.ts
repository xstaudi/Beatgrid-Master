import { create } from 'zustand'
import type { Track } from '@/types/track'
import type { AnalysisConfig, AnalysisResults, AnyCheckResult, CheckId } from '@/types/analysis'
import { checkRequiresAudio } from '@/types/analysis'
import type { RawBeatResult, RawKeyResult, RawClipResult, RawFingerprintResult } from '@/types/audio'
import { auditLibrary } from '@/features/metadata'
import { checkBeatgridLibrary } from '@/features/beatgrid'
import { verifyBpmLibrary } from '@/features/bpm'
import { checkKeyLibrary } from '@/features/key'
import { checkClippingLibrary } from '@/features/clipping'
import { checkDuplicatesLibrary, checkDuplicatesMetadataOnly } from '@/features/duplicates'

interface AnalysisStore {
  config: AnalysisConfig
  results: AnalysisResults | null
  isRunning: boolean
  error: string | null
  needsAudioDecoding: boolean
  rawBeatResults: Map<string, RawBeatResult>
  rawKeyResults: Map<string, RawKeyResult>
  rawClipResults: Map<string, RawClipResult>
  rawFingerprintResults: Map<string, RawFingerprintResult>

  setChecks: (checks: CheckId[]) => void
  runAnalysis: (tracks: Track[]) => void
  storeRawBeatResult: (trackId: string, result: RawBeatResult) => void
  storeRawKeyResult: (trackId: string, result: RawKeyResult) => void
  storeRawClipResult: (trackId: string, result: RawClipResult) => void
  storeFingerprintResult: (trackId: string, result: RawFingerprintResult) => void
  finalizeAudioAnalysis: (tracks: Track[]) => void
  clearResults: () => void
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  config: { checks: ['metadata'] },
  results: null,
  isRunning: false,
  error: null,
  needsAudioDecoding: false,
  rawBeatResults: new Map(),
  rawKeyResults: new Map(),
  rawClipResults: new Map(),
  rawFingerprintResults: new Map(),

  setChecks: (checks) => {
    const needsAudio = checks.some(checkRequiresAudio)
    set({ config: { checks }, needsAudioDecoding: needsAudio })
  },

  runAnalysis: (tracks) => {
    const { config, needsAudioDecoding } = get()
    set({ isRunning: true, error: null, rawBeatResults: new Map(), rawKeyResults: new Map(), rawClipResults: new Map(), rawFingerprintResults: new Map() })

    try {
      const hasMetadata = config.checks.includes('metadata')
      const metadataResult = hasMetadata ? auditLibrary(tracks) : null
      const results: AnyCheckResult[] = metadataResult ? [metadataResult] : []

      if (needsAudioDecoding) {
        // Keep isRunning: true — will be set to false by finalizeAudioAnalysis
        set({
          results: {
            completedAt: new Date(),
            config,
            results,
          },
        })
      } else {
        set({
          results: {
            completedAt: new Date(),
            config,
            results,
          },
          isRunning: false,
        })
      }
    } catch (err) {
      set({
        isRunning: false,
        error: err instanceof Error ? err.message : 'Analysis failed',
      })
    }
  },

  storeRawBeatResult: (trackId, result) => {
    set((state) => {
      const newMap = new Map(state.rawBeatResults)
      newMap.set(trackId, result)
      return { rawBeatResults: newMap }
    })
  },

  storeRawKeyResult: (trackId, result) => {
    set((state) => {
      const newMap = new Map(state.rawKeyResults)
      newMap.set(trackId, result)
      return { rawKeyResults: newMap }
    })
  },

  storeRawClipResult: (trackId, result) => {
    set((state) => {
      const newMap = new Map(state.rawClipResults)
      newMap.set(trackId, result)
      return { rawClipResults: newMap }
    })
  },

  storeFingerprintResult: (trackId, result) => {
    set((state) => {
      const newMap = new Map(state.rawFingerprintResults)
      newMap.set(trackId, result)
      return { rawFingerprintResults: newMap }
    })
  },

  finalizeAudioAnalysis: (tracks) => {
    const { config, results, rawBeatResults, rawKeyResults, rawClipResults, rawFingerprintResults } = get()
    if (!results) return

    const existingResults = [...results.results]

    if (config.checks.includes('beatgrid')) {
      existingResults.push(checkBeatgridLibrary(tracks, rawBeatResults))
    }

    if (config.checks.includes('bpm')) {
      existingResults.push(verifyBpmLibrary(tracks, rawBeatResults))
    }

    if (config.checks.includes('key')) {
      existingResults.push(checkKeyLibrary(tracks, rawKeyResults))
    }

    if (config.checks.includes('clipping')) {
      existingResults.push(checkClippingLibrary(tracks, rawClipResults))
    }

    if (config.checks.includes('duplicates')) {
      existingResults.push(
        rawFingerprintResults.size > 0
          ? checkDuplicatesLibrary(tracks, rawFingerprintResults)
          : checkDuplicatesMetadataOnly(tracks),
      )
    }

    set({
      results: {
        completedAt: new Date(),
        config,
        results: existingResults,
      },
      isRunning: false,
    })
  },

  clearResults: () => {
    set({ results: null, error: null, rawBeatResults: new Map(), rawKeyResults: new Map(), rawClipResults: new Map(), rawFingerprintResults: new Map() })
  },
}))
