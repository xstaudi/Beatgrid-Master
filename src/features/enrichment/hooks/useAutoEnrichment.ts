'use client'

import { useEffect, useRef } from 'react'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useTrackStore } from '@/stores/track-store'
import { useEnrichmentStore } from '@/stores/enrichment-store'
import { useEnrichmentBatch } from './useEnrichmentBatch'
import type { MetadataAuditResult } from '@/types/analysis'

/**
 * Auto-Enrichment: Startet nach der Analyse automatisch
 * Enrichment fuer Tracks mit fehlenden Metadaten (completenessScore < 100).
 * Laeuft einmal, sequentiell im Hintergrund.
 */
export function useAutoEnrichment() {
  const hasRun = useRef(false)
  const results = useAnalysisStore((s) => s.results)
  const tracks = useTrackStore((s) => s.tracks)
  const enrichmentResults = useEnrichmentStore((s) => s.results)
  const { startBatch } = useEnrichmentBatch()

  useEffect(() => {
    if (hasRun.current || !results) return
    hasRun.current = true

    const metaResult = results.results.find(
      (r): r is MetadataAuditResult => r.type === 'metadata',
    )
    if (!metaResult) return

    const incompleteTrackIds = metaResult.tracks
      .filter((t) => t.completenessScore < 100)
      .map((t) => t.trackId)

    const toEnrich = tracks.filter(
      (t) => incompleteTrackIds.includes(t.id) && !enrichmentResults.has(t.id),
    )

    if (toEnrich.length > 0) {
      startBatch(toEnrich)
    }
  }, [results, tracks, enrichmentResults, startBatch])
}
