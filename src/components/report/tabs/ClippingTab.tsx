import { InfoItem } from './InfoItem'
import { FixActionBar } from '@/components/report/FixActionBar'
import { formatDuration } from '@/lib/utils/format'
import { useFixStore } from '@/stores/fix-store'
import type { TrackClippingResult } from '@/types/analysis'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'

interface ClippingTabProps {
  result: TrackClippingResult
  pcmData: PcmData | null
  audioFileHandle?: AudioFileHandle | null
  duration: number
}

export function ClippingTab({ result }: ClippingTabProps) {
  const hasFix = useFixStore((s) =>
    s.fixes.some(
      (f) => f.operation.trackId === result.trackId && f.operation.kind === 'clipping-normalize',
    ),
  )

  if (result.skipReason) {
    return <p className="text-sm text-muted-foreground">Skipped: {result.skipReason}</p>
  }

  return (
    <div className="space-y-4 pr-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="Peak Level" value={`${result.peakLevelDb.toFixed(1)} dBFS`} />
        <InfoItem label="Clip Regions" value={String(result.clipCount)} />
        <InfoItem label="Total Clipped" value={`${(result.totalClippedDuration * 1000).toFixed(0)}ms`} />
        <InfoItem label="Status" value={result.hasClipping ? 'Clipping detected' : 'Clean'} />
      </div>
      {result.regions.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">Clip Regions</p>
          <div className="space-y-1">
            {result.regions.slice(0, 20).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span>{formatDuration(r.startTime)}</span>
                <span>{'\u2014'}</span>
                <span>{formatDuration(r.endTime)}</span>
                <span className="text-destructive">({(r.duration * 1000).toFixed(0)}ms)</span>
              </div>
            ))}
            {result.regions.length > 20 && (
              <p className="text-xs text-muted-foreground">
                +{result.regions.length - 20} more regions
              </p>
            )}
          </div>
        </div>
      )}
      {hasFix && (
        <FixActionBar trackId={result.trackId} fixKind="clipping-normalize" />
      )}
    </div>
  )
}
