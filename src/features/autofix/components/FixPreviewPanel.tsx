'use client'

import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useFixStore } from '@/stores/fix-store'
import type { FixKind } from '@/types/fix'

const KIND_LABELS: Record<FixKind, string> = {
  bpm: 'BPM',
  key: 'Key',
  beatgrid: 'Beatgrid',
  'duplicate-remove': 'Duplicates',
}

const KIND_VARIANTS: Record<FixKind, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  bpm: 'default',
  key: 'secondary',
  beatgrid: 'outline',
  'duplicate-remove': 'destructive',
}

export function FixPreviewPanel() {
  const fixes = useFixStore((s) => s.fixes)
  const setFixStatus = useFixStore((s) => s.setFixStatus)

  // Group by kind (exclude duplicate-remove — handled by DuplicateResolutionCard)
  const fixableKinds: FixKind[] = ['bpm', 'key', 'beatgrid']
  const grouped = fixableKinds
    .map((kind) => ({
      kind,
      entries: fixes.filter((f) => f.operation.kind === kind),
    }))
    .filter((g) => g.entries.length > 0)

  if (grouped.length === 0) return null

  return (
    <div className="space-y-4">
      {grouped.map(({ kind, entries }) => (
        <Card key={kind}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={KIND_VARIANTS[kind]}>{KIND_LABELS[kind]}</Badge>
              <span className="text-sm text-muted-foreground">
                {entries.length} {entries.length === 1 ? 'Fix' : 'Fixes'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries.map((entry) => (
                <label
                  key={`${entry.operation.trackId}-${entry.operation.kind}`}
                  className="flex items-center gap-3 border p-3 text-sm hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={entry.status === 'approved'}
                    onCheckedChange={(checked) =>
                      setFixStatus(
                        entry.operation.trackId,
                        entry.operation.kind,
                        checked ? 'approved' : 'skipped',
                      )
                    }
                  />
                  <span className="flex-1 truncate font-medium">
                    {entry.preview.label}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {entry.preview.before}
                  </span>
                  <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                  <span className="shrink-0 font-mono text-primary">
                    {entry.preview.after}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
