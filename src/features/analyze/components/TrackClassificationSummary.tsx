'use client'

import type { Track } from '@/types/track'
import { classifyTracks } from '@/features/analyze/services/classify-tracks'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Sparkles, Info } from 'lucide-react'

interface Props {
  tracks: Track[]
}

function estimateTime(count: number): string {
  const seconds = count * 10
  if (seconds < 60) return `~${seconds} Sek.`
  const minutes = Math.ceil(seconds / 60)
  return `~${minutes} Min.`
}

export function TrackClassificationSummary({ tracks }: Props) {
  const { verifyCount, freshCount } = classifyTracks(tracks)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
            <div>
              <p className="font-semibold">{verifyCount.toLocaleString()} Tracks zu prüfen</p>
              <p className="text-sm text-muted-foreground">
                Vorhandene Beatgrid-Daten auf Drift prüfen
              </p>
              <Badge variant="secondary" className="mt-2 text-xs">
                Schnell
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-blue-500" />
            <div>
              <p className="font-semibold">{freshCount.toLocaleString()} Tracks zu analysieren</p>
              <p className="text-sm text-muted-foreground">
                Vollständige Audio-Analyse: BPM, Beatgrid, Key
              </p>
              <Badge variant="secondary" className="mt-2 text-xs">
                Dauert länger
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      {freshCount > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>{freshCount} Tracks</strong> werden vollständig analysiert. Das dauert ca.{' '}
            {estimateTime(freshCount)} länger als ein reiner Vergleich.
          </p>
        </div>
      )}
    </div>
  )
}
