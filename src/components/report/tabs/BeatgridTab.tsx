'use client'

import { useState, useMemo, useCallback } from 'react'
import { SeverityBadge } from '../SeverityBadge'
import { BeatgridEditor } from '@/features/beatgrid/components/BeatgridEditor'
import { WaveformPlayer } from '@/features/waveform'
import { WaveformOverlayBar, type OverlayId, type OverlayState } from '@/features/beatgrid/components/WaveformOverlayBar'
import { GridStatStrip } from '@/features/beatgrid/components/GridStatStrip'
import { computeLivePrecision } from '@/features/beatgrid/services/beatgrid-phase'
import type { TrackBeatgridResult, TrackBpmResult } from '@/types/analysis'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import type { TempoMarker } from '@/types/track'
import type { GeneratedBeatgrid } from '@/features/beatgrid'

interface BeatgridTabProps {
  result: TrackBeatgridResult
  pcmData: PcmData | null
  audioFileHandle?: AudioFileHandle | null
  tempoMarkers: TempoMarker[]
  duration: number
  trackId: string
  generatedGrid?: GeneratedBeatgrid | null
  rawBeatTimestamps?: number[]
  kickOnsets?: number[]
  trackBpmResult?: TrackBpmResult
  energyRating?: number
  onAcceptBpm?: () => void
}

function WaveformLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
      {children}
    </p>
  )
}

interface LiveStats {
  avgDriftMs: number
  offBeatMs: number | undefined
}

const defaultOverlays: OverlayState = {
  grid: true, kicks: true, beats: false,
  low: true, mid: true, high: true,
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
  kickOnsets,
  trackBpmResult,
  energyRating,
  onAcceptBpm,
}: BeatgridTabProps) {
  const [syncView, setSyncView] = useState<{ start: number; end: number } | null>(null)
  const [overlays, setOverlays] = useState<OverlayState>(defaultOverlays)
  const [livePhaseOffset, setLivePhaseOffset] = useState<number | null>(
    generatedGrid ? generatedGrid.phaseOffsetSec : null,
  )

  const handleToggleOverlay = useCallback((id: OverlayId) => {
    setOverlays((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handlePhaseOffsetChange = useCallback((offset: number) => {
    setLivePhaseOffset(offset)
  }, [])

  const liveStats = useMemo<LiveStats | undefined>(() => {
    if (livePhaseOffset === null || !rawBeatTimestamps?.length || !generatedGrid) return undefined
    return computeLivePrecision(rawBeatTimestamps, livePhaseOffset, generatedGrid.medianBpm, duration)
  }, [livePhaseOffset, rawBeatTimestamps, generatedGrid, duration])

  const visibleBands = useMemo(() => ({
    low: overlays.low, mid: overlays.mid, high: overlays.high,
  }), [overlays.low, overlays.mid, overlays.high])

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

  // Kick-Onsets filtern: Sub-Beat-Intervalle entfernen fuer saubere Anzeige
  const filteredKicks = useMemo(() => {
    if (!kickOnsets?.length || bpm <= 0) return kickOnsets
    const minInterval = (60 / bpm) * 0.7
    const filtered = [kickOnsets[0]]
    for (let i = 1; i < kickOnsets.length; i++) {
      if (kickOnsets[i] - filtered[filtered.length - 1] >= minInterval) {
        filtered.push(kickOnsets[i])
      }
    }
    return filtered
  }, [kickOnsets, bpm])

  const hasKickOnsets = (filteredKicks?.length ?? 0) > 0
  const hasDriftPoints = result.driftPoints.length > 0
  const hasDetectedBeats = (rawBeatTimestamps?.length ?? 0) > 0

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
          kickOnsets={filteredKicks}
          showKickOnsets={overlays.kicks}
          showGridLines={overlays.grid}
          showBeats={overlays.beats}
          duration={duration}
          visibleBands={visibleBands}
        />
        <WaveformOverlayBar
          overlays={overlays}
          onToggle={handleToggleOverlay}
          hasKickOnsets={hasKickOnsets}
          hasDriftPoints={hasDriftPoints}
          hasDetectedBeats={hasDetectedBeats}
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
            tempoMarkers={overlays.grid ? tempoMarkers : undefined}
            beatDriftPoints={overlays.beats ? result.driftPoints : undefined}
            kickOnsets={overlays.kicks ? filteredKicks : undefined}
            detectedBeats={overlays.beats ? rawBeatTimestamps : undefined}
            zoomEnabled
            controlledViewStart={syncView?.start}
            controlledViewEnd={syncView?.end}
            visibleBands={visibleBands}
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
            kickOnsets={filteredKicks}
            showKickOnsets={overlays.kicks}
            showGridLines={overlays.grid}
            showBeats={overlays.beats}
            duration={duration}
            onPhaseOffsetChange={handlePhaseOffsetChange}
            onViewChange={(vs, ve) => setSyncView({ start: vs, end: ve })}
            visibleBands={visibleBands}
          />
        </div>
        <WaveformOverlayBar
          overlays={overlays}
          onToggle={handleToggleOverlay}
          hasKickOnsets={hasKickOnsets}
          hasDriftPoints={hasDriftPoints}
          hasDetectedBeats={hasDetectedBeats}
        />
        <GridStatStrip
          result={result}
          bpm={bpm}
          liveAvgDriftMs={liveStats?.avgDriftMs}
          liveOffBeatMs={liveStats !== undefined ? liveStats.offBeatMs : undefined}
          trackBpmResult={trackBpmResult}
          energyRating={energyRating}
          onAcceptBpm={onAcceptBpm}
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
            visibleBands={visibleBands}
          />
        )}
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
    )
  }

  // Case 4: Nur gespeichertes Grid, keine Verbesserung → Waveform + Stats
  return (
    <div className="space-y-4 pr-4">
      <WaveformPlayer
        pcmData={pcmData}
        audioFileHandle={audioFileHandle}
        duration={duration}
        tempoMarkers={overlays.grid ? tempoMarkers : undefined}
        beatDriftPoints={overlays.beats ? result.driftPoints : undefined}
        kickOnsets={overlays.kicks ? filteredKicks : undefined}
        detectedBeats={overlays.beats ? rawBeatTimestamps : undefined}
        zoomEnabled
        onViewChange={(vs, ve) => setSyncView({ start: vs, end: ve })}
        visibleBands={visibleBands}
      />
      <WaveformOverlayBar
        overlays={overlays}
        onToggle={handleToggleOverlay}
        hasKickOnsets={hasKickOnsets}
        hasDriftPoints={hasDriftPoints}
        hasDetectedBeats={hasDetectedBeats}
      />
      <GridStatStrip
        result={result}
        bpm={bpm}
        trackBpmResult={trackBpmResult}
        energyRating={energyRating}
        onAcceptBpm={onAcceptBpm}
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
