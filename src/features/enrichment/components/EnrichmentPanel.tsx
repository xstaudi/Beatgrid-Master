'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnrichmentSuggestionRow } from './EnrichmentSuggestionRow'
import { EnrichmentStatusBadge } from './EnrichmentStatusBadge'
import { useEnrichment } from '../hooks/useEnrichment'
import { ENRICHMENT_FIELD_LABELS } from '../constants'
import { FIELD_LABELS } from '@/features/metadata/constants'
import type { Track } from '@/types/track'
import type { EnrichmentField } from '@/types/enrichment'

/** Fields that can be enriched, in display order */
const DISPLAY_FIELDS: { field: EnrichmentField; trackKey: keyof Track }[] = [
  { field: 'title', trackKey: 'title' },
  { field: 'artist', trackKey: 'artist' },
  { field: 'album', trackKey: 'album' },
  { field: 'genre', trackKey: 'genre' },
  { field: 'year', trackKey: 'year' },
  { field: 'label', trackKey: 'label' },
  { field: 'composer', trackKey: 'composer' },
]

function getTrackFieldValue(track: Track, key: keyof Track): string | null {
  const val = track[key]
  if (val == null) return null
  if (typeof val === 'string') return val || null
  if (typeof val === 'number') return val > 0 ? String(val) : null
  return null
}

interface EnrichmentPanelProps {
  track: Track
}

export function EnrichmentPanel({ track }: EnrichmentPanelProps) {
  const {
    isLoading,
    error,
    suggestions,
    startEnrichment,
    accept,
    reject,
    acceptAll,
    undo,
  } = useEnrichment(track.id)

  const hasPendingSuggestions = suggestions.some((s) => s.status === 'pending')
  const hasAnySuggestions = suggestions.length > 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Enrichment
        </h4>
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
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Field Rows */}
      <div className="divide-y divide-border/40">
        {DISPLAY_FIELDS.map(({ field, trackKey }) => (
          <EnrichmentSuggestionRow
            key={field}
            fieldLabel={FIELD_LABELS[field] ?? ENRICHMENT_FIELD_LABELS[field]}
            currentValue={getTrackFieldValue(track, trackKey)}
            suggestion={suggestions.find((s) => s.field === field)}
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
            <EnrichmentStatusBadge
              key={source}
              status="found"
            />
          ))}
        </div>
      )}
    </div>
  )
}
