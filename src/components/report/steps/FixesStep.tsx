'use client'

import { useEffect } from 'react'
import { useTrackStore } from '@/stores/track-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useFixStore } from '@/stores/fix-store'
import { FixToolbar } from '@/features/autofix/components/FixToolbar'
import { FixPreviewPanel } from '@/features/autofix/components/FixPreviewPanel'
import { DuplicateResolutionCard } from '@/features/autofix/components/DuplicateResolutionCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

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
