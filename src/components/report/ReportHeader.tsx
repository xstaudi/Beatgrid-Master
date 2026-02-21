'use client'

import { LibraryHealthBar } from './LibraryHealthBar'
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
}: ReportHeaderProps) {
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
    </header>
  )
}
