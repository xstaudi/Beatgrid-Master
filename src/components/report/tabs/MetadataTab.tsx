'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FIELD_LABELS } from '@/features/metadata/constants'
import { useEnrichment } from '@/features/enrichment/hooks/useEnrichment'
import { EnrichmentSuggestionRow } from '@/features/enrichment/components/EnrichmentSuggestionRow'
import { EnrichmentStatusBadge } from '@/features/enrichment/components/EnrichmentStatusBadge'
import type { TrackMetadataResult } from '@/types/analysis'
import type { Track } from '@/types/track'

interface MetadataTabProps {
  result: TrackMetadataResult
  track?: Track
}

export function MetadataTab({ result, track }: MetadataTabProps) {
  const {
    isLoading,
    error,
    suggestions,
    startEnrichment,
    accept,
    reject,
    acceptAll,
    undo,
  } = useEnrichment(track?.id ?? '')

  const hasPendingSuggestions = suggestions.some((s) => s.status === 'pending')
  const hasAnySuggestions = suggestions.length > 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Metadata
        </h4>
        {track && (
          <div className="flex items-center gap-2">
            {hasPendingSuggestions && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-chart-2 hover:text-chart-2"
                onClick={acceptAll}
              >
                Alle akzeptieren
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs border-primary/30 hover:border-primary"
              onClick={startEnrichment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3 animate-spin mr-1" />
                  Suche...
                </>
              ) : (
                <>
                  <Sparkles className="size-3 mr-1" />
                  {hasAnySuggestions ? 'Erneut suchen' : 'Enrichment starten'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Unified Field Rows */}
      <div className="divide-y divide-border/40 pr-4">
        {result.fields.map((f) => (
          <EnrichmentSuggestionRow
            key={f.field}
            fieldLabel={FIELD_LABELS[f.field] ?? f.field}
            currentValue={f.value}
            severity={f.severity}
            message={f.message}
            suggestion={suggestions.find((s) => s.field === f.field)}
            isLoading={isLoading}
            onAccept={accept}
            onReject={reject}
            onUndo={undo}
          />
        ))}
      </div>

      {/* Source-Info */}
      {hasAnySuggestions && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground/50">Quellen:</span>
          {[...new Set(suggestions.map((s) => s.source))].map((source) => (
            <EnrichmentStatusBadge key={source} status="found" />
          ))}
        </div>
      )}
    </div>
  )
}
