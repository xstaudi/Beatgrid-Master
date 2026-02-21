'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from '@/components/report/SeverityBadge'
import type { DuplicateCheckResult } from '@/types/analysis'

interface DuplicateSummaryCardProps {
  result: DuplicateCheckResult
}

export function DuplicateSummaryCard({ result }: DuplicateSummaryCardProps) {
  const { libraryStats } = result

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Duplicate Detection</CardTitle>
        <p className="text-sm text-muted-foreground">
          {libraryStats.totalTracks.toLocaleString()} tracks scanned
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Groups found */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Duplicate Groups</span>
          <span className="text-sm font-mono font-medium">
            {libraryStats.duplicateGroups}
          </span>
        </div>

        {/* Tracks affected */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tracks in Groups</span>
          <span className="text-sm font-mono font-medium">
            {libraryStats.tracksInGroups}
          </span>
        </div>

        {/* Distribution */}
        <div className="flex items-center gap-3">
          <SeverityBadge
            severity="ok"
            count={libraryStats.totalTracks - libraryStats.tracksInGroups}
          />
          <SeverityBadge severity="warning" count={libraryStats.tracksInGroups} />
        </div>

        {/* Confirmation breakdown */}
        {libraryStats.duplicateGroups === 0 ? (
          <p className="text-sm text-muted-foreground">
            No duplicates found in your library.
          </p>
        ) : (
          <div className="space-y-1">
            {libraryStats.fingerprintConfirmedGroups > 0 && (
              <p className="text-xs text-muted-foreground">
                {libraryStats.fingerprintConfirmedGroups} groups confirmed by audio fingerprint
              </p>
            )}
            {libraryStats.metadataOnlyGroups > 0 && (
              <p className="text-xs text-muted-foreground">
                {libraryStats.metadataOnlyGroups} groups based on metadata only
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
