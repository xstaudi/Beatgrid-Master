'use client'

import { useEffect } from 'react'
import { useTrackStore } from '@/stores/track-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useFixStore } from '@/stores/fix-store'
import { FixToolbar } from './FixToolbar'
import { FixPreviewPanel } from './FixPreviewPanel'
import { DuplicateResolutionCard } from './DuplicateResolutionCard'
import { ImportInstructions } from './ImportInstructions'

export function AutoFixSection() {
  const tracks = useTrackStore((s) => s.tracks)
  const results = useAnalysisStore((s) => s.results)
  const computeAndSetFixes = useFixStore((s) => s.computeAndSetFixes)
  const fixes = useFixStore((s) => s.fixes)
  const keptDuplicates = useFixStore((s) => s.keptDuplicates)

  useEffect(() => {
    if (tracks.length > 0 && results) {
      computeAndSetFixes(tracks, results)
    }
  }, [tracks, results, computeAndSetFixes])

  const hasFixes = fixes.length > 0 || keptDuplicates.size > 0

  if (!hasFixes) return null

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Auto-Fix</h2>
      <FixToolbar />
      <FixPreviewPanel />
      <DuplicateResolutionCard />
      <ImportInstructions />
    </section>
  )
}
