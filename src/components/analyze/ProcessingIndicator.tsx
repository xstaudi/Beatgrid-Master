'use client'

import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProcessingStore } from '@/stores/processing-store'
import {
  selectOverallProgress,
  selectCompletedCount,
  selectTotalCount,
  selectErrorCount,
} from '@/stores/processing-store'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AudioLines,
  Settings2,
  SkipForward,
  Activity,
} from 'lucide-react'
import type { TrackProcessingStatus, TrackProcessingState } from '@/types/audio'

const STATUS_CONFIG: Record<TrackProcessingStatus, { icon: typeof Loader2; label: string; className: string }> = {
  queued: { icon: Clock, label: 'Queued', className: 'text-muted-foreground' },
  decoding: { icon: AudioLines, label: 'Decoding', className: 'text-primary animate-pulse' },
  processing: { icon: Settings2, label: 'Processing', className: 'text-accent-foreground animate-pulse' },
  analyzing: { icon: Activity, label: 'Analyzing', className: 'text-violet-500 animate-pulse' },
  complete: { icon: CheckCircle2, label: 'Done', className: 'text-chart-2' },
  error: { icon: XCircle, label: 'Error', className: 'text-destructive' },
  skipped: { icon: SkipForward, label: 'Skipped', className: 'text-muted-foreground' },
}

function getPhaseLabel(trackStates: Map<string, TrackProcessingState>): string {
  for (const state of trackStates.values()) {
    if (state.status === 'analyzing') return 'Analyzing Beats...'
    if (state.status === 'decoding') return 'Decoding Audio...'
  }
  return 'Processing...'
}

interface ProcessingIndicatorProps {
  trackNames?: Map<string, string>
}

export function ProcessingIndicator({ trackNames }: ProcessingIndicatorProps) {
  const isProcessing = useProcessingStore((s) => s.isProcessing)
  const trackStates = useProcessingStore((s) => s.trackStates)
  const progress = useProcessingStore(selectOverallProgress)
  const completed = useProcessingStore(selectCompletedCount)
  const total = useProcessingStore(selectTotalCount)
  const errors = useProcessingStore(selectErrorCount)

  const sortedStates = useMemo(() => {
    const order: Record<TrackProcessingStatus, number> = {
      decoding: 0,
      analyzing: 0.5,
      processing: 1,
      queued: 2,
      error: 3,
      complete: 4,
      skipped: 5,
    }
    return Array.from(trackStates.values()).sort(
      (a, b) => order[a.status] - order[b.status],
    )
  }, [trackStates])

  if (total === 0) return null

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {/* Overall progress */}
        <div className="flex items-center gap-3">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
          )}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {isProcessing ? getPhaseLabel(trackStates) : 'Processing Complete'}
              </span>
              <span className="text-muted-foreground">
                {completed} / {total}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Error summary */}
        {errors > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              {errors} {errors === 1 ? 'Error' : 'Errors'}
            </Badge>
          </div>
        )}

        {/* Per-track status list */}
        <ScrollArea className="max-h-48">
          <div className="space-y-1 pr-4">
            {sortedStates.map((state) => {
              const config = STATUS_CONFIG[state.status]
              const Icon = config.icon
              const name = trackNames?.get(state.trackId) ?? state.trackId

              return (
                <div
                  key={state.trackId}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${config.className}`} />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {(state.status === 'decoding' || state.status === 'processing' || state.status === 'analyzing') && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {Math.round(state.progress)}%
                    </span>
                  )}
                  {state.status === 'error' && state.error && (
                    <span className="shrink-0 truncate text-xs text-destructive max-w-[200px]">
                      {state.error}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
