import type { CheckId } from '@/types/analysis'

export const CHECK_LABELS: Record<CheckId, string> = {
  metadata: 'Metadata',
  beatgrid: 'Beatgrid',
  bpm: 'BPM',
  key: 'Key',
  clipping: 'Clipping',
  duplicates: 'Duplicates',
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-chart-2'
  if (score >= 50) return 'text-chart-5'
  return 'text-destructive'
}

export const RECHARTS_TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: 'var(--radius)',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
}
