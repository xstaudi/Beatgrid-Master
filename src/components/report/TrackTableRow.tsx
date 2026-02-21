'use client'

import { memo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { SeverityBadge } from './SeverityBadge'
import type { UnifiedTrackRow } from '@/features/report'
import type { CheckId } from '@/types/analysis'
import { formatConfidence, confidenceColor } from '@/lib/utils'

interface TrackTableRowProps {
  row: UnifiedTrackRow
  index: number
  onSelect: (trackId: string) => void
  visibleChecks: (checkId: CheckId) => boolean
}

export const TrackTableRow = memo(function TrackTableRow({
  row,
  index,
  onSelect,
  visibleChecks,
}: TrackTableRowProps) {
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
      <TableCell className="font-medium max-w-[200px] truncate">{row.track?.title || '\u2014'}</TableCell>
      <TableCell className="max-w-[150px] truncate hidden md:table-cell">{row.track?.artist || '\u2014'}</TableCell>
      <TableCell><SeverityBadge severity={row.overallSeverity} /></TableCell>

      {visibleChecks('metadata') && (
        <>
          <TableCell className="hidden md:table-cell">
            {row.metadata ? (
              <div className="flex items-center gap-2">
                <div className="h-2 w-12 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      row.metadata.completenessScore >= 80 ? 'bg-chart-2'
                        : row.metadata.completenessScore >= 50 ? 'bg-chart-5'
                        : 'bg-destructive'
                    }`}
                    style={{ width: `${row.metadata.completenessScore}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{row.metadata.completenessScore}%</span>
              </div>
            ) : '\u2014'}
          </TableCell>
          <TableCell className="text-right font-mono hidden lg:table-cell">
            {row.metadata ? row.metadata.fields.filter((f) => f.severity !== 'ok').length : '\u2014'}
          </TableCell>
        </>
      )}

      {visibleChecks('beatgrid') && (
        <>
          <TableCell className="font-mono hidden md:table-cell">
            {row.beatgrid?.skipReason ? '\u2014' : `${row.beatgrid?.avgDriftMs.toFixed(1)}ms`}
          </TableCell>
          <TableCell className="font-mono hidden lg:table-cell">
            {row.beatgrid?.skipReason ? '\u2014' : (
              <span className={confidenceColor(row.beatgrid?.confidence ?? 0)}>
                {formatConfidence(row.beatgrid?.confidence ?? 0)}
              </span>
            )}
          </TableCell>
        </>
      )}

      {visibleChecks('bpm') && (
        <>
          <TableCell className="font-mono hidden md:table-cell">
            {row.bpm?.skipReason
              ? '\u2014'
              : `${row.bpm?.storedBpm?.toFixed(1) ?? '?'} / ${row.bpm?.detectedBpm?.toFixed(1) ?? '?'}`}
          </TableCell>
          <TableCell className="font-mono hidden lg:table-cell">
            {row.bpm?.skipReason ? '\u2014' : row.bpm?.bpmDelta != null ? `${row.bpm.bpmDelta > 0 ? '+' : ''}${row.bpm.bpmDelta.toFixed(2)}` : '\u2014'}
          </TableCell>
        </>
      )}

      {visibleChecks('key') && (
        <>
          <TableCell className="hidden md:table-cell">
            {row.key ? (
              <span className={row.key.match === 'match' ? 'text-chart-2' : row.key.match === 'mismatch' ? 'text-destructive' : 'text-chart-5'}>
                {row.key.match}
              </span>
            ) : '\u2014'}
          </TableCell>
          <TableCell className="font-mono hidden lg:table-cell">
            {row.key?.detectedKey ?? '\u2014'}
          </TableCell>
        </>
      )}

      {visibleChecks('clipping') && (
        <>
          <TableCell className="font-mono hidden md:table-cell">
            {row.clipping?.skipReason ? '\u2014' : `${row.clipping?.peakLevelDb.toFixed(1)} dB`}
          </TableCell>
          <TableCell className="font-mono hidden lg:table-cell">
            {row.clipping?.skipReason ? '\u2014' : row.clipping?.clipCount ?? 0}
          </TableCell>
        </>
      )}

      {visibleChecks('duplicates') && (
        <TableCell className="font-mono hidden md:table-cell">
          {row.duplicate?.duplicateGroupId ? 'Yes' : '\u2014'}
        </TableCell>
      )}
    </TableRow>
  )
})
