import { InfoItem } from './InfoItem'
import type { TrackKeyResult } from '@/types/analysis'
import { formatConfidence, confidenceColor } from '@/lib/utils'

interface KeyTabProps {
  result: TrackKeyResult
}

export function KeyTab({ result }: KeyTabProps) {
  if (result.skipReason) {
    return <p className="text-sm text-muted-foreground">Skipped: {result.skipReason}</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 pr-4">
      <InfoItem label="Library Key" value={result.libraryKey ?? 'N/A'} />
      <InfoItem label="Detected Key" value={result.detectedKey ?? 'N/A'} />
      <InfoItem label="Camelot" value={result.detectedCamelot ?? 'N/A'} />
      <InfoItem label="Open Key" value={result.detectedOpenKey ?? 'N/A'} />
      <InfoItem label="Confidence" value={formatConfidence(result.confidence)} className={confidenceColor(result.confidence)} />
      <div className="rounded-md border p-3">
        <p className="text-xs text-muted-foreground">Match</p>
        <span className={
          result.match === 'match' ? 'text-chart-2 font-medium'
            : result.match === 'mismatch' ? 'text-destructive font-medium'
            : 'text-chart-5 font-medium'
        }>
          {result.match}
        </span>
      </div>
    </div>
  )
}
