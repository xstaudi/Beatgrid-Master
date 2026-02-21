'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from '@/components/report/SeverityBadge'
import type { KeyCheckResult } from '@/types/analysis'

interface KeySummaryCardProps {
  result: KeyCheckResult
}

export function KeySummaryCard({ result }: KeySummaryCardProps) {
  const { libraryStats } = result

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Key Detection</CardTitle>
        <p className="text-sm text-muted-foreground">
          {libraryStats.totalTracks.toLocaleString()} tracks analyzed
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avg Confidence */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avg Confidence</span>
          <span className="text-sm font-mono font-medium">
            {(libraryStats.avgConfidence * 100).toFixed(1)}%
          </span>
        </div>

        {/* Distribution */}
        <div className="flex items-center gap-3">
          <SeverityBadge severity="ok" count={libraryStats.tracksMatched} />
          <SeverityBadge severity="warning" count={libraryStats.tracksRelativeKey + libraryStats.tracksNoLibraryKey} />
          <SeverityBadge severity="error" count={libraryStats.tracksMismatched} />
        </div>

        {/* Details */}
        <div className="space-y-1">
          {libraryStats.tracksRelativeKey > 0 && (
            <p className="text-xs text-muted-foreground">
              {libraryStats.tracksRelativeKey} tracks detected as relative key
            </p>
          )}
          {libraryStats.tracksNoLibraryKey > 0 && (
            <p className="text-xs text-muted-foreground">
              {libraryStats.tracksNoLibraryKey} tracks missing key in library
            </p>
          )}
        </div>

        {/* Skipped */}
        {libraryStats.tracksSkipped > 0 && (
          <p className="text-xs text-muted-foreground">
            {libraryStats.tracksSkipped} tracks skipped (no audio)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
