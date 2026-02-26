'use client'

import { formatConfidence, confidenceColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TrackBeatgridResult, TrackBpmResult } from '@/types/analysis'

interface GridStatStripProps {
  result: TrackBeatgridResult
  bpm: number
  liveAvgDriftMs?: number
  liveOffBeatMs?: number | undefined
  trackBpmResult?: TrackBpmResult
  energyRating?: number
  onAcceptBpm?: () => void
}

function GridPrecisionBar({ avgDriftMs, bpm }: { avgDriftMs: number; bpm: number }) {
  const beatIntervalMs = bpm > 0 ? 60000 / bpm : 468
  const beatPct = (avgDriftMs / beatIntervalMs) * 100
  const barPct = Math.min(100, (avgDriftMs / 50) * 100)
  const severity = avgDriftMs < 10 ? 'ok' : avgDriftMs < 30 ? 'warning' : 'error'
  const barColor = severity === 'ok' ? 'bg-chart-2' : severity === 'warning' ? 'bg-chart-5' : 'bg-destructive'
  const textColor = severity === 'ok' ? 'text-chart-2' : severity === 'warning' ? 'text-chart-5' : 'text-destructive'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">Grid Precision</span>
        <span className={`font-mono tabular-nums ${textColor}`}>
          {avgDriftMs.toFixed(1)}ms · {beatPct.toFixed(0)}% beat
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-[20%] bg-chart-2/15" />
        <div className="absolute inset-y-0 left-[20%] w-[40%] bg-chart-5/10" />
        <div className="absolute inset-y-0 left-[60%] right-0 bg-destructive/10" />
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 opacity-85 ${barColor}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>0ms</span>
        <span>10ms</span>
        <span>30ms</span>
        <span>50ms+</span>
      </div>
    </div>
  )
}

function BpmCompareStrip({ trackBpmResult, onAcceptBpm }: { trackBpmResult: TrackBpmResult; onAcceptBpm?: () => void }) {
  const { storedBpm, detectedBpm, bpmDelta } = trackBpmResult
  if (detectedBpm == null) return null

  const absDelta = bpmDelta != null ? Math.abs(bpmDelta) : 0
  const deltaColor = absDelta < 0.5 ? 'text-chart-2' : absDelta < 2.0 ? 'text-chart-5' : 'text-destructive'
  const showAccept = bpmDelta != null && absDelta > 0 && onAcceptBpm

  return (
    <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
      {storedBpm != null && (
        <>
          <span className="text-muted-foreground">Original:</span>
          <span>{storedBpm.toFixed(2)}</span>
          <span className="text-muted-foreground/50">|</span>
        </>
      )}
      <span className="text-muted-foreground">Analysiert:</span>
      <span>{detectedBpm.toFixed(2)}</span>
      {bpmDelta != null && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <span className={deltaColor}>
            {'\u0394'} {bpmDelta > 0 ? '+' : ''}{bpmDelta.toFixed(2)}
          </span>
        </>
      )}
      {showAccept && (
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs ml-1" onClick={onAcceptBpm}>
          BPM uebernehmen
        </Button>
      )}
    </div>
  )
}

function EnergyBadge({ rating }: { rating: number }) {
  const color = rating <= 3
    ? 'text-blue-400'
    : rating <= 6
      ? 'text-chart-2'
      : rating <= 9
        ? 'text-orange-400'
        : 'text-destructive'

  return (
    <span className={`text-xs font-mono ${color}`}>
      Energy: {rating}/10
    </span>
  )
}

export function GridStatStrip({ result, bpm, liveAvgDriftMs, liveOffBeatMs, trackBpmResult, energyRating, onAcceptBpm }: GridStatStripProps) {
  const avgDriftMs = liveAvgDriftMs ?? result.avgDriftMs
  const offBeatMs = liveOffBeatMs !== undefined ? liveOffBeatMs : result.offBeatMs
  const driftColor = avgDriftMs < 10 ? 'text-chart-2' : avgDriftMs < 30 ? 'text-chart-5' : 'text-destructive'
  const showBarAlignment = result.outOfPhaseBeats !== undefined && avgDriftMs < 30

  return (
    <div className="space-y-1.5">
      {/* BPM-Vergleich */}
      {trackBpmResult && (
        <BpmCompareStrip trackBpmResult={trackBpmResult} onAcceptBpm={onAcceptBpm} />
      )}
      {/* Inline Stats */}
      <div className="flex items-center gap-1 text-xs font-mono flex-wrap">
        <span className="text-muted-foreground">Drift:</span>
        <span className={driftColor}>{avgDriftMs.toFixed(1)}ms</span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground">Confidence:</span>
        <span className={confidenceColor(result.confidence)}>{formatConfidence(result.confidence)}</span>
        {offBeatMs !== undefined && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">Offset:</span>
            <span className={Math.abs(offBeatMs) > 10 ? 'text-chart-5' : 'text-muted-foreground'}>
              {offBeatMs > 0 ? '+' : ''}{offBeatMs.toFixed(1)}ms
              {' '}({offBeatMs > 0 ? 'zu frueh' : 'zu spaet'})
            </span>
          </>
        )}
        {showBarAlignment && (
          <>
            <span className="text-muted-foreground/50">·</span>
            {result.outOfPhaseBeats === 0
              ? <span className="text-chart-2">In Phase</span>
              : <span className="text-chart-5">Beat 1 → Beat 2</span>
            }
          </>
        )}
        {energyRating != null && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <EnergyBadge rating={energyRating} />
          </>
        )}
      </div>
      {/* Precision Bar */}
      {(result.beatsMatched > 0 || liveAvgDriftMs !== undefined) && (
        <GridPrecisionBar avgDriftMs={avgDriftMs} bpm={bpm} />
      )}
    </div>
  )
}
