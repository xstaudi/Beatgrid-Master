'use client'

import { Progress } from '@/components/ui/progress'
import { SeverityBadge } from './SeverityBadge'
import { scoreColor } from '@/features/report'

interface LibraryHealthBarProps {
  avgScore: number
  tracksOk: number
  tracksWithWarnings: number
  tracksWithErrors: number
}

export function LibraryHealthBar({
  avgScore,
  tracksOk,
  tracksWithWarnings,
  tracksWithErrors,
}: LibraryHealthBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Library Health</h3>
        <span className={`text-2xl font-bold ${scoreColor(avgScore)}`}>{avgScore}%</span>
      </div>
      <Progress value={avgScore} className="h-3" />
      <div className="flex items-center gap-3">
        <SeverityBadge severity="ok" count={tracksOk} />
        <SeverityBadge severity="warning" count={tracksWithWarnings} />
        <SeverityBadge severity="error" count={tracksWithErrors} />
      </div>
    </div>
  )
}
