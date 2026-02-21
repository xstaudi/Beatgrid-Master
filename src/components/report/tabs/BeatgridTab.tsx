'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '../SeverityBadge'
import { InfoItem } from './InfoItem'
import { BeatgridEditor } from '@/features/beatgrid/components/BeatgridEditor'
import { WaveformPlayer } from '@/features/waveform'
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

function DriftStats({ result, showDriftPoints, onToggleDrift }: {
  result: TrackBeatgridResult
  showDriftPoints: boolean
  onToggleDrift: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="Avg Drift" value={`${result.avgDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Max Drift" value={`${result.maxDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Confidence" value={formatConfidence(result.confidence)} className={confidenceColor(result.confidence)} />
        <InfoItem label="Beats Analyzed" value={String(result.beatsAnalyzed)} />
      </div>
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
          />
        </div>
        <DriftStats
          result={result}
          showDriftPoints={showDriftPoints}
          onToggleDrift={() => setShowDriftPoints((s) => !s)}
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
