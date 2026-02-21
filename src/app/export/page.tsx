'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useTrackStore } from '@/stores/track-store'
import { useFixStore } from '@/stores/fix-store'
import { FixPreviewPanel } from '@/features/autofix/components/FixPreviewPanel'
import { DuplicateResolutionCard } from '@/features/autofix/components/DuplicateResolutionCard'
import { ExportPanel } from '@/features/autofix/components/ExportPanel'
import { ImportInstructions } from '@/features/autofix/components/ImportInstructions'

export default function ExportPage() {
  const results = useAnalysisStore((s) => s.results)
  const generatedBeatgrids = useAnalysisStore((s) => s.generatedBeatgrids)
  const tracks = useTrackStore((s) => s.tracks)
  const computeAndSetFixes = useFixStore((s) => s.computeAndSetFixes)

  useEffect(() => {
    if (tracks.length > 0 && results) {
      computeAndSetFixes(tracks, results, generatedBeatgrids)
    }
  }, [tracks, results, generatedBeatgrids, computeAndSetFixes])

  if (!results || results.results.length === 0) {
    redirect('/report')
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/report">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Review & Export</h1>
        </header>

        <FixPreviewPanel />
        <DuplicateResolutionCard />
        <ExportPanel />
        <ImportInstructions />
      </div>
    </main>
  )
}
