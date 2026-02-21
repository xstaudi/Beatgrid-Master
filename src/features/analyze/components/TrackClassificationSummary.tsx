'use client'

import type { Track } from '@/types/track'
import { classifyTracks } from '@/features/analyze/services/classify-tracks'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Sparkles } from 'lucide-react'

interface Props {
  tracks: Track[]
}

export function TrackClassificationSummary({ tracks }: Props) {
  const { verifyCount, freshCount } = classifyTracks(tracks)

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card>
        <CardContent className="flex items-center gap-3 px-4 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-chart-2" />
          <div>
            <p className="text-sm font-medium">{verifyCount.toLocaleString()} Tracks zu prüfen</p>
            <p className="text-xs text-muted-foreground">Beatgrid-Drift prüfen · Schnell</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 px-4 py-3">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">{freshCount.toLocaleString()} Tracks zu analysieren</p>
            <p className="text-xs text-muted-foreground">BPM, Beatgrid, Key · Dauert länger</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
