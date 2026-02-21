import { SeverityBadge } from '../SeverityBadge'
import { InfoItem } from './InfoItem'
import { FixActionBar } from '../FixActionBar'
import type { TrackBpmResult } from '@/types/analysis'

interface BpmTabProps {
  result: TrackBpmResult
  trackId?: string
}

export function BpmTab({ result, trackId }: BpmTabProps) {
  if (result.skipReason) {
    return <p className="text-sm text-muted-foreground">Skipped: {result.skipReason}</p>
  }

  return (
    <div className="space-y-4 pr-4">
      <div className="grid grid-cols-3 gap-3">
        <InfoItem label="Stored BPM" value={result.storedBpm?.toFixed(2) ?? 'N/A'} />
        <InfoItem label="Detected BPM" value={result.detectedBpm != null ? String(result.detectedBpm) : 'N/A'} />
        <InfoItem label="Variance" value={`${result.bpmVariancePercent.toFixed(1)}%`} />
      </div>
      {result.halfDoubleAdjusted && (
        <p className="text-xs text-chart-5">Half/double BPM adjustment applied</p>
      )}
      {result.isVariableBpm && (
        <div className="flex items-center gap-2">
          <SeverityBadge severity="warning" />
          <span className="text-sm">Variable BPM — auto-fix not recommended</span>
        </div>
      )}
      {result.segmentBpms.length > 1 && (
        <div>
          <p className="text-xs font-medium mb-2">Segment BPMs</p>
          <div className="flex flex-wrap gap-1">
            {result.segmentBpms.map((bpm, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {bpm.toFixed(1)}
              </span>
            ))}
          </div>
        </div>
      )}
      {trackId && result.overallSeverity === 'error' && !result.isVariableBpm && (
        <FixActionBar trackId={trackId} fixKind="bpm" />
      )}
    </div>
  )
}
