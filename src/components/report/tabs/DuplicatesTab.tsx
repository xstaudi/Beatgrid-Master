import { useTrackStore } from '@/stores/track-store'
import type { TrackDuplicateResult, DuplicateGroup } from '@/types/analysis'

interface DuplicatesTabProps {
  result: TrackDuplicateResult
  group: DuplicateGroup | null
}

export function DuplicatesTab({ result, group }: DuplicatesTabProps) {
  const tracks = useTrackStore((s) => s.tracks)

  if (result.skipReason) {
    return <p className="text-sm text-muted-foreground">Skipped: {result.skipReason}</p>
  }

  if (!group) {
    return <p className="text-sm text-muted-foreground">No duplicates found for this track</p>
  }

  return (
    <div className="space-y-4 pr-4">
      <p className="text-sm">
        Match level: <span className="font-medium">{group.matchLevel}</span>
        {' \u2014 '}
        Similarity: <span className="font-mono">{(group.similarity * 100).toFixed(0)}%</span>
      </p>
      <div className="space-y-2">
        {group.tracks.map((member) => {
          const memberTrack = tracks.find((t) => t.id === member.trackId)
          return (
            <div
              key={member.trackId}
              className={`rounded-md border p-3 ${member.isRecommendedKeep ? 'border-chart-2' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {memberTrack?.title ?? member.trackId}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {memberTrack?.artist ?? 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    Q: {member.qualityScore}
                  </span>
                  {member.isRecommendedKeep && (
                    <span className="text-xs text-chart-2 font-medium">Keep</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
