'use client'

import { memo, useMemo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { SeverityBadge } from './SeverityBadge'
import { IssueChips } from './IssueChips'
import type { UnifiedTrackRow } from '@/features/report'
import type { CheckId } from '@/types/analysis'
import type { Severity } from '@/types/track'
import { useFixStore } from '@/stores/fix-store'

interface TrackTableRowProps {
  row: UnifiedTrackRow
  index: number
  onSelect: (trackId: string) => void
}

const CHECK_KEYS: Array<{ check: CheckId; key: keyof UnifiedTrackRow }> = [
  { check: 'metadata', key: 'metadata' },
  { check: 'beatgrid', key: 'beatgrid' },
  { check: 'bpm', key: 'bpm' },
  { check: 'key', key: 'key' },
  { check: 'clipping', key: 'clipping' },
  { check: 'duplicates', key: 'duplicate' },
]

export const TrackTableRow = memo(function TrackTableRow({
  row,
  index,
  onSelect,
}: TrackTableRowProps) {
  const hasPending = useFixStore((s) =>
    s.fixes.some((f) => f.operation.trackId === row.trackId && f.status === 'pending'),
  )
  const hasApproved = useFixStore((s) => {
    let total = 0
    let nonPending = 0
    for (const f of s.fixes) {
      if (f.operation.trackId === row.trackId) {
        total++
        if (f.status !== 'pending') nonPending++
      }
    }
    return total > 0 && nonPending === total
  })

  const issues = useMemo(() => {
    const result: Array<{ check: CheckId; severity: Severity }> = []
    for (const { check, key } of CHECK_KEYS) {
      const data = row[key] as { overallSeverity?: Severity } | undefined
      if (data?.overallSeverity && data.overallSeverity !== 'ok') {
        result.push({ check, severity: data.overallSeverity })
      }
    }
    return result
  }, [row])

  return (
    <TableRow
      tabIndex={0}
      className={`cursor-pointer hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        row.overallSeverity === 'error' ? 'bg-destructive/5' : row.overallSeverity === 'warning' ? 'bg-chart-5/5' : ''
      }`}
      onClick={() => onSelect(row.trackId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(row.trackId)
        }
      }}
    >
      <TableCell className="text-muted-foreground w-12">{index + 1}</TableCell>
      <TableCell className="max-w-[280px]">
        <div className="truncate font-medium">{row.track?.title || '\u2014'}</div>
        <div className="truncate text-xs text-muted-foreground">{row.track?.artist || '\u2014'}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={row.overallSeverity} />
          {hasPending && (
            <span className="text-[10px] font-mono text-primary" title="Ausstehende Fixes">{'\u25CF'}</span>
          )}
          {!hasPending && hasApproved && (
            <span className="text-[10px] font-mono text-chart-2" title="Fixes bestaetigt">{'\u2713'}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <IssueChips issues={issues} />
      </TableCell>
    </TableRow>
  )
})
