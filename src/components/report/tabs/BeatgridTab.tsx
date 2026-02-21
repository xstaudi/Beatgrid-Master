'use client'

import { useState } from 'react'
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
          <WaveformLabel>Gespeichertes Grid (Referenz)</WaveformLabel>
          <WaveformPlayer
            pcmData={pcmData}
            audioFileHandle={audioFileHandle}
            duration={duration}
            tempoMarkers={tempoMarkers}
            zoomEnabled
            onViewChange={(vs, ve) => setSyncView({ start: vs, end: ve })}
          />
        </div>
        <div>
          <WaveformLabel>Verbesserter Beatgrid</WaveformLabel>
          <BeatgridEditor
            trackId={trackId}
            pcmData={pcmData!}
            audioFileHandle={audioFileHandle}
            generatedGrid={generatedGrid!}
            beatTimestamps={rawBeatTimestamps ?? []}
            duration={duration}
          />
        </div>
        {generatedGrid!.isVariableBpm && (
          <div className="flex items-center gap-2">
            <SeverityBadge severity="warning" />
            <span className="text-sm">Variable BPM detected</span>
          </div>
        )}
      </div>
    )
  }

  // Case 3: Nur gespeichertes Grid, keine Verbesserung → Waveform + Drift-Stats
  return (
    <div className="space-y-4 pr-4">
      <WaveformPlayer
        pcmData={pcmData}
        audioFileHandle={audioFileHandle}
        duration={duration}
        tempoMarkers={tempoMarkers}
        beatDriftPoints={result.driftPoints}
        zoomEnabled
        onViewChange={(vs, ve) => setSyncView({ start: vs, end: ve })}
      />
      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="Avg Drift" value={`${result.avgDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Max Drift" value={`${result.maxDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Confidence" value={formatConfidence(result.confidence)} className={confidenceColor(result.confidence)} />
        <InfoItem label="Beats Analyzed" value={String(result.beatsAnalyzed)} />
        {result.isVariableBpm && (
          <div className="col-span-2">
            <SeverityBadge severity="warning" />
            <span className="ml-2 text-sm">Variable BPM detected</span>
          </div>
        )}
      </div>
    </div>
  )
}
