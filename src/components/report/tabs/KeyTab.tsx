'use client'

import { useState } from 'react'
import type { TrackKeyResult } from '@/types/analysis'
import { formatConfidence, confidenceColor } from '@/lib/utils'
import { KEY_MATCH_LABELS, KEY_NOTATION_OPTIONS } from '@/features/key/constants'
import type { KeyNotation } from '@/features/key/constants'
import { detectKeyNotation, keyToNotation } from '@/features/key'

const NOTATION_LABELS: Record<KeyNotation, string> = {
  musical: 'Musical',
  camelot: 'Camelot',
  openKey: 'Open Key',
}

interface KeyTabProps {
  result: TrackKeyResult
}

const matchColor: Record<TrackKeyResult['match'], string> = {
  match: 'text-chart-2',
  mismatch: 'text-destructive',
  relative: 'text-chart-5',
  'no-library-key': 'text-muted-foreground',
  'no-detection': 'text-muted-foreground',
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-x-3 py-1.5 px-1 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground/70">{label}</span>
      <span className={`text-xs font-mono ${className ?? ''}`}>{value}</span>
    </div>
  )
}

export function KeyTab({ result }: KeyTabProps) {
  const defaultNotation = result.libraryKey
    ? detectKeyNotation(result.libraryKey)
    : 'musical'

  const [notation, setNotation] = useState<KeyNotation>(defaultNotation)

  if (result.skipReason) {
    return <p className="text-sm text-muted-foreground">Skipped: {result.skipReason}</p>
  }

  const storedDisplay = result.libraryKey
    ? (keyToNotation(result.libraryKey, notation) ?? result.libraryKey)
    : 'N/A'

  const detectedDisplay = result.detectedKey
    ? (keyToNotation(result.detectedKey, notation) ?? result.detectedKey)
    : 'N/A'

  return (
    <div className="pr-4">
      <div className="flex gap-1 mb-2">
        {KEY_NOTATION_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setNotation(opt)}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              notation === opt
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {NOTATION_LABELS[opt]}
          </button>
        ))}
      </div>

      <Row label="Gespeichert" value={storedDisplay} />
      <Row label="Erkannt" value={detectedDisplay} />
      <Row label="Confidence" value={formatConfidence(result.confidence)} className={confidenceColor(result.confidence)} />
      <Row
        label="Ergebnis"
        value={KEY_MATCH_LABELS[result.match]}
        className={matchColor[result.match]}
      />
    </div>
  )
}
