'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MetadataAuditResult } from '@/types/analysis'
import { FIELD_LABELS } from '@/features/metadata/constants'

interface MetadataSummaryCardProps {
  result: MetadataAuditResult
}

function coverageColor(pct: number): string {
  if (pct >= 90) return 'text-chart-2'
  if (pct >= 60) return 'text-chart-5'
  return 'text-destructive'
}

export function MetadataSummaryCard({ result }: MetadataSummaryCardProps) {
  const { fieldCoverage, totalTracks } = result.libraryStats

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Coverage</CardTitle>
        <p className="text-sm text-muted-foreground">
          Coverage across {totalTracks.toLocaleString()} tracks
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(fieldCoverage).map(([field, pct]) => (
            <div key={field} className="flex items-center justify-between">
              <span className="text-sm">{FIELD_LABELS[field] ?? field}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 90 ? 'bg-chart-2' : pct >= 60 ? 'bg-chart-5' : 'bg-destructive'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`w-10 text-right text-sm font-mono ${coverageColor(pct)}`}>
                  {pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
