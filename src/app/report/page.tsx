'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useHealthScore, useUnifiedTrackData } from '@/features/report'
import { TrackResultTable } from '@/components/report/TrackResultTable'
import { TrackDetailSheet } from '@/components/report/TrackDetailSheet'
import { MetadataSummaryCard } from '@/features/metadata/components/MetadataSummaryCard'
import { BeatgridSummaryCard } from '@/features/beatgrid/components/BeatgridSummaryCard'
import { BpmSummaryCard } from '@/features/bpm/components/BpmSummaryCard'
import { KeySummaryCard } from '@/features/key/components/KeySummaryCard'
import { ClippingSummaryCard } from '@/features/clipping/components/ClippingSummaryCard'
import { DuplicateSummaryCard } from '@/features/duplicates'
import { AutoFixSection } from '@/features/autofix'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import type {
  MetadataAuditResult,
  BeatgridCheckResult,
  BpmCheckResult,
  KeyCheckResult,
  ClippingCheckResult,
  DuplicateCheckResult,
} from '@/types/analysis'

const HealthScoreCard = dynamic(
  () => import('@/components/report/HealthScoreCard').then((m) => ({ default: m.HealthScoreCard })),
  { ssr: false },
)

const CheckBreakdownChart = dynamic(
  () => import('@/components/report/CheckBreakdownChart').then((m) => ({ default: m.CheckBreakdownChart })),
  { ssr: false },
)

export default function ReportPage() {
  const results = useAnalysisStore((s) => s.results)
  const healthScore = useHealthScore()
  const { rows, activeChecks } = useUnifiedTrackData()
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

  if (!results || results.results.length === 0) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">No analysis yet</h1>
        <p className="text-muted-foreground">Run an analysis first to see your report.</p>
        <Button asChild>
          <Link href="/analyze">Go to Analyze</Link>
        </Button>
      </main>
    )
  }

  const metadataResult = results.results.find((r): r is MetadataAuditResult => r.type === 'metadata')
  const beatgridResult = results.results.find((r): r is BeatgridCheckResult => r.type === 'beatgrid')
  const bpmResult = results.results.find((r): r is BpmCheckResult => r.type === 'bpm')
  const keyResult = results.results.find((r): r is KeyCheckResult => r.type === 'key')
  const clippingResult = results.results.find((r): r is ClippingCheckResult => r.type === 'clipping')
  const duplicatesResult = results.results.find((r): r is DuplicateCheckResult => r.type === 'duplicates')

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Analysis Report</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{results.completedAt.toLocaleString()}</span>
            <span>{rows.length.toLocaleString()} tracks</span>
          </div>
        </header>

        {/* Health Overview Charts */}
        {healthScore && (
          <section className="grid gap-6 md:grid-cols-2">
            <HealthScoreCard healthScore={healthScore} />
            <CheckBreakdownChart results={results} />
          </section>
        )}

        {/* Summary Cards */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metadataResult && <MetadataSummaryCard result={metadataResult} />}
          {beatgridResult && <BeatgridSummaryCard result={beatgridResult} />}
          {bpmResult && <BpmSummaryCard result={bpmResult} />}
          {keyResult && <KeySummaryCard result={keyResult} />}
          {clippingResult && <ClippingSummaryCard result={clippingResult} />}
          {duplicatesResult && <DuplicateSummaryCard result={duplicatesResult} />}
        </section>

        {/* Track Table */}
        <section>
          <TrackResultTable
            rows={rows}
            activeChecks={activeChecks}
            onSelectTrack={setSelectedTrackId}
          />
        </section>

        {/* Auto-Fix Section */}
        {(bpmResult || keyResult || beatgridResult || duplicatesResult) && (
          <>
            <AutoFixSection />
            <div className="flex justify-end">
              <Button asChild>
                <Link href="/export">
                  Review & Export Fixes
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </>
        )}

        <TrackDetailSheet
          trackId={selectedTrackId}
          open={selectedTrackId != null}
          onOpenChange={(open) => {
            if (!open) setSelectedTrackId(null)
          }}
        />
      </div>
    </main>
  )
}
