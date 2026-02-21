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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ReportFilterBar } from './ReportFilterBar'
import { SortableHead, type SortKey, type SortDir } from './SortableHead'
import { TrackTableRow } from './TrackTableRow'
import { CHECK_LABELS } from '@/features/report'
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

type ColumnId = CheckId

export function TrackResultTable({ rows, activeChecks, onSelectTrack }: TrackResultTableProps) {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('all')
  const [checkFilter, setCheckFilter] = useState<'all' | CheckId>('all')
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    () => new Set(activeChecks),
  )
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

  const toggleColumn = (col: ColumnId) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

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
        case 'completeness':
          cmp = (a.metadata?.completenessScore ?? 0) - (b.metadata?.completenessScore ?? 0)
          break
        case 'drift':
          cmp = (a.beatgrid?.avgDriftMs ?? 0) - (b.beatgrid?.avgDriftMs ?? 0)
          break
        case 'bpmDelta':
          cmp = Math.abs(a.bpm?.bpmDelta ?? 0) - Math.abs(b.bpm?.bpmDelta ?? 0)
          break
        case 'keyMatch':
          cmp = (a.key?.confidence ?? 0) - (b.key?.confidence ?? 0)
          break
        case 'peakDb':
          cmp = (a.clipping?.peakLevelDb ?? -100) - (b.clipping?.peakLevelDb ?? -100)
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

  const show = useCallback(
    (col: ColumnId) => visibleColumns.has(col) && activeChecks.includes(col),
    [visibleColumns, activeChecks],
  )

  const handleSelect = useCallback(
    (trackId: string) => onSelectTrack(trackId),
    [onSelectTrack],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {activeChecks.map((c) => (
              <DropdownMenuCheckboxItem
                key={c}
                checked={visibleColumns.has(c)}
                onCheckedChange={() => toggleColumn(c)}
              >
                {CHECK_LABELS[c]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={scrollRef} className="overflow-auto rounded-md border" style={useVirtual ? { maxHeight: 600 } : undefined}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <SortableHead sortKey="title" currentKey={sortKey} sortDir={sortDir} onSort={handleSort}>Title</SortableHead>
              <TableHead className="hidden md:table-cell">Artist</TableHead>
              <SortableHead sortKey="severity" currentKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-24">Status</SortableHead>

              {show('metadata') && (
                <>
                  <SortableHead sortKey="completeness" currentKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-32 hidden md:table-cell">Score</SortableHead>
                  <TableHead className="w-20 text-right hidden lg:table-cell">Issues</TableHead>
                </>
              )}
              {show('beatgrid') && (
                <>
                  <SortableHead sortKey="drift" currentKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell">Drift</SortableHead>
                  <TableHead className="hidden lg:table-cell">Conf.</TableHead>
                </>
              )}
              {show('bpm') && (
                <>
                  <TableHead className="hidden md:table-cell">BPM</TableHead>
                  <SortableHead sortKey="bpmDelta" currentKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell">Delta</SortableHead>
                </>
              )}
              {show('key') && (
                <>
                  <SortableHead sortKey="keyMatch" currentKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell">Match</SortableHead>
                  <TableHead className="hidden lg:table-cell">Key</TableHead>
                </>
              )}
              {show('clipping') && (
                <>
                  <SortableHead sortKey="peakDb" currentKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell">Peak</SortableHead>
                  <TableHead className="hidden lg:table-cell">Clips</TableHead>
                </>
              )}
              {show('duplicates') && <TableHead className="hidden md:table-cell">Dup</TableHead>}
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
                    visibleChecks={show}
                  />
                ))}
                {virtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0) }} />
                )}
              </>
            ) : (
              filtered.map((row, i) => (
                <TrackTableRow key={row.trackId} row={row} index={i} onSelect={handleSelect} visibleChecks={show} />
              ))
            )}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={20} className="py-8 text-center text-muted-foreground">
                  No tracks match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
