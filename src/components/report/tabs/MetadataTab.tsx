'use client'

import { FIELD_LABELS } from '@/features/metadata/constants'
import { EnrichmentPanel } from '@/features/enrichment/components/EnrichmentPanel'
import type { TrackMetadataResult } from '@/types/analysis'
import type { Severity } from '@/types/analysis'
import type { Track } from '@/types/track'

interface MetadataTabProps {
  result: TrackMetadataResult
  track?: Track
}

function SeverityDot({ severity }: { severity: Severity }) {
  const colors: Record<Severity, string> = {
    ok: 'bg-chart-2',
    warning: 'bg-chart-5',
    error: 'bg-destructive',
  }
  return <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${colors[severity]}`} />
}

export function MetadataTab({ result, track }: MetadataTabProps) {
  return (
    <div className="space-y-6">
      {/* Bestehende Feld-Uebersicht */}
      <div className="divide-y divide-border/40 pr-4">
        {result.fields.map((f) => (
          <div key={f.field} className="grid grid-cols-[110px_1fr_12px] items-baseline gap-x-3 py-1.5 px-1">
            <span className="text-xs text-muted-foreground/70 truncate">{FIELD_LABELS[f.field] ?? f.field}</span>
            <div className="min-w-0">
              <span className="text-xs font-mono">
                {f.value || <span className="italic text-muted-foreground/40">empty</span>}
              </span>
              {f.message && (
                <span className="text-[10px] text-muted-foreground/60 ml-2">{f.message}</span>
              )}
            </div>
            <SeverityDot severity={f.severity} />
          </div>
        ))}
      </div>

      {/* Enrichment Panel */}
      {track && (
        <div className="border-t border-primary/10 pt-4">
          <EnrichmentPanel track={track} />
        </div>
      )}
    </div>
  )
}
