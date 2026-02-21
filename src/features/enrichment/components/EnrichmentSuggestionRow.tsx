'use client'

import { Check, X, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnrichmentStatusBadge } from './EnrichmentStatusBadge'
import { ENRICHMENT_SOURCE_LABELS } from '../constants'
import type { FieldSuggestion, EnrichmentField } from '@/types/enrichment'

interface EnrichmentSuggestionRowProps {
  fieldLabel: string
  currentValue: string | null
  suggestion: FieldSuggestion | undefined
  onAccept: (field: EnrichmentField) => void
  onReject: (field: EnrichmentField) => void
  onUndo: (field: EnrichmentField) => void
}

export function EnrichmentSuggestionRow({
  fieldLabel,
  currentValue,
  suggestion,
  onAccept,
  onReject,
  onUndo,
}: EnrichmentSuggestionRowProps) {
  const hasValue = currentValue && currentValue.trim().length > 0
  const hasSuggestion = suggestion && suggestion.status !== 'rejected'

  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-x-3 py-1.5 px-1">
      <span className="text-xs text-muted-foreground/70 truncate">{fieldLabel}</span>
      <div className="min-w-0 flex items-center gap-2">
        {/* Aktueller Wert oder leer */}
        {hasValue ? (
          <span className="text-xs font-mono">{currentValue}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground/40">leer</span>
        )}

        {/* Suggestion (nur wenn Feld leer und Vorschlag vorhanden) */}
        {!hasValue && suggestion && (
          <>
            {suggestion.status === 'pending' && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs font-mono text-primary">{suggestion.value}</span>
                <span className="text-[9px] text-muted-foreground/50">
                  {ENRICHMENT_SOURCE_LABELS[suggestion.source]} {suggestion.confidence}%
                </span>
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
            )}

            {suggestion.status === 'accepted' && (
              <div className="flex items-center gap-1.5 ml-auto">
                <EnrichmentStatusBadge status="accepted" />
                <span className="text-xs font-mono text-chart-2">{suggestion.value}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-foreground"
                  onClick={() => onUndo(suggestion.field)}
                  title="Rueckgaengig"
                >
                  <Undo2 className="size-3" />
                </Button>
              </div>
            )}

            {suggestion.status === 'rejected' && (
              <div className="flex items-center gap-1.5 ml-auto">
                <EnrichmentStatusBadge status="rejected" />
              </div>
            )}
          </>
        )}

        {/* Feld nicht leer = ok */}
        {hasValue && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-2 ml-auto shrink-0" />
        )}

        {/* Feld leer + kein Vorschlag */}
        {!hasValue && !suggestion && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-5 ml-auto shrink-0" />
        )}
      </div>
    </div>
  )
}
