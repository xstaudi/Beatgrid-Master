'use client'

import { useEffect } from 'react'
import { useTrackStore } from '@/stores/track-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useFixStore } from '@/stores/fix-store'
import { FixToolbar } from '@/features/autofix/components/FixToolbar'
import { FixPreviewPanel } from '@/features/autofix/components/FixPreviewPanel'
import { DuplicateResolutionCard } from '@/features/autofix/components/DuplicateResolutionCard'
import { Button } from '@/components/ui/button'
import { ArrowRight, Info } from 'lucide-react'

interface FixesStepProps {
  onNext: () => void
}

export function FixesStep({ onNext }: FixesStepProps) {
  const tracks = useTrackStore((s) => s.tracks)
  const results = useAnalysisStore((s) => s.results)
  const generatedBeatgrids = useAnalysisStore((s) => s.generatedBeatgrids)
  const computeAndSetFixes = useFixStore((s) => s.computeAndSetFixes)
  const fixes = useFixStore((s) => s.fixes)
  const keptDuplicates = useFixStore((s) => s.keptDuplicates)

  useEffect(() => {
    if (tracks.length > 0 && results) {
      computeAndSetFixes(tracks, results, generatedBeatgrids)
    }
  }, [tracks, results, generatedBeatgrids, computeAndSetFixes])

  const hasFixes = fixes.length > 0 || keptDuplicates.size > 0
  const pendingCount = fixes.filter((f) => f.status === 'pending').length
  const pendingTrackCount = new Set(
    fixes.filter((f) => f.status === 'pending').map((f) => f.operation.trackId),
  ).size

  if (!hasFixes) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">Keine Fixes verfuegbar.</p>
        <Button onClick={onNext}>
          Weiter: Export
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="art-deco-heading text-lg">
        <span className="art-deco-divider">Auto-Fix</span>
      </h2>
      {pendingCount > 0 && (
        <div className="flex items-start gap-2 border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{pendingTrackCount} {pendingTrackCount === 1 ? 'Track hat' : 'Tracks haben'}</span> noch ausstehende Fixes — im Track-Detail bestaetigen.
          </span>
        </div>
      )}
      <FixToolbar />
      <FixPreviewPanel />
      <DuplicateResolutionCard />
      <div className="flex justify-end">
        <Button onClick={onNext}>
          Weiter: Export
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  )
}
