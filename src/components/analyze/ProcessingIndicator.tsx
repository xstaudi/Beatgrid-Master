'use client'

import { useMemo, useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WaveformLoader } from '@/components/analyze/WaveformLoader'
import { useProcessingStore } from '@/stores/processing-store'
import {
  selectOverallProgress,
  selectCompletedCount,
  selectTotalCount,
  selectErrorCount,
} from '@/stores/processing-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AudioLines,
  Settings2,
  SkipForward,
  Activity,
} from 'lucide-react'
import type { TrackProcessingStatus, TrackProcessingState } from '@/types/audio'

const STATUS_CONFIG: Record<TrackProcessingStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  queued: { icon: Clock, label: 'Warteschlange', className: 'text-muted-foreground' },
  decoding: { icon: AudioLines, label: 'Dekodiert', className: 'text-primary animate-pulse' },
  processing: { icon: Settings2, label: 'Verarbeitet', className: 'text-accent-foreground animate-pulse' },
  analyzing: { icon: Activity, label: 'Analysiert', className: 'text-violet-500 animate-pulse' },
  complete: { icon: CheckCircle2, label: 'Fertig', className: 'text-chart-2' },
  error: { icon: XCircle, label: 'Fehler', className: 'text-destructive' },
  skipped: { icon: SkipForward, label: 'Übersprungen', className: 'text-muted-foreground' },
}

const PHASE_TEXTS: Record<string, string[]> = {
  decoding: [
    'Audio wird dekodiert...',
    'Bereite Audiodaten vor...',
    'Lese Audiodateien...',
  ],
  analyzing: [
    'Analysiere Beatgrids...',
    'Prüfe Taktgenauigkeit...',
    'Erkenne Beats...',
  ],
  processing: [
    'Verarbeite Ergebnisse...',
    'Berechne Resultate...',
  ],
  completing: [
    'Fast fertig...',
    'Noch wenige Tracks...',
  ],
}

function getPhase(trackStates: Map<string, TrackProcessingState>, progress: number): string {
  if (progress > 85) return 'completing'
  for (const state of trackStates.values()) {
    if (state.status === 'analyzing') return 'analyzing'
    if (state.status === 'decoding') return 'decoding'
    if (state.status === 'processing') return 'processing'
  }
  return 'processing'
}

function useRotatingText(texts: string[], intervalMs = 3000): string {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (texts.length <= 1) return
    setIndex(0)
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [texts, intervalMs])

  return texts[index] ?? texts[0]
}

interface ProcessingIndicatorProps {
  trackNames?: Map<string, string>
}

export function ProcessingIndicator({ trackNames }: ProcessingIndicatorProps) {
  const isDecoding = useProcessingStore((s) => s.isProcessing)
  const isAnalyzing = useAnalysisStore((s) => s.isRunning)
  const isProcessing = isDecoding || isAnalyzing
  const trackStates = useProcessingStore((s) => s.trackStates)
  const progress = useProcessingStore(selectOverallProgress)
  const completed = useProcessingStore(selectCompletedCount)
  const total = useProcessingStore(selectTotalCount)
  const errors = useProcessingStore(selectErrorCount)

  const phase = useMemo(() => getPhase(trackStates, progress), [trackStates, progress])
  const phaseTexts = PHASE_TEXTS[phase] ?? PHASE_TEXTS.processing
  const phaseText = useRotatingText(phaseTexts)

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
      <CardContent className="space-y-5 py-6">
        {/* Waveform Loader */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-3">
            <WaveformLoader />
            <p className="text-sm font-medium text-muted-foreground transition-opacity duration-500">
              {phaseText}
            </p>
          </div>
        )}

        {/* Abgeschlossen */}
        {!isProcessing && (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
            <span className="font-medium">Analyse abgeschlossen</span>
          </div>
        )}

        {/* Fortschritt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="tabular-nums text-muted-foreground">
              {completed} / {total} Tracks
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Fehler */}
        {errors > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              {errors} {errors === 1 ? 'Fehler' : 'Fehler'}
            </Badge>
          </div>
        )}

        {/* Track-Liste */}
        <div className="max-h-[280px] overflow-y-auto">
          <div className="space-y-0.5 pr-2">
            {sortedStates.map((state) => {
              const config = STATUS_CONFIG[state.status]
              const Icon = config.icon
              const name = trackNames?.get(state.trackId) ?? state.trackId

              return (
                <div
                  key={state.trackId}
                  className="flex items-center gap-2 rounded-md px-2 py-0.5 text-xs"
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${config.className}`} />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {(state.status === 'decoding' || state.status === 'processing' || state.status === 'analyzing') && (
                    <span className="shrink-0 tabular-nums text-muted-foreground">
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
        </div>
      </CardContent>
    </Card>
  )
}
