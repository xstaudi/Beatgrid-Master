'use client'

import { useState, useCallback, useRef } from 'react'
import { useEnrichmentStore } from '@/stores/enrichment-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { enrichTrack } from '../services/enrichment-orchestrator'
import { encodeFingerprint } from '../services/fingerprint-encoder'
import type { Track } from '@/types/track'

interface BatchProgress {
  total: number
  completed: number
  current: string | null // trackId currently processing
  errors: number
}

export function useEnrichmentBatch() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    current: null,
    errors: 0,
  })
  const abortRef = useRef(false)

  const setResult = useEnrichmentStore((s) => s.setResult)
  const setLoading = useEnrichmentStore((s) => s.setLoading)
  const setError = useEnrichmentStore((s) => s.setError)
  const rawFingerprintResults = useAnalysisStore((s) => s.rawFingerprintResults)

  /**
   * Batch-Enrichment fuer eine Liste von Tracks starten.
   * Verarbeitet sequentiell um Rate-Limits einzuhalten.
   */
  const startBatch = useCallback(async (tracks: Track[]) => {
    if (isRunning) return
    abortRef.current = false

    setIsRunning(true)
    setProgress({ total: tracks.length, completed: 0, current: null, errors: 0 })

    let errors = 0

    for (let i = 0; i < tracks.length; i++) {
      if (abortRef.current) break

      const track = tracks[i]
      setProgress((prev) => ({ ...prev, current: track.id }))
      setLoading(track.id, true)

      try {
        const rawFp = rawFingerprintResults.get(track.id)
        let encodedFp: string | undefined

        if (rawFp?.fingerprint) {
          try {
            encodedFp = encodeFingerprint(rawFp.fingerprint)
          } catch {
            // Encoding fehlgeschlagen, weiter ohne Fingerprint
          }
        }

        const result = await enrichTrack(track, {
          fingerprint: rawFp?.fingerprint,
          encodedFingerprint: encodedFp,
          duration: rawFp?.duration ?? (track.duration > 0 ? track.duration : undefined),
        })

        setResult(track.id, result)
      } catch (error) {
        errors++
        setError(track.id, error instanceof Error ? error.message : 'Enrichment fehlgeschlagen')
      }

      setProgress((prev) => ({
        ...prev,
        completed: i + 1,
        errors,
      }))
    }

    setIsRunning(false)
    setProgress((prev) => ({ ...prev, current: null }))
  }, [isRunning, rawFingerprintResults, setResult, setLoading, setError])

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  return {
    isRunning,
    progress,
    startBatch,
    abort,
  }
}
