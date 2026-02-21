import { SeverityBadge } from '../SeverityBadge'
import { DriftGraph } from '../DriftGraph'
import { InfoItem } from './InfoItem'
import { WaveformPlayer } from '@/features/waveform'
import { BeatgridEditor } from '@/features/beatgrid/components/BeatgridEditor'
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

  // GENERIERUNGS-Modus: Tracks ohne Grid, mit generiertem Beatgrid
  if (generatedGrid && generatedGrid.method !== 'skipped' && pcmData) {
    return (
      <div className="space-y-4 pr-4">
        <BeatgridEditor
          trackId={trackId}
          pcmData={pcmData}
          audioFileHandle={audioFileHandle}
          generatedGrid={generatedGrid}
          beatTimestamps={rawBeatTimestamps ?? []}
          duration={duration}
        />
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Methode" value="Generiert" />
          <InfoItem label="Beats Detected" value={String(result.beatsAnalyzed)} />
          {generatedGrid.isVariableBpm && (
            <div className="col-span-2">
              <SeverityBadge severity="warning" />
              <span className="ml-2 text-sm">Variable BPM detected</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // VERIFIKATIONS-Modus: Tracks mit vorhandenem Grid
  return (
    <div className="space-y-4 pr-4">
      {/* Gespeichertes Grid */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Gespeichertes Grid</p>
        <WaveformPlayer
          pcmData={pcmData}
          audioFileHandle={audioFileHandle}
          duration={duration}
          tempoMarkers={tempoMarkers}
          zoomEnabled
        />
      </div>

      {/* Erkannte Beats */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Erkannte Beats</p>
        <WaveformPlayer
          pcmData={pcmData}
          duration={duration}
          beatDriftPoints={result.driftPoints}
          zoomEnabled
        />
      </div>

      <DriftGraph driftPoints={result.driftPoints} duration={duration} />
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
