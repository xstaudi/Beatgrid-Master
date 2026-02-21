import type { CheckId } from '@/types/analysis'
import type { Severity } from '@/types/track'
import { CHECK_LABELS } from '@/features/report'

interface Issue {
  check: CheckId
  severity: Severity
}

interface IssueChipsProps {
  issues: Issue[]
}

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, ok: 2 }

const chipStyle: Record<Exclude<Severity, 'ok'>, string> = {
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-chart-5/10 text-chart-5',
}

const MAX_VISIBLE = 4

export function IssueChips({ issues }: IssueChipsProps) {
  const sorted = issues
    .filter((i) => i.severity !== 'ok')
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  if (sorted.length === 0) return null

  const visible = sorted.slice(0, MAX_VISIBLE)
  const overflow = sorted.length - MAX_VISIBLE

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((issue) => (
        <span
          key={issue.check}
          className={`inline-block px-2 py-0.5 text-[11px] font-medium ${chipStyle[issue.severity as keyof typeof chipStyle]}`}
        >
          {CHECK_LABELS[issue.check]}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-[11px] text-muted-foreground">+{overflow}</span>
      )}
    </div>
  )
}
