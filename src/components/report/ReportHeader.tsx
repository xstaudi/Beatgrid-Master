'use client'

import { LibraryHealthBar } from './LibraryHealthBar'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Sparkles } from 'lucide-react'
import type { HealthScoreResult } from '@/features/report'

interface ReportHeaderProps {
  healthScore: HealthScoreResult
  trackCount: number
  completedAt: Date
  verifyCount: number
  freshCount: number
}

export function ReportHeader({
  healthScore,
  trackCount,
  completedAt,
  verifyCount,
  freshCount,
}: ReportHeaderProps) {
  // Nutze den ersten Check als Referenz fuer Track-Zaehler
  const firstCheck = healthScore.checks[0]
  const tracksOk = firstCheck?.tracksOk ?? 0
  const tracksTotal = firstCheck?.tracksTotal ?? trackCount
  const tracksWithIssues = Math.max(0, tracksTotal - tracksOk)

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="art-deco-heading text-2xl">
          <span className="art-deco-divider">Analyse Report</span>
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{completedAt.toLocaleDateString('de-DE')}</span>
          <span>{trackCount.toLocaleString()} Tracks</span>
        </div>
      </div>

      <LibraryHealthBar
        avgScore={healthScore.overall}
        tracksOk={tracksOk}
        tracksWithWarnings={tracksWithIssues}
        tracksWithErrors={0}
      />

      {(verifyCount > 0 || freshCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {verifyCount > 0 && (
            <div className="flex items-center gap-2 border border-primary/20 px-3 py-1.5 text-sm">
              <CheckCircle2 className="size-4 text-chart-2" />
              <strong>{verifyCount}</strong> verifiziert
              <Badge variant="secondary" className="text-xs">Verify</Badge>
            </div>
          )}
          {freshCount > 0 && (
            <div className="flex items-center gap-2 border border-primary/20 px-3 py-1.5 text-sm">
              <Sparkles className="size-4 text-primary" />
              <strong>{freshCount}</strong> neu analysiert
              <Badge variant="secondary" className="text-xs">Fresh</Badge>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
