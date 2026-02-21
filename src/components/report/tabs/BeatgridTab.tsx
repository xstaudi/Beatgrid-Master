'use client'

import { useState, useMemo, useCallback } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '../SeverityBadge'
import { InfoItem } from './InfoItem'
import { BeatgridEditor } from '@/features/beatgrid/components/BeatgridEditor'
import { WaveformPlayer } from '@/features/waveform'
import { computeLivePrecision } from '@/features/beatgrid/services/beatgrid-phase'
import type { TrackBeatgridResult } from '@/types/analysis'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import type { TempoMarker } from '@/types/track'
import type { GeneratedBeatgrid } from '@/features/beatgrid'
import { formatConfidence, confidenceColor } from '@/lib/utils'

interface BeatgridTabProps {
  result: TrackBeatgridResult
  pcmData: PcmData | null
  audioFileHandle?: AudioFileHandle | null
  tempoMarkers: TempoMarker[]
  duration: number
  trackId: string
  generatedGrid?: GeneratedBeatgrid | null
  rawBeatTimestamps?: number[]
}

function WaveformLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
      {children}
    </p>
  )
}

function GridPrecisionBar({ avgDriftMs, bpm }: { avgDriftMs: number; bpm: number }) {
  const beatIntervalMs = bpm > 0 ? 60000 / bpm : 468
  const beatPct = (avgDriftMs / beatIntervalMs) * 100
  // Bar scale: 0–50ms (> 50ms = vollstaendig ausgefuellt)
  const barPct = Math.min(100, (avgDriftMs / 50) * 100)
  const severity = avgDriftMs < 10 ? 'ok' : avgDriftMs < 30 ? 'warning' : 'error'
  const barColor = severity === 'ok' ? 'bg-chart-2' : severity === 'warning' ? 'bg-chart-5' : 'bg-destructive'
  const textColor = severity === 'ok' ? 'text-chart-2' : severity === 'warning' ? 'text-chart-5' : 'text-destructive'

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Grid Precision</span>
        <span className={`font-mono font-medium tabular-nums ${textColor}`}>
          {avgDriftMs.toFixed(1)}ms · {beatPct.toFixed(0)}% beat
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        {/* Zonen: gruen (0-20%), gelb (20-60%), rot (60-100%) */}
        <div className="absolute inset-y-0 left-0 w-[20%] bg-chart-2/15" />
        <div className="absolute inset-y-0 left-[20%] w-[40%] bg-chart-5/10" />
        <div className="absolute inset-y-0 left-[60%] right-0 bg-destructive/10" />
        {/* Fuellbalken */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 opacity-85 ${barColor}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0ms</span>
        <span>10ms</span>
        <span>30ms</span>
        <span>50ms+</span>
      </div>
    </div>
  )
}

interface LiveStats {
  avgDriftMs: number
  offBeatMs: number | undefined
}

function DriftStats({ result, bpm, showDriftPoints, onToggleDrift, liveStats }: {
  result: TrackBeatgridResult
  bpm: number
  showDriftPoints: boolean
  onToggleDrift: () => void
  liveStats?: LiveStats
}) {
  const avgDriftMs = liveStats?.avgDriftMs ?? result.avgDriftMs
  const offBeatMs = liveStats !== undefined ? liveStats.offBeatMs : result.offBeatMs

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="Avg Drift" value={`${avgDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Max Drift" value={`${result.maxDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Confidence" value={formatConfidence(result.confidence)} className={confidenceColor(result.confidence)} />
        <InfoItem label="Beats Analyzed" value={String(result.beatsAnalyzed)} />
      </div>
      {(result.beatsMatched > 0 || liveStats !== undefined) && (
        <GridPrecisionBar avgDriftMs={avgDriftMs} bpm={bpm} />
      )}
      {offBeatMs !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Phase Offset</span>
          <span className={Math.abs(offBeatMs) > 10 ? 'font-mono text-chart-5' : 'font-mono text-muted-foreground'}>
            {offBeatMs > 0 ? '+' : ''}{offBeatMs.toFixed(1)}ms
            {' '}({offBeatMs > 0 ? 'zu früh' : 'zu spät'})
          </span>
        </div>
      )}
      {result.outOfPhaseBeats !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Bar Alignment</span>
          {result.outOfPhaseBeats === 0
            ? <span className="text-chart-2 font-medium">In Phase</span>
            : <span className="text-chart-5 font-medium">Beat 1 → Beat 2</span>
          }
        </div>
      )}
      {result.driftPoints.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={onToggleDrift}
        >
          {showDriftPoints ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
          Erkannte Beats {showDriftPoints ? 'ausblenden' : 'einblenden'}
        </Button>
      )}
    </div>
  )
}

export function BeatgridTab({
  result,
  pcmData,
  audioFileHandle,
  tempoMarkers,
  duration,
  trackId,
  generatedGrid,
  rawBeatTimestamps,
}: BeatgridTabProps) {
  const [syncView, setSyncView] = useState<{ start: number; end: number } | null>(null)
  const [showDriftPoints, setShowDriftPoints] = useState(false)
  const [livePhaseOffset, setLivePhaseOffset] = useState<number | null>(
    generatedGrid ? generatedGrid.phaseOffsetSec : null,
  )

  const handlePhaseOffsetChange = useCallback((offset: number) => {
    setLivePhaseOffset(offset)
  }, [])

  const liveStats = useMemo<LiveStats | undefined>(() => {
    if (livePhaseOffset === null || !rawBeatTimestamps?.length || !generatedGrid) return undefined
    return computeLivePrecision(rawBeatTimestamps, livePhaseOffset, generatedGrid.medianBpm, duration)
  }, [livePhaseOffset, rawBeatTimestamps, generatedGrid, duration])

  if (result.skipReason) {
    const skipLabels: Record<string, string> = {
      'no-pcm': 'Keine Audiodaten verfuegbar',
      'no-beats-detected': 'Keine Beats erkannt',
      'no-grid': 'Kein gespeichertes Grid vorhanden',
      'variable-bpm': 'Variables Tempo erkannt',
    }
    return (
      <p className="text-sm text-muted-foreground">
        Uebersprungen: {skipLabels[result.skipReason] ?? result.skipReason}
      </p>
    )
  }

  const hasStoredGrid = tempoMarkers.length > 0
  const hasGeneratedGrid = generatedGrid != null && generatedGrid.method !== 'skipped' && pcmData != null
  const bpm = tempoMarkers[0]?.bpm ?? generatedGrid?.medianBpm ?? 128

  // Case 1: Kein gespeichertes Grid → nur BeatgridEditor (muss freigegeben werden)
  if (!hasStoredGrid && hasGeneratedGrid) {
    return (
      <div className="space-y-4 pr-4">
        <WaveformLabel>Erkannte Beats</WaveformLabel>
        <BeatgridEditor
          trackId={trackId}
          pcmData={pcmData!}
          audioFileHandle={audioFileHandle}
          generatedGrid={generatedGrid!}
          beatTimestamps={rawBeatTimestamps ?? []}
          duration={duration}
        />
        {generatedGrid!.isVariableBpm && (
          <div className="flex items-center gap-2">
            <SeverityBadge severity="warning" />
            <span className="text-sm">Variable BPM detected</span>
          </div>
        )}
      </div>
    )
  }

  // Case 2: Gespeichertes Grid + verbessertes generiertes Grid → beide zeigen
  if (hasStoredGrid && hasGeneratedGrid) {
    return (
      <div className="space-y-4 pr-4">
        <div>
          <WaveformLabel>Original Grid</WaveformLabel>
          <WaveformPlayer
            pcmData={pcmData}
            audioFileHandle={audioFileHandle}
            duration={duration}
            tempoMarkers={tempoMarkers}
            beatDriftPoints={showDriftPoints ? result.driftPoints : undefined}
            zoomEnabled
            onViewChange={(vs, ve) => setSyncView({ start: vs, end: ve })}
          />
        </div>
        <div>
          <WaveformLabel>Korrigiertes Grid</WaveformLabel>
          <BeatgridEditor
            trackId={trackId}
            pcmData={pcmData!}
            audioFileHandle={audioFileHandle}
            generatedGrid={generatedGrid!}
            beatTimestamps={rawBeatTimestamps ?? []}
            duration={duration}
            onPhaseOffsetChange={handlePhaseOffsetChange}
          />
        </div>
        <DriftStats
          result={result}
          bpm={bpm}
          showDriftPoints={showDriftPoints}
          onToggleDrift={() => setShowDriftPoints((s) => !s)}
          liveStats={liveStats}
        />
        {generatedGrid!.isVariableBpm && (
          <div className="flex items-center gap-2">
            <SeverityBadge severity="warning" />
            <span className="text-sm">Variable BPM detected</span>
          </div>
        )}
      </div>
    )
  }

  // Case 3: Kein Grid (weder gespeichert noch generiert) → Hinweis
  if (!hasStoredGrid && !hasGeneratedGrid) {
    const hasBeats = rawBeatTimestamps && rawBeatTimestamps.length > 0
    const reason = hasBeats
      ? `${rawBeatTimestamps!.length} Beats erkannt – Grid-Generierung fehlgeschlagen (variables Tempo oder zu wenig Beats)`
      : 'Keine Beats erkannt – Beatgrid konnte nicht generiert werden'
    return (
      <div className="space-y-4 pr-4">
        {pcmData && (
          <WaveformPlayer
            pcmData={pcmData}
            audioFileHandle={audioFileHandle}
            duration={duration}
            zoomEnabled
          />
        )}
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
    )
  }

  // Case 4: Nur gespeichertes Grid, keine Verbesserung → Waveform + Drift-Stats
  return (
    <div className="space-y-4 pr-4">
      <WaveformPlayer
        pcmData={pcmData}
        audioFileHandle={audioFileHandle}
        duration={duration}
        tempoMarkers={tempoMarkers}
        beatDriftPoints={showDriftPoints ? result.driftPoints : undefined}
        zoomEnabled
        onViewChange={(vs, ve) => setSyncView({ start: vs, end: ve })}
      />
      <DriftStats
        result={result}
        bpm={bpm}
        showDriftPoints={showDriftPoints}
        onToggleDrift={() => setShowDriftPoints((s) => !s)}
      />
      {result.isVariableBpm && (
        <div className="flex items-center gap-2">
          <SeverityBadge severity="warning" />
          <span className="text-sm">Variable BPM detected</span>
        </div>
      )}
    </div>
  )
}
