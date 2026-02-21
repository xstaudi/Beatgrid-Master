'use client'

import { Check, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFixStore } from '@/stores/fix-store'
import type { FixKind } from '@/types/fix'

interface FixActionBarProps {
  trackId: string
  fixKind: FixKind
}

export function FixActionBar({ trackId, fixKind }: FixActionBarProps) {
  const fix = useFixStore((s) =>
    s.fixes.find((f) => f.operation.trackId === trackId && f.operation.kind === fixKind),
  )
  const setFixStatus = useFixStore((s) => s.setFixStatus)

  if (!fix) return null

  const { status, preview } = fix
  const isApproved = status === 'approved'
  const isSkipped = status === 'skipped'

  return (
    <div
      className={`mt-4 border px-3 py-2.5 space-y-2 transition-colors ${
        isApproved
          ? 'border-chart-2/50 bg-chart-2/5'
          : isSkipped
          ? 'border-border/30 opacity-50'
          : 'border-primary/40 bg-primary/5'
      }`}
    >
      {/* Vorher → Nachher */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-muted-foreground">{preview.before}</span>
        <span className="text-primary/60">→</span>
        <span className={isApproved ? 'text-chart-2 font-semibold' : 'text-foreground font-semibold'}>
          {preview.after}
        </span>
        <span className="ml-1 text-muted-foreground/60 font-sans">{preview.label}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isApproved ? 'default' : 'outline'}
          className={`h-7 text-xs px-3 ${isApproved ? 'bg-chart-2 hover:bg-chart-2/90 border-chart-2' : ''}`}
          onClick={() => setFixStatus(trackId, fixKind, isApproved ? 'pending' : 'approved')}
        >
          <Check className="h-3 w-3 mr-1" />
          {isApproved ? 'Uebernommen' : 'Uebernehmen'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`h-7 text-xs px-3 ${isSkipped ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setFixStatus(trackId, fixKind, isSkipped ? 'pending' : 'skipped')}
        >
          <SkipForward className="h-3 w-3 mr-1" />
          {isSkipped ? 'Uebersprungen' : 'Ueberspringen'}
        </Button>
      </div>
    </div>
  )
}
