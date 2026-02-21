import { TableHead } from '@/components/ui/table'

export type SortKey = 'title' | 'severity' | 'issueCount'
export type SortDir = 'asc' | 'desc'

function ariaSort(key: SortKey, currentKey: SortKey, dir: SortDir) {
  if (key !== currentKey) return 'none' as const
  return dir === 'asc' ? ('ascending' as const) : ('descending' as const)
}

interface SortableHeadProps {
  sortKey: SortKey
  currentKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  className?: string
  children: React.ReactNode
}

export function SortableHead({
  sortKey: key,
  currentKey,
  sortDir,
  onSort,
  className,
  children,
}: SortableHeadProps) {
  const isActive = key === currentKey
  return (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap ${className ?? ''}`}
      tabIndex={0}
      role="columnheader"
      aria-sort={ariaSort(key, currentKey, sortDir)}
      onClick={() => onSort(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort(key)
        }
      }}
    >
      {children} {isActive && (sortDir === 'asc' ? '\u2191' : '\u2193')}
    </TableHead>
  )
}
