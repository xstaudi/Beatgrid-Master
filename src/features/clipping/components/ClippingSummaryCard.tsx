'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from '@/components/report/SeverityBadge'
import type { ClippingCheckResult } from '@/types/analysis'

interface ClippingSummaryCardProps {
  result: ClippingCheckResult
}

export function ClippingSummaryCard({ result }: ClippingSummaryCardProps) {
  const { libraryStats } = result

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Clipping Detection</CardTitle>
        <p className="text-sm text-muted-foreground">
          {libraryStats.totalTracks.toLocaleString()} tracks scanned
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avg Peak Level */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avg Peak Level</span>
          <span className="text-sm font-mono font-medium">
            {isFinite(libraryStats.avgPeakLevelDb)
              ? `${libraryStats.avgPeakLevelDb.toFixed(1)} dBFS`
              : '---'}
          </span>
        </div>

        {/* Distribution */}
        <div className="flex items-center gap-3">
          <SeverityBadge severity="ok" count={libraryStats.tracksClean} />
          <SeverityBadge severity="warning" count={libraryStats.tracksWithWarnings} />
          <SeverityBadge severity="error" count={libraryStats.tracksWithClipping} />
        </div>
      </CardContent>
    </Card>
  )
}
