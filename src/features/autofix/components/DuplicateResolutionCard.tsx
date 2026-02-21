'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useTrackStore } from '@/stores/track-store'
import { useFixStore } from '@/stores/fix-store'
import type { DuplicateCheckResult, DuplicateGroup } from '@/types/analysis'

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '–'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function GroupRow({ group }: { group: DuplicateGroup }) {
  const getTrackById = useTrackStore((s) => s.getTrackById)
  const keptDuplicates = useFixStore((s) => s.keptDuplicates)
  const setKeptDuplicate = useFixStore((s) => s.setKeptDuplicate)

  const keepId = keptDuplicates.get(group.groupId) ?? group.recommendedKeepId

  return (
    <div className="space-y-2 border p-3">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="text-xs">
          {group.matchLevel === 'fingerprint' ? 'Audio Match' : 'Metadata Match'}
        </Badge>
        <span className="text-muted-foreground">
          {(group.similarity * 100).toFixed(0)}% similar
        </span>
      </div>
      <RadioGroup
        value={keepId}
        onValueChange={(id) => setKeptDuplicate(group.groupId, id)}
        className="gap-1"
      >
        {group.tracks.map((member) => {
          const track = getTrackById(member.trackId)
          const isKept = member.trackId === keepId
          return (
            <label
              key={member.trackId}
              htmlFor={`${group.groupId}-${member.trackId}`}
              className="flex items-center gap-3 px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer"
            >
              <RadioGroupItem
                value={member.trackId}
                id={`${group.groupId}-${member.trackId}`}
              />
              <span className={`flex-1 truncate ${isKept ? 'font-medium' : 'text-muted-foreground'}`}>
                {track ? `${track.artist} – ${track.title}` : member.trackId}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {track?.bitrate ? `${track.bitrate}kbps` : '–'}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(track?.fileSize ?? null)}
              </span>
              <Badge variant="secondary" className="text-xs">
                Q: {member.qualityScore}
              </Badge>
            </label>
          )
        })}
      </RadioGroup>
    </div>
  )
}

export function DuplicateResolutionCard() {
  const results = useAnalysisStore((s) => s.results)
  const dupResult = results?.results.find(
    (r): r is DuplicateCheckResult => r.type === 'duplicates',
  )

  if (!dupResult || dupResult.groups.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="destructive">Duplicates</Badge>
          <span className="text-sm text-muted-foreground">
            {dupResult.groups.length} {dupResult.groups.length === 1 ? 'Gruppe' : 'Gruppen'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Wähle pro Gruppe den Track zum Behalten. Die anderen werden beim Export entfernt.
        </p>
        {dupResult.groups.map((group) => (
          <GroupRow key={group.groupId} group={group} />
        ))}
      </CardContent>
    </Card>
  )
}
