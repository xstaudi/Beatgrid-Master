import { SeverityBadge } from '../SeverityBadge'
import { FIELD_LABELS } from '@/features/metadata/constants'
import type { TrackMetadataResult } from '@/types/analysis'

interface MetadataTabProps {
  result: TrackMetadataResult
}

export function MetadataTab({ result }: MetadataTabProps) {
  return (
    <div className="space-y-3 pr-4">
      {result.fields.map((f) => (
        <div
          key={f.field}
          className="flex items-start justify-between gap-4 rounded-md border p-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{FIELD_LABELS[f.field] ?? f.field}</p>
            <p className="text-sm text-muted-foreground truncate">
              {f.value || <span className="italic">empty</span>}
            </p>
            {f.message && (
              <p className="text-xs text-muted-foreground mt-1">{f.message}</p>
            )}
          </div>
          <SeverityBadge severity={f.severity} />
        </div>
      ))}
    </div>
  )
}
