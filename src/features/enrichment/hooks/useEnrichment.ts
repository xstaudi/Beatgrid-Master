'use client'

import { useCallback } from 'react'
import { useEnrichmentStore } from '@/stores/enrichment-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useTrackStore } from '@/stores/track-store'
import { enrichTrack } from '../services/enrichment-orchestrator'
import { encodeFingerprint } from '../services/fingerprint-encoder'
import type { Track } from '@/types/track'
import type { EnrichmentField } from '@/types/enrichment'

/**
 * Hook fuer Single-Track Enrichment.
 * Orchestriert Lookup, Store-Updates und Accept/Reject.
 */
export function useEnrichment(trackId: string) {
  const result = useEnrichmentStore((s) => s.results.get(trackId))
  const setLoading = useEnrichmentStore((s) => s.setLoading)
  const setError = useEnrichmentStore((s) => s.setError)
  const setResult = useEnrichmentStore((s) => s.setResult)
  const acceptSuggestion = useEnrichmentStore((s) => s.acceptSuggestion)
  const rejectSuggestion = useEnrichmentStore((s) => s.rejectSuggestion)
  const resetSuggestion = useEnrichmentStore((s) => s.resetSuggestion)
  const acceptAll = useEnrichmentStore((s) => s.acceptAll)

  const track = useTrackStore((s) => s.getTrackById(trackId))
  const updateTrackMetadata = useTrackStore((s) => s.updateTrackMetadata)
  const rawFingerprintResults = useAnalysisStore((s) => s.rawFingerprintResults)

  /**
   * Enrichment starten fuer diesen Track.
   * Nutzt vorhandene Fingerprints aus der Analysis-Pipeline.
   */
  const startEnrichment = useCallback(async () => {
    if (!track) return

    setLoading(trackId, true)

    try {
      // Fingerprint aus Analysis-Store (Duplicate-Detection) wiederverwenden
      const rawFp = rawFingerprintResults.get(trackId)
      let encodedFp: string | undefined
      let duration: number | undefined

      if (rawFp?.fingerprint) {
        try {
          encodedFp = encodeFingerprint(rawFp.fingerprint)
          duration = rawFp.duration
        } catch {
          // Encoding fehlgeschlagen, weiter ohne Fingerprint
        }
      }

      const enrichmentResult = await enrichTrack(track, {
        fingerprint: rawFp?.fingerprint,
        encodedFingerprint: encodedFp,
        duration: duration ?? (track.duration > 0 ? track.duration : undefined),
      })

      setResult(trackId, enrichmentResult)
    } catch (error) {
      setError(trackId, error instanceof Error ? error.message : 'Enrichment fehlgeschlagen')
    }
  }, [track, trackId, rawFingerprintResults, setLoading, setError, setResult])

  /**
   * Suggestion akzeptieren und Wert in Track-Store schreiben.
   */
  const accept = useCallback(
    (field: EnrichmentField) => {
      const suggestion = result?.suggestions.find((s) => s.field === field)
      if (!suggestion) return

      acceptSuggestion(trackId, field)
      updateTrackMetadata(trackId, field, suggestion.value)
    },
    [trackId, result, acceptSuggestion, updateTrackMetadata],
  )

  /**
   * Suggestion ablehnen.
   */
  const reject = useCallback(
    (field: EnrichmentField) => {
      rejectSuggestion(trackId, field)
    },
    [trackId, rejectSuggestion],
  )

  /**
   * Alle pending Suggestions akzeptieren und in Track-Store schreiben.
   */
  const acceptAllSuggestions = useCallback(() => {
    if (!result) return

    for (const suggestion of result.suggestions) {
      if (suggestion.status === 'pending') {
        updateTrackMetadata(trackId, suggestion.field, suggestion.value)
      }
    }
    acceptAll(trackId)
  }, [trackId, result, acceptAll, updateTrackMetadata])

  /**
   * Akzeptanz rueckgaengig machen (setzt Suggestion auf pending).
   * Track-Store-Wert wird NICHT zurueckgesetzt (wuerde Undo-Stack erfordern).
   */
  const undo = useCallback(
    (field: EnrichmentField) => {
      resetSuggestion(trackId, field)
    },
    [trackId, resetSuggestion],
  )

  return {
    result,
    isLoading: result?.isLoading ?? false,
    error: result?.error ?? null,
    suggestions: result?.suggestions ?? [],
    startEnrichment,
    accept,
    reject,
    acceptAll: acceptAllSuggestions,
    undo,
  }
}
