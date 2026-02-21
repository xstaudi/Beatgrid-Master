'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { DuplicateCheckResult } from '@/types/analysis'
import type { ScannedFile } from '../hooks/useDuplicateScanner'

interface DuplicateGroupListProps {
  result: DuplicateCheckResult
  fileMap: Map<string, ScannedFile>
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAllInGroup: (groupId: string, keepId: string) => void
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`
  return `${bytes} B`
}

export function DuplicateGroupList({
  result,
  fileMap,
  selectedIds,
  onToggle,
  onSelectAllInGroup,
}: DuplicateGroupListProps) {
  if (result.groups.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Keine Duplikate gefunden.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {result.groups.map((group, groupIndex) => (
        <Card key={group.groupId} className="overflow-hidden">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Gruppe {groupIndex + 1}
              </span>
              <Badge
                variant={group.matchLevel === 'fingerprint' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {group.matchLevel === 'fingerprint' ? 'Fingerprint' : 'Metadata'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {group.tracks.length} Tracks
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSelectAllInGroup(group.groupId, group.recommendedKeepId)}
            >
              Alle außer Keep
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {group.tracks.map((member) => {
              const scanned = fileMap.get(member.trackId)
              const isKeep = member.isRecommendedKeep
              const isSelected = selectedIds.has(member.trackId)

              return (
                <label
                  key={member.trackId}
                  className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/20 ${
                    isKeep ? 'border-l-2 border-l-green-500' : ''
                  } ${isSelected ? 'bg-destructive/5' : ''}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(member.trackId)}
                    disabled={isKeep}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {scanned?.name ?? member.trackId}
                    </p>
                    {scanned && (
                      <p className="text-xs text-muted-foreground">
                        {formatSize(scanned.size)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground font-mono">
                      Score {member.qualityScore}
                    </span>
                    {isKeep && (
                      <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                        Keep
                      </Badge>
                    )}
                  </div>
                </label>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
