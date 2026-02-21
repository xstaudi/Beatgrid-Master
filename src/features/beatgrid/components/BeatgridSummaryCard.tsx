'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from '@/components/report/SeverityBadge'
import type { BeatgridCheckResult } from '@/types/analysis'

interface BeatgridSummaryCardProps {
  result: BeatgridCheckResult
}

export function BeatgridSummaryCard({ result }: BeatgridSummaryCardProps) {
  const { libraryStats } = result

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Beatgrid Check</CardTitle>
        <p className="text-sm text-muted-foreground">
          {libraryStats.totalTracks.toLocaleString()} tracks analyzed
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avg Confidence</span>
          <span className="text-sm font-mono font-medium">
            {libraryStats.avgConfidence.toFixed(0)}%
          </span>
        </div>

        {/* Avg Drift */}
        {result.tracks.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg Drift</span>
            <span className="text-sm font-mono font-medium">
              {computeAvgDrift(result).toFixed(1)} ms
            </span>
          </div>
        )}

        {/* Distribution */}
        <div className="flex items-center gap-3">
          <SeverityBadge severity="ok" count={libraryStats.tracksOk} />
          <SeverityBadge severity="warning" count={libraryStats.tracksWithWarnings} />
          <SeverityBadge severity="error" count={libraryStats.tracksWithErrors} />
        </div>

        {/* Skipped */}
        {libraryStats.tracksSkipped > 0 && (
          <p className="text-xs text-muted-foreground">
            {libraryStats.tracksSkipped} tracks skipped (no beatgrid or audio)
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function computeAvgDrift(result: BeatgridCheckResult): number {
  const tracked = result.tracks.filter((t) => !t.skipReason && t.beatsMatched > 0)
  if (tracked.length === 0) return 0
  return tracked.reduce((sum, t) => sum + t.avgDriftMs, 0) / tracked.length
}
