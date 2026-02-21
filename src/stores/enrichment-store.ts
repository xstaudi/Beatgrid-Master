import { create } from 'zustand'
import type { FieldSuggestion, TrackEnrichmentResult, EnrichmentField } from '@/types/enrichment'

interface EnrichmentStore {
  /** Enrichment results per track */
  results: Map<string, TrackEnrichmentResult>

  /** Set loading state for a track */
  setLoading: (trackId: string, isLoading: boolean) => void

  /** Set error for a track */
  setError: (trackId: string, error: string | null) => void

  /** Store enrichment result for a track */
  setResult: (trackId: string, result: TrackEnrichmentResult) => void

  /** Accept a suggestion (mark as accepted) */
  acceptSuggestion: (trackId: string, field: EnrichmentField) => void

  /** Reject a suggestion (mark as rejected) */
  rejectSuggestion: (trackId: string, field: EnrichmentField) => void

  /** Reset a suggestion back to pending */
  resetSuggestion: (trackId: string, field: EnrichmentField) => void

  /** Accept all pending suggestions for a track */
  acceptAll: (trackId: string) => void

  /** Get result for a specific track */
  getResult: (trackId: string) => TrackEnrichmentResult | undefined

  /** Clear all enrichment results */
  clearResults: () => void
}

function createEmptyResult(trackId: string): TrackEnrichmentResult {
  return {
    trackId,
    suggestions: [],
    sources: [],
    acoustidRecordingId: null,
    musicbrainzReleaseId: null,
    isLoading: false,
    error: null,
  }
}

function updateSuggestionStatus(
  suggestions: FieldSuggestion[],
  field: EnrichmentField,
  status: FieldSuggestion['status'],
): FieldSuggestion[] {
  return suggestions.map((s) =>
    s.field === field ? { ...s, status } : s,
  )
}

export const useEnrichmentStore = create<EnrichmentStore>((set, get) => ({
  results: new Map(),

  setLoading: (trackId, isLoading) => {
    set((state) => {
      const newMap = new Map(state.results)
      const existing = newMap.get(trackId) ?? createEmptyResult(trackId)
      newMap.set(trackId, { ...existing, isLoading })
      return { results: newMap }
    })
  },

  setError: (trackId, error) => {
    set((state) => {
      const newMap = new Map(state.results)
      const existing = newMap.get(trackId) ?? createEmptyResult(trackId)
      newMap.set(trackId, { ...existing, error, isLoading: false })
      return { results: newMap }
    })
  },

  setResult: (trackId, result) => {
    set((state) => {
      const newMap = new Map(state.results)
      newMap.set(trackId, result)
      return { results: newMap }
    })
  },

  acceptSuggestion: (trackId, field) => {
    set((state) => {
      const newMap = new Map(state.results)
      const existing = newMap.get(trackId)
      if (!existing) return state
      newMap.set(trackId, {
        ...existing,
        suggestions: updateSuggestionStatus(existing.suggestions, field, 'accepted'),
      })
      return { results: newMap }
    })
  },

  rejectSuggestion: (trackId, field) => {
    set((state) => {
      const newMap = new Map(state.results)
      const existing = newMap.get(trackId)
      if (!existing) return state
      newMap.set(trackId, {
        ...existing,
        suggestions: updateSuggestionStatus(existing.suggestions, field, 'rejected'),
      })
      return { results: newMap }
    })
  },

  resetSuggestion: (trackId, field) => {
    set((state) => {
      const newMap = new Map(state.results)
      const existing = newMap.get(trackId)
      if (!existing) return state
      newMap.set(trackId, {
        ...existing,
        suggestions: updateSuggestionStatus(existing.suggestions, field, 'pending'),
      })
      return { results: newMap }
    })
  },

  acceptAll: (trackId) => {
    set((state) => {
      const newMap = new Map(state.results)
      const existing = newMap.get(trackId)
      if (!existing) return state
      newMap.set(trackId, {
        ...existing,
        suggestions: existing.suggestions.map((s) =>
          s.status === 'pending' ? { ...s, status: 'accepted' as const } : s,
        ),
      })
      return { results: newMap }
    })
  },

  getResult: (trackId) => {
    return get().results.get(trackId)
  },

  clearResults: () => {
    set({ results: new Map() })
  },
}))
