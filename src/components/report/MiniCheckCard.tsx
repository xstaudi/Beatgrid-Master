import { Card, CardContent } from '@/components/ui/card'
import type { CheckId } from '@/types/analysis'
import { CHECK_LABELS, scoreColor } from '@/features/report'

interface MiniCheckCardProps {
  checkId: CheckId
  icon: React.ReactNode
  primaryMetric: string
  primaryLabel: string
  tracksOk: number
  tracksWarning: number
  tracksError: number
}

export function MiniCheckCard({
  checkId,
  icon,
  primaryMetric,
  primaryLabel,
}: MiniCheckCardProps) {
  return (
    <Card className="py-3">
      <CardContent className="flex items-center gap-3 px-4 py-0">
        <div className="flex size-10 shrink-0 rotate-45 items-center justify-center border border-primary/40">
          <div className="-rotate-45 text-primary">{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {CHECK_LABELS[checkId]}
          </p>
          <p className={`text-lg font-bold ${scoreColor(parseFloat(primaryMetric) || 0)}`}>
            {primaryMetric}
          </p>
          <p className="text-xs text-muted-foreground">{primaryLabel}</p>
        </div>
      </CardContent>
    </Card>
  )
}
