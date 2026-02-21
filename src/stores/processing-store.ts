import { create } from 'zustand'
import type { PcmData, TrackProcessingState } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import { estimateMemoryMb } from '@/lib/audio/pcm-utils'

interface ProcessingStore {
  isProcessing: boolean
  trackStates: Map<string, TrackProcessingState>
  pcmCache: Map<string, PcmData>
  audioFileHandles: Map<string, AudioFileHandle>
  matchStats: { matched: number; total: number } | null

  // Actions
  startProcessing: (trackIds: string[]) => void
  updateTrackState: (trackId: string, update: Partial<Pick<TrackProcessingState, 'status' | 'progress' | 'phase' | 'error'>>) => void
  storeResult: (trackId: string, pcm: PcmData) => void
  evictPcm: (trackId: string) => void
  setAudioFiles: (handles: Map<string, AudioFileHandle>, total: number) => void
  clearAudioFiles: () => void
  resetProcessing: () => void
}

export const useProcessingStore = create<ProcessingStore>((set, get) => ({
  isProcessing: false,
  trackStates: new Map(),
  pcmCache: new Map(),
  audioFileHandles: new Map(),
  matchStats: null,

  startProcessing: (trackIds) => {
    const states = new Map<string, TrackProcessingState>()
    for (const id of trackIds) {
      states.set(id, {
        trackId: id,
        status: 'queued',
        progress: 0,
        phase: null,
        error: null,
      })
    }
    set({ isProcessing: true, trackStates: states, pcmCache: new Map() })
  },

  updateTrackState: (trackId, update) => {
    set((state) => {
      const newStates = new Map(state.trackStates)
      const existing = newStates.get(trackId)
      if (existing) {
        newStates.set(trackId, { ...existing, ...update })
      }
      return { trackStates: newStates }
    })
  },

  storeResult: (trackId, pcm) => {
    set((state) => {
      const newCache = new Map(state.pcmCache)
      newCache.set(trackId, pcm)
      const newStates = new Map(state.trackStates)
      const existing = newStates.get(trackId)
      if (existing) {
        newStates.set(trackId, { ...existing, status: 'complete', progress: 100 })
      }

      const allDone = Array.from(newStates.values()).every(
        (s) => s.status === 'complete' || s.status === 'error' || s.status === 'skipped',
      )

      return {
        pcmCache: newCache,
        trackStates: newStates,
        isProcessing: !allDone,
      }
    })
  },

  evictPcm: (trackId) => {
    set((state) => {
      const newCache = new Map(state.pcmCache)
      newCache.delete(trackId)
      return { pcmCache: newCache }
    })
  },

  setAudioFiles: (handles, total) => {
    set({ audioFileHandles: handles, matchStats: { matched: handles.size, total } })
  },

  clearAudioFiles: () => {
    set({ audioFileHandles: new Map(), matchStats: null })
  },

  resetProcessing: () => {
    set({
      isProcessing: false,
      trackStates: new Map(),
      pcmCache: new Map(),
      audioFileHandles: new Map(),
      matchStats: null,
    })
  },
}))

// --- Selectors (derived state, re-render only when value changes) ---

export function selectOverallProgress(state: { trackStates: Map<string, TrackProcessingState> }): number {
  const { trackStates } = state
  if (trackStates.size === 0) return 0
  let total = 0
  for (const s of trackStates.values()) {
    total += s.progress
  }
  return total / trackStates.size
}

export function selectCompletedCount(state: { trackStates: Map<string, TrackProcessingState> }): number {
  let count = 0
  for (const s of state.trackStates.values()) {
    if (s.status === 'complete') count++
  }
  return count
}

export function selectTotalCount(state: { trackStates: Map<string, TrackProcessingState> }): number {
  return state.trackStates.size
}

export function selectErrorCount(state: { trackStates: Map<string, TrackProcessingState> }): number {
  let count = 0
  for (const s of state.trackStates.values()) {
    if (s.status === 'error') count++
  }
  return count
}

export function selectTotalMemoryMb(state: { pcmCache: Map<string, PcmData> }): number {
  let total = 0
  for (const pcm of state.pcmCache.values()) {
    total += estimateMemoryMb(pcm.samples)
  }
  return total
}
