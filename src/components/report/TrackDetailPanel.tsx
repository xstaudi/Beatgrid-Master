'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from './SeverityBadge'
import { DriftGraph } from './DriftGraph'
import { MetadataTab } from './tabs/MetadataTab'
import { BeatgridTab } from './tabs/BeatgridTab'
import { BpmTab } from './tabs/BpmTab'
import { KeyTab } from './tabs/KeyTab'
import { ClippingTab } from './tabs/ClippingTab'
import { DuplicatesTab } from './tabs/DuplicatesTab'
import { WaveformPlayer } from '@/features/waveform'
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

interface TrackDetailPanelProps {
  trackId: string
  onClose: () => void
}

export function TrackDetailPanel({ trackId, onClose }: TrackDetailPanelProps) {
  const results = useAnalysisStore((s) => s.results)
  const generatedBeatgrids = useAnalysisStore((s) => s.generatedBeatgrids)
  const rawBeatResults = useAnalysisStore((s) => s.rawBeatResults)
  const track = useTrackStore((s) => s.tracks.find((t) => t.id === trackId))
  const pcmCache = useProcessingStore((s) => s.pcmCache)
  const audioFileHandles = useProcessingStore((s) => s.audioFileHandles)
  const [activeCheck, setActiveCheck] = useState<string>('')

  if (!results || !track) return null

  const activeChecks = results.config.checks
  const currentCheck = activeCheck || activeChecks[0] || 'metadata'
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

  const hasStoredGrid = track.tempoMarkers.length > 0
  const isBeatgridTab = currentCheck === 'beatgrid'
  const generatedGrid = generatedBeatgrids.get(trackId) ?? null
  const isGenerationMode = isBeatgridTab && generatedGrid && generatedGrid.method !== 'skipped' && pcmData

  const showWaveform = currentCheck !== 'metadata'
    && currentCheck !== 'duplicates'
    && !isGenerationMode

  return (
    <div className="border-t-2 border-primary bg-card animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="art-deco-heading text-lg truncate">
            <span className="art-deco-divider">{track.title || 'Untitled'}</span>
          </h3>
          <span className="text-sm text-muted-foreground truncate">{track.artist || 'Unknown Artist'}</span>
          <SeverityBadge severity={overallSeverity} />
          {track.duration > 0 && (
            <span className="text-sm text-muted-foreground">{formatDuration(track.duration)}</span>
          )}
          {track.bpm && (
            <span className="text-sm text-muted-foreground">{track.bpm.toFixed(1)} BPM</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="size-4" />
          <span className="sr-only">Schliessen</span>
        </Button>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <Tabs value={currentCheck} onValueChange={setActiveCheck}>
          <TabsList className="w-full flex-wrap h-auto gap-1">
            {activeChecks.map((check) => (
              <TabsTrigger key={check} value={check} className="text-xs">
                {CHECK_LABELS[check]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Waveform-Sektion */}
          {showWaveform && (
            <div className="mt-4 space-y-4">
              {isBeatgridTab && hasStoredGrid ? (
                <>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Gespeichertes Grid
                    </p>
                    <WaveformPlayer
                      pcmData={pcmData}
                      audioFileHandle={audioFileHandle}
                      duration={track.duration}
                      tempoMarkers={track.tempoMarkers}
                      zoomEnabled
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Erkannte Beats
                    </p>
                    <WaveformPlayer
                      pcmData={pcmData}
                      duration={track.duration}
                      beatDriftPoints={trackBeat?.driftPoints}
                      zoomEnabled
                    />
                  </div>
                </>
              ) : isBeatgridTab ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    Erkannte Beats
                  </p>
                  <WaveformPlayer
                    pcmData={pcmData}
                    audioFileHandle={audioFileHandle}
                    duration={track.duration}
                    beatDriftPoints={trackBeat?.driftPoints}
                    zoomEnabled
                  />
                </div>
              ) : currentCheck === 'clipping' ? (
                <WaveformPlayer
                  pcmData={pcmData}
                  audioFileHandle={audioFileHandle}
                  duration={track.duration}
                  clipRegions={trackClip?.regions}
                  zoomEnabled
                />
              ) : (
                <WaveformPlayer
                  pcmData={pcmData}
                  audioFileHandle={audioFileHandle}
                  duration={track.duration}
                  tempoMarkers={track.tempoMarkers}
                  zoomEnabled
                />
              )}

              {isBeatgridTab && trackBeat && !trackBeat.skipReason && (
                <DriftGraph driftPoints={trackBeat.driftPoints} duration={track.duration} />
              )}
            </div>
          )}

          {/* Check Details */}
          <div className="mt-6">
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
                  generatedGrid={generatedGrid}
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
                <ClippingTab
                  result={trackClip}
                  pcmData={pcmData}
                  audioFileHandle={audioFileHandle}
                  duration={track.duration}
                />
              </TabsContent>
            )}
            {trackDup && (
              <TabsContent value="duplicates" className="mt-0">
                <DuplicatesTab result={trackDup} group={dupGroup} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
