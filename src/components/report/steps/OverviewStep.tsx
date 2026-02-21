'use client'

import dynamic from 'next/dynamic'
import { MiniCheckCard } from '../MiniCheckCard'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Grid3X3, Gauge, Music, Volume2, Copy } from 'lucide-react'
import type { AnalysisResults } from '@/types/analysis'
import type {
  MetadataAuditResult,
  BeatgridCheckResult,
  BpmCheckResult,
  KeyCheckResult,
  ClippingCheckResult,
  DuplicateCheckResult,
} from '@/types/analysis'

const CheckBreakdownChart = dynamic(
  () => import('../CheckBreakdownChart').then((m) => ({ default: m.CheckBreakdownChart })),
  { ssr: false },
)

interface OverviewStepProps {
  results: AnalysisResults
  onNext: () => void
}

export function OverviewStep({ results, onNext }: OverviewStepProps) {
  const meta = results.results.find((r): r is MetadataAuditResult => r.type === 'metadata')
  const beat = results.results.find((r): r is BeatgridCheckResult => r.type === 'beatgrid')
  const bpm = results.results.find((r): r is BpmCheckResult => r.type === 'bpm')
  const key = results.results.find((r): r is KeyCheckResult => r.type === 'key')
  const clip = results.results.find((r): r is ClippingCheckResult => r.type === 'clipping')
  const dup = results.results.find((r): r is DuplicateCheckResult => r.type === 'duplicates')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {meta && (
          <MiniCheckCard
            checkId="metadata"
            icon={<FileText className="size-4" />}
            primaryMetric={`${Math.round(
              Object.values(meta.libraryStats.fieldCoverage).reduce((a, b) => a + b, 0) /
                Math.max(Object.values(meta.libraryStats.fieldCoverage).length, 1)
            )}%`}
            primaryLabel="Avg Coverage"
            tracksOk={meta.libraryStats.tracksOk}
            tracksWarning={meta.libraryStats.tracksWithWarnings}
            tracksError={meta.libraryStats.tracksWithErrors}
          />
        )}
        {beat && (
          <MiniCheckCard
            checkId="beatgrid"
            icon={<Grid3X3 className="size-4" />}
            primaryMetric={`${beat.libraryStats.avgConfidence.toFixed(0)}%`}
            primaryLabel="Avg Confidence"
            tracksOk={beat.libraryStats.tracksOk}
            tracksWarning={beat.libraryStats.tracksWithWarnings}
            tracksError={beat.libraryStats.tracksWithErrors}
          />
        )}
        {bpm && (
          <MiniCheckCard
            checkId="bpm"
            icon={<Gauge className="size-4" />}
            primaryMetric={`${bpm.libraryStats.tracksOk}/${bpm.libraryStats.totalTracks}`}
            primaryLabel="BPM korrekt"
            tracksOk={bpm.libraryStats.tracksOk}
            tracksWarning={bpm.libraryStats.tracksWithWarnings}
            tracksError={bpm.libraryStats.tracksWithErrors}
          />
        )}
        {key && (
          <MiniCheckCard
            checkId="key"
            icon={<Music className="size-4" />}
            primaryMetric={`${key.libraryStats.tracksMatched}/${key.libraryStats.totalTracks}`}
            primaryLabel="Key Match"
            tracksOk={key.libraryStats.tracksMatched}
            tracksWarning={key.libraryStats.tracksRelativeKey + key.libraryStats.tracksNoLibraryKey}
            tracksError={key.libraryStats.tracksMismatched}
          />
        )}
        {clip && (
          <MiniCheckCard
            checkId="clipping"
            icon={<Volume2 className="size-4" />}
            primaryMetric={`${clip.libraryStats.tracksClean}/${clip.libraryStats.totalTracks}`}
            primaryLabel="Clean"
            tracksOk={clip.libraryStats.tracksClean}
            tracksWarning={clip.libraryStats.tracksWithWarnings}
            tracksError={clip.libraryStats.tracksWithClipping}
          />
        )}
        {dup && (
          <MiniCheckCard
            checkId="duplicates"
            icon={<Copy className="size-4" />}
            primaryMetric={`${dup.libraryStats.duplicateGroups}`}
            primaryLabel="Gruppen"
            tracksOk={dup.libraryStats.totalTracks - dup.libraryStats.tracksInGroups}
            tracksWarning={0}
            tracksError={dup.libraryStats.tracksInGroups}
          />
        )}
      </div>

      <CheckBreakdownChart results={results} />

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Weiter: Tracks
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  )
}
