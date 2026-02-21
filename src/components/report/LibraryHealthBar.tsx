'use client'

import { Progress } from '@/components/ui/progress'
import { scoreColor } from '@/features/report'

interface LibraryHealthBarProps {
  avgScore: number
  tracksOk: number
  tracksWithWarnings: number
  tracksWithErrors: number
}

export function LibraryHealthBar({
  avgScore,
}: LibraryHealthBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Library Health</h3>
        <span className={`text-2xl font-bold ${scoreColor(avgScore)}`}>{avgScore}%</span>
      </div>
      <Progress value={avgScore} className="h-3" />
    </div>
  )
}
