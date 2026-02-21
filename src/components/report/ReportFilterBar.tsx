'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CheckId } from '@/types/analysis'
import type { Severity } from '@/types/track'
import { CHECK_LABELS } from '@/features/report'

type FilterSeverity = 'all' | Severity

interface ReportFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  severityFilter: FilterSeverity
  onSeverityFilterChange: (value: FilterSeverity) => void
  checkFilter: 'all' | CheckId
  onCheckFilterChange: (value: 'all' | CheckId) => void
  activeChecks: CheckId[]
  resultCount: number
  totalCount: number
}

const SEVERITY_FILTERS: { label: string; value: FilterSeverity }[] = [
  { label: 'All', value: 'all' },
  { label: 'Error', value: 'error' },
  { label: 'Warning', value: 'warning' },
  { label: 'OK', value: 'ok' },
]

export function ReportFilterBar({
  search,
  onSearchChange,
  severityFilter,
  onSeverityFilterChange,
  checkFilter,
  onCheckFilterChange,
  activeChecks,
  resultCount,
  totalCount,
}: ReportFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search title or artist..."
        aria-label="Search tracks by title or artist"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />

      <div className="flex gap-1" role="group" aria-label="Filter by severity">
        {SEVERITY_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={severityFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSeverityFilterChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {activeChecks.length > 1 && (
        <Select
          value={checkFilter}
          onValueChange={(v) => onCheckFilterChange(v as 'all' | CheckId)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Checks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Checks</SelectItem>
            {activeChecks.map((c) => (
              <SelectItem key={c} value={c}>
                {CHECK_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <span className="ml-auto text-sm text-muted-foreground">
        {resultCount} of {totalCount} tracks
      </span>
    </div>
  )
}
