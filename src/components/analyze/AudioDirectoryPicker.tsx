'use client'

import type { Track } from '@/types/track'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface AudioDirectoryPickerProps {
  tracks: Track[]
  matchStats: { matched: number; total: number } | null
  onPick: () => void
  onSkip: () => void
  isPicking: boolean
}

export function AudioDirectoryPicker({
  tracks,
  matchStats,
  onPick,
  onSkip,
  isPicking,
}: AudioDirectoryPickerProps) {
  const hasMatches = matchStats !== null && matchStats.matched > 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
          {isPicking ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg font-medium">Scanning folder...</p>
            </>
          ) : hasMatches ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-chart-2" />
              <div className="space-y-1 text-center">
                <p className="text-lg font-medium">
                  {matchStats.matched} of {matchStats.total} tracks matched
                </p>
                <button
                  onClick={onPick}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Change folder
                </button>
              </div>
            </>
          ) : matchStats !== null && matchStats.matched === 0 ? (
            <>
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div className="space-y-2 text-center">
                <p className="text-lg font-medium">
                  No matching audio files found
                </p>
                <p className="text-sm text-muted-foreground">
                  Make sure you select the folder containing your music files
                </p>
                <Button variant="outline" size="sm" onClick={onPick}>
                  Try another folder
                </Button>
              </div>
            </>
          ) : (
            <>
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1 text-center">
                <p className="text-lg font-medium">
                  Select your music folder
                </p>
                <p className="text-sm text-muted-foreground">
                  Required for audio analysis (beatgrid, BPM, key, clipping)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={onPick}>Browse Folder</Button>
                <Button variant="ghost" size="sm" onClick={onSkip}>
                  Skip (metadata only)
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
