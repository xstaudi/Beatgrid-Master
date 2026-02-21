'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { MetadataAuditResult } from '@/types/analysis'
import { FIELD_LABELS } from '@/features/metadata/constants'
import { BatchEnrichmentDialog } from '@/features/enrichment/components/BatchEnrichmentDialog'

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
  const [batchOpen, setBatchOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Field Coverage</CardTitle>
              <p className="text-sm text-muted-foreground">
                Coverage across {totalTracks.toLocaleString()} tracks
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:border-primary"
              onClick={() => setBatchOpen(true)}
            >
              <Sparkles className="size-3 mr-1.5" />
              Metadaten enrichen
            </Button>
          </div>
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

      <BatchEnrichmentDialog open={batchOpen} onClose={() => setBatchOpen(false)} />
    </>
  )
}
