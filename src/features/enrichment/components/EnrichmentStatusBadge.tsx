'use client'

import { Loader2, Check, X, Search, Sparkles, Minus } from 'lucide-react'

type EnrichmentStatus = 'pending' | 'loading' | 'found' | 'not-found' | 'accepted' | 'rejected'

interface EnrichmentStatusBadgeProps {
  status: EnrichmentStatus
}

const STATUS_CONFIG: Record<EnrichmentStatus, { label: string; className: string; Icon: typeof Check }> = {
  pending: { label: 'Ausstehend', className: 'bg-muted/50 text-muted-foreground', Icon: Minus },
  loading: { label: 'Suche...', className: 'bg-primary/20 text-primary', Icon: Loader2 },
  found: { label: 'Vorschlag', className: 'bg-chart-5/20 text-chart-5', Icon: Sparkles },
  'not-found': { label: 'Nicht gefunden', className: 'bg-muted/30 text-muted-foreground/60', Icon: Search },
  accepted: { label: 'Akzeptiert', className: 'bg-chart-2/20 text-chart-2', Icon: Check },
  rejected: { label: 'Abgelehnt', className: 'bg-destructive/20 text-destructive', Icon: X },
}

export function EnrichmentStatusBadge({ status }: EnrichmentStatusBadgeProps) {
  const { label, className, Icon } = STATUS_CONFIG[status]

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${className}`}>
      <Icon className={`size-3 ${status === 'loading' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  )
}
