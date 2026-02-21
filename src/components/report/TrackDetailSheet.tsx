'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SeverityBadge } from './SeverityBadge'
import { MetadataTab } from './tabs/MetadataTab'
import { BeatgridTab } from './tabs/BeatgridTab'
import { BpmTab } from './tabs/BpmTab'
import { KeyTab } from './tabs/KeyTab'
import { ClippingTab } from './tabs/ClippingTab'
import { DuplicatesTab } from './tabs/DuplicatesTab'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useTrackStore } from '@/stores/track-store'
import { useProcessingStore } from '@/stores/processing-store'
import { CHECK_LABELS } from '@/features/report'
import { formatDuration } from '@/lib/utils/format'
import type {
  MetadataAuditResult,
  BeatgridCheckResult,
  BpmCheckResult,
  KeyCheckResult,
  ClippingCheckResult,
  DuplicateCheckResult,
} from '@/types/analysis'

interface TrackDetailSheetProps {
  trackId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrackDetailSheet({ trackId, open, onOpenChange }: TrackDetailSheetProps) {
  const results = useAnalysisStore((s) => s.results)
  const generatedBeatgrids = useAnalysisStore((s) => s.generatedBeatgrids)
  const rawBeatResults = useAnalysisStore((s) => s.rawBeatResults)
  const track = useTrackStore((s) => (trackId ? s.tracks.find((t) => t.id === trackId) : undefined))
  const pcmCache = useProcessingStore((s) => s.pcmCache)
  const audioFileHandles = useProcessingStore((s) => s.audioFileHandles)

  if (!trackId || !results || !track) return null

  const activeChecks = results.config.checks
  const pcmData = pcmCache.get(trackId) ?? null
  const audioFileHandle = audioFileHandles.get(trackId) ?? null

  const metaResult = results.results.find((r): r is MetadataAuditResult => r.type === 'metadata')
  const beatResult = results.results.find((r): r is BeatgridCheckResult => r.type === 'beatgrid')
  const bpmResult = results.results.find((r): r is BpmCheckResult => r.type === 'bpm')
  const keyResult = results.results.find((r): r is KeyCheckResult => r.type === 'key')
  const clipResult = results.results.find((r): r is ClippingCheckResult => r.type === 'clipping')
  const dupResult = results.results.find((r): r is DuplicateCheckResult => r.type === 'duplicates')

  const trackMeta = metaResult?.tracks.find((t) => t.trackId === trackId)
  const trackBeat = beatResult?.tracks.find((t) => t.trackId === trackId)
  const trackBpm = bpmResult?.tracks.find((t) => t.trackId === trackId)
  const trackKey = keyResult?.tracks.find((t) => t.trackId === trackId)
  const trackClip = clipResult?.tracks.find((t) => t.trackId === trackId)
  const trackDup = dupResult?.tracks.find((t) => t.trackId === trackId)
  const dupGroup = trackDup?.duplicateGroupId
    ? dupResult?.groups.find((g) => g.groupId === trackDup.duplicateGroupId) ?? null
    : null

  const severities = [trackMeta, trackBeat, trackBpm, trackKey, trackClip, trackDup]
    .filter(Boolean)
    .map((r) => r!.overallSeverity)
  const overallSeverity = severities.includes('error') ? 'error' : severities.includes('warning') ? 'warning' : 'ok'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">{track.title || 'Untitled'}</SheetTitle>
          <p className="text-sm text-muted-foreground">{track.artist || 'Unknown Artist'}</p>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex items-center gap-4 mb-4">
          <SeverityBadge severity={overallSeverity} />
          <span className="text-sm text-muted-foreground">
            {track.duration > 0 && formatDuration(track.duration)}
          </span>
        </div>

        <Tabs defaultValue={activeChecks[0] ?? 'metadata'} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1">
            {activeChecks.map((check) => (
              <TabsTrigger key={check} value={check} className="text-xs">
                {CHECK_LABELS[check]}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)] mt-4">
            {trackMeta && (
              <TabsContent value="metadata" className="mt-0">
                <MetadataTab result={trackMeta} />
              </TabsContent>
            )}
            {trackBeat && (
              <TabsContent value="beatgrid" className="mt-0">
                <BeatgridTab
                  result={trackBeat}
                  pcmData={pcmData}
                  audioFileHandle={audioFileHandle}
                  tempoMarkers={track.tempoMarkers}
                  duration={track.duration}
                  trackId={trackId}
                  generatedGrid={generatedBeatgrids.get(trackId) ?? null}
                  rawBeatTimestamps={rawBeatResults.get(trackId)?.beatTimestamps}
                />
              </TabsContent>
            )}
            {trackBpm && (
              <TabsContent value="bpm" className="mt-0">
                <BpmTab result={trackBpm} />
              </TabsContent>
            )}
            {trackKey && (
              <TabsContent value="key" className="mt-0">
                <KeyTab result={trackKey} />
              </TabsContent>
            )}
            {trackClip && (
              <TabsContent value="clipping" className="mt-0">
                <ClippingTab result={trackClip} pcmData={pcmData} audioFileHandle={audioFileHandle} duration={track.duration} />
              </TabsContent>
            )}
            {trackDup && (
              <TabsContent value="duplicates" className="mt-0">
                <DuplicatesTab result={trackDup} group={dupGroup} />
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
