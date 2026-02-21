'use client'

import { Check, X, Undo2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnrichmentStatusBadge } from './EnrichmentStatusBadge'
import { ENRICHMENT_SOURCE_LABELS } from '../constants'
import type { FieldSuggestion, EnrichmentField } from '@/types/enrichment'
import type { Severity } from '@/types/analysis'

const YELLOW_FIELDS = ['album', 'year']

interface EnrichmentSuggestionRowProps {
  fieldLabel: string
  /** Feldname für Farb-Differenzierung (album/year = gelb, genre = orange) */
  fieldName?: string
  currentValue: string | null
  /** Severity aus dem Metadata-Audit */
  severity?: Severity
  /** Audit-Message (z.B. "fehlend") */
  message?: string
  suggestion: FieldSuggestion | undefined
  /** Track-level Loading (Enrichment laeuft) */
  isLoading?: boolean
  onAccept: (field: EnrichmentField) => void
  onReject: (field: EnrichmentField) => void
  onUndo: (field: EnrichmentField) => void
}

export function EnrichmentSuggestionRow({
  fieldLabel,
  fieldName,
  currentValue,
  severity = 'ok',
  message,
  suggestion,
  isLoading = false,
  onAccept,
  onReject,
  onUndo,
}: EnrichmentSuggestionRowProps) {
  const hasValue = currentValue && currentValue.trim().length > 0
  const suggestionAccepted = suggestion?.status === 'accepted'

  const dotColor = suggestionAccepted
    ? 'bg-chart-2'
    : severity === 'error'
      ? 'bg-destructive'
      : severity === 'warning' && fieldName && YELLOW_FIELDS.includes(fieldName)
        ? 'bg-chart-3'   // Gelb für album/year (bevorzugt)
        : severity === 'warning'
          ? 'bg-chart-5'   // Orange für genre (wichtig)
          : hasValue
            ? 'bg-chart-2'   // Grün wenn Wert vorhanden
            : 'bg-muted'     // Neutral für ok-felder die leer sind (nice-to-have)

  return (
    <div className="grid grid-cols-[110px_1fr_12px] items-baseline gap-x-3 py-1.5 px-1">
      <span className="text-xs text-muted-foreground/70 truncate">{fieldLabel}</span>
      <div className="min-w-0 flex items-center gap-2">
        {/* Feld ausgefuellt */}
        {hasValue && (
          <>
            <span className="text-xs font-mono">{currentValue}</span>
            {message && <span className="text-[10px] text-muted-foreground/60">{message}</span>}
          </>
        )}

        {/* Feld leer + Loading + keine Suggestion */}
        {!hasValue && isLoading && !suggestion && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-24 bg-primary/10 animate-pulse rounded" />
            <Loader2 className="size-3 animate-spin text-primary/50" />
          </div>
        )}

        {/* Feld leer + Suggestion pending */}
        {!hasValue && suggestion?.status === 'pending' && (
          <div className="flex items-center gap-1.5 w-full">
            <span className="text-xs italic text-muted-foreground/40">leer</span>
            <span className="text-xs text-primary/40">→</span>
            <span className="text-xs font-mono text-primary">{suggestion.value}</span>
            <span className="text-[9px] text-muted-foreground/50">
              {ENRICHMENT_SOURCE_LABELS[suggestion.source]} {suggestion.confidence}%
            </span>
            <div className="flex items-center gap-0.5 ml-auto shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-chart-2 hover:text-chart-2 hover:bg-chart-2/10"
                onClick={() => onAccept(suggestion.field)}
                title="Akzeptieren"
              >
                <Check className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onReject(suggestion.field)}
                title="Ablehnen"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Feld leer + Suggestion akzeptiert */}
        {!hasValue && suggestion?.status === 'accepted' && (
          <div className="flex items-center gap-1.5 w-full">
            <EnrichmentStatusBadge status="accepted" />
            <span className="text-xs font-mono text-chart-2">{suggestion.value}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 text-muted-foreground hover:text-foreground ml-auto"
              onClick={() => onUndo(suggestion.field)}
              title="Rueckgaengig"
            >
              <Undo2 className="size-3" />
            </Button>
          </div>
        )}

        {/* Feld leer + Suggestion abgelehnt */}
        {!hasValue && suggestion?.status === 'rejected' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs italic text-muted-foreground/40">leer</span>
            <EnrichmentStatusBadge status="rejected" />
          </div>
        )}

        {/* Feld leer + keine Suggestion + nicht loading */}
        {!hasValue && !suggestion && !isLoading && (
          <span className="text-xs italic text-muted-foreground/40">empty</span>
        )}
      </div>
      <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
    </div>
  )
}
