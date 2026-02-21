import type { Severity } from '@/types/track'
import { Badge } from '@/components/ui/badge'

interface SeverityBadgeProps {
  severity: Severity
  count?: number
}

export function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  const label = count != null ? `${count} ${severity}` : severity

  switch (severity) {
    case 'ok':
      return (
        <Badge variant="outline" className="border-chart-2 text-chart-2">
          {label}
        </Badge>
      )
    case 'warning':
      return (
        <Badge variant="outline" className="border-chart-5 text-chart-5">
          {label}
        </Badge>
      )
    case 'error':
      return <Badge variant="destructive">{label}</Badge>
  }
}
