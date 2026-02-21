import { SeverityBadge } from '../SeverityBadge'
import { DriftGraph } from '../DriftGraph'
import { InfoItem } from './InfoItem'
import { WaveformPlayer } from '@/features/waveform'
import type { TrackBeatgridResult } from '@/types/analysis'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import type { TempoMarker } from '@/types/track'

interface BeatgridTabProps {
  result: TrackBeatgridResult
  pcmData: PcmData | null
  audioFileHandle?: AudioFileHandle | null
  tempoMarkers: TempoMarker[]
  duration: number
}

export function BeatgridTab({ result, pcmData, audioFileHandle, tempoMarkers, duration }: BeatgridTabProps) {
  if (result.skipReason) {
    return <p className="text-sm text-muted-foreground">Skipped: {result.skipReason}</p>
  }

  return (
    <div className="space-y-4 pr-4">
      <WaveformPlayer
        pcmData={pcmData}
        audioFileHandle={audioFileHandle}
        duration={duration}
        tempoMarkers={tempoMarkers}
        beatDriftPoints={result.driftPoints}
      />
      <DriftGraph driftPoints={result.driftPoints} duration={duration} />
      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="Avg Drift" value={`${result.avgDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Max Drift" value={`${result.maxDriftMs.toFixed(1)}ms`} />
        <InfoItem label="Confidence" value={`${result.confidence}%`} />
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
