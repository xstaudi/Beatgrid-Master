'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from '@/components/report/SeverityBadge'
import type { BpmCheckResult } from '@/types/analysis'

interface BpmSummaryCardProps {
  result: BpmCheckResult
}

export function BpmSummaryCard({ result }: BpmSummaryCardProps) {
  const { libraryStats } = result

  const variableBpmCount = result.tracks.filter((t) => t.isVariableBpm).length
  const halfDoubleCount = result.tracks.filter((t) => t.halfDoubleAdjusted).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">BPM Verification</CardTitle>
        <p className="text-sm text-muted-foreground">
          {libraryStats.totalTracks.toLocaleString()} tracks verified
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avg Detected BPM */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avg Detected BPM</span>
          <span className="text-sm font-mono font-medium">
            {libraryStats.avgDetectedBpm.toFixed(1)}
          </span>
        </div>

        {/* Distribution */}
        <div className="flex items-center gap-3">
          <SeverityBadge severity="ok" count={libraryStats.tracksOk} />
          <SeverityBadge severity="warning" count={libraryStats.tracksWithWarnings} />
          <SeverityBadge severity="error" count={libraryStats.tracksWithErrors} />
        </div>

        {/* Variable BPM + Half/Double */}
        <div className="space-y-1">
          {variableBpmCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {variableBpmCount} tracks with variable BPM detected
            </p>
          )}
          {halfDoubleCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {halfDoubleCount} half/double-tempo corrections applied
            </p>
          )}
        </div>

        {/* Skipped */}
        {libraryStats.tracksSkipped > 0 && (
          <p className="text-xs text-muted-foreground">
            {libraryStats.tracksSkipped} tracks skipped (no BPM stored or no audio)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
