'use client'

import { useCallback, useMemo, useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { ReportFilterBar } from './ReportFilterBar'
import { SortableHead, type SortKey, type SortDir } from './SortableHead'
import { TrackTableRow } from './TrackTableRow'
import type { UnifiedTrackRow } from '@/features/report'
import type { CheckId } from '@/types/analysis'
import type { Severity } from '@/types/track'

type FilterSeverity = 'all' | Severity

interface TrackResultTableProps {
  rows: UnifiedTrackRow[]
  activeChecks: CheckId[]
  onSelectTrack: (trackId: string) => void
}

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, ok: 2 }
const VIRTUAL_THRESHOLD = 500
const ROW_HEIGHT = 48

function countIssues(row: UnifiedTrackRow): number {
  let count = 0
  const checks = [row.metadata, row.beatgrid, row.bpm, row.key, row.clipping, row.duplicate] as Array<{ overallSeverity?: Severity } | undefined>
  for (const c of checks) {
    if (c?.overallSeverity && c.overallSeverity !== 'ok') count++
  }
  return count
}

export function TrackResultTable({ rows, activeChecks, onSelectTrack }: TrackResultTableProps) {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('all')
  const [checkFilter, setCheckFilter] = useState<'all' | CheckId>('all')
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return key
    })
  }, [])

  const filtered = useMemo(() => {
    let list = rows

    if (severityFilter !== 'all') {
      list = list.filter((r) => r.overallSeverity === severityFilter)
    }

    if (checkFilter !== 'all') {
      list = list.filter((r) => {
        const checkResult = r[checkFilter === 'duplicates' ? 'duplicate' : checkFilter]
        if (!checkResult) return false
        if (severityFilter !== 'all') return checkResult.overallSeverity === severityFilter
        return true
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => {
        if (!r.track) return false
        return r.track.title.toLowerCase().includes(q) || r.track.artist.toLowerCase().includes(q)
      })
    }

    return [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = (a.track?.title ?? '').localeCompare(b.track?.title ?? '')
          break
        case 'severity':
          cmp = SEVERITY_ORDER[a.overallSeverity] - SEVERITY_ORDER[b.overallSeverity]
          break
        case 'issueCount':
          cmp = countIssues(b) - countIssues(a)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, severityFilter, checkFilter, search, sortKey, sortDir])

  const useVirtual = filtered.length > VIRTUAL_THRESHOLD

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
    enabled: useVirtual,
  })

  const handleSelect = useCallback(
    (trackId: string) => onSelectTrack(trackId),
    [onSelectTrack],
  )

  return (
    <div className="space-y-4">
      <ReportFilterBar
        search={search}
        onSearchChange={setSearch}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
        checkFilter={checkFilter}
        onCheckFilterChange={setCheckFilter}
        activeChecks={activeChecks}
        resultCount={filtered.length}
        totalCount={rows.length}
      />

      <div ref={scrollRef} className="overflow-auto rounded-md border" style={useVirtual ? { maxHeight: 600 } : undefined}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <SortableHead sortKey="title" currentKey={sortKey} sortDir={sortDir} onSort={handleSort}>Track</SortableHead>
              <SortableHead sortKey="severity" currentKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-24">Status</SortableHead>
              <SortableHead sortKey="issueCount" currentKey={sortKey} sortDir={sortDir} onSort={handleSort}>Probleme</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {useVirtual ? (
              <>
                {virtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: virtualizer.getVirtualItems()[0].start }} />
                )}
                {virtualizer.getVirtualItems().map((virtualRow) => (
                  <TrackTableRow
                    key={filtered[virtualRow.index].trackId}
                    row={filtered[virtualRow.index]}
                    index={virtualRow.index}
                    onSelect={handleSelect}
                  />
                ))}
                {virtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0) }} />
                )}
              </>
            ) : (
              filtered.map((row, i) => (
                <TrackTableRow key={row.trackId} row={row} index={i} onSelect={handleSelect} />
              ))
            )}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Keine Tracks gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
