'use client'

import { TrackResultTable } from '../TrackResultTable'
import { TrackDetailPanel } from '../TrackDetailPanel'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import type { UnifiedTrackRow } from '@/features/report'
import type { CheckId } from '@/types/analysis'

interface TracksStepProps {
  rows: UnifiedTrackRow[]
  activeChecks: CheckId[]
  selectedTrackId: string | null
  onSelectTrack: (trackId: string) => void
  onCloseDetail: () => void
  onNext: () => void
}

export function TracksStep({ rows, activeChecks, selectedTrackId, onSelectTrack, onCloseDetail, onNext }: TracksStepProps) {
  return (
    <div className="space-y-0">
      <div className={selectedTrackId ? 'max-h-[40vh] overflow-y-auto' : ''}>
        <TrackResultTable
          rows={rows}
          activeChecks={activeChecks}
          onSelectTrack={onSelectTrack}
        />
      </div>

      {selectedTrackId && (
        <TrackDetailPanel
          trackId={selectedTrackId}
          onClose={onCloseDetail}
        />
      )}

      <div className="flex justify-end pt-6">
        <Button onClick={onNext}>
          Weiter: Fixes
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  )
}
