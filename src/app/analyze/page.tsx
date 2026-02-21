'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTrackStore } from '@/stores/track-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useProcessingStore } from '@/stores/processing-store'
import type { DjSoftware } from '@/types/track'
import type { CheckId } from '@/types/analysis'
import { codecFromFileType } from '@/types/audio'
import { DecodePipeline } from '@/workers/pipeline'
import { useAnalysisPipelines } from '@/features/analyze/hooks/useAnalysisPipelines'
import { TrackClassificationSummary } from '@/features/analyze/components/TrackClassificationSummary'
import { openAudioDirectory, scanDirectoryForAudio, matchTracksToFiles, readAudioFile } from '@/lib/audio/file-access'
import { SoftwareSelector } from '@/components/analyze/SoftwareSelector'
import { CheckSelector } from '@/components/analyze/CheckSelector'
import { AudioDirectoryPicker } from '@/components/analyze/AudioDirectoryPicker'
import { PlaylistSelector } from '@/components/analyze/PlaylistSelector'
import { ProcessingIndicator } from '@/components/analyze/ProcessingIndicator'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { classifyTracks } from '@/features/analyze/services/classify-tracks'

type Step = 'software' | 'config' | 'processing'
const STEPS: Step[] = ['software', 'config', 'processing']

const STEP_TITLES: Record<Step, string> = {
  software: 'Import wählen',
  config: 'Analyse konfigurieren',
  processing: 'Analyse läuft',
}

export default function AnalyzePage() {
  const router = useRouter()
  const {
    tracks,
    importUsbLibrary,
    importAudioFolder,
    playlists,
    activePlaylistId,
    setActivePlaylist,
    getActiveTracks,
  } = useTrackStore()
  const {
    config,
    setChecks,
    isRunning,
    results,
    error: analysisError,
  } = useAnalysisStore()
  const { audioFileHandles, matchStats, setAudioFiles } = useProcessingStore()
  const { startAnalysisPipelines, terminateAll: terminateAnalysisPipelines } = useAnalysisPipelines()

  const [step, setStep] = useState<Step>('software')
  const [software, setSoftware] = useState<DjSoftware | null>(null)
  const [needsAudio, setNeedsAudio] = useState(false)
  const [audioSkipped, setAudioSkipped] = useState(false)
  const [isPicking, setIsPicking] = useState(false)

  const decodePipelineRef = useRef<DecodePipeline | null>(null)
  const usbHandleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const audioFolderHandleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const stepIndex = STEPS.indexOf(step)

  const handleUsbDirectory = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      await importUsbLibrary(handle)
      usbHandleRef.current = handle
      setStep('config')
    },
    [importUsbLibrary]
  )

  const handleAudioFolderDirectory = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      await importAudioFolder(handle)
      audioFolderHandleRef.current = handle
      setStep('config')
    },
    [importAudioFolder]
  )

  const handlePickDirectory = useCallback(async () => {
    setIsPicking(true)
    try {
      const audioFiles = await openAudioDirectory()
      const matched = matchTracksToFiles(tracks, audioFiles)
      setAudioFiles(matched, tracks.length)
    } catch {
      // User cancelled picker - no error
    } finally {
      setIsPicking(false)
    }
  }, [tracks, setAudioFiles])

  const handleRunAnalysis = useCallback(async () => {
    setStep('processing')

    // Read directly from stores to avoid stale closures
    const currentTracks = useTrackStore.getState().getActiveTracks()
    const { runAnalysis: run, needsAudioDecoding: needsAudio } = useAnalysisStore.getState()

    run(currentTracks)

    if (!needsAudio) return

    // For USB imports: auto-scan the USB stick for audio files
    if (usbHandleRef.current) {
      const audioFiles = await scanDirectoryForAudio(usbHandleRef.current)
      const matched = matchTracksToFiles(currentTracks, audioFiles)
      useProcessingStore.getState().setAudioFiles(matched, currentTracks.length)
    }

    // For audio-folder imports: auto-scan the selected folder
    if (audioFolderHandleRef.current) {
      const audioFiles = await scanDirectoryForAudio(audioFolderHandleRef.current)
      const matched = matchTracksToFiles(currentTracks, audioFiles)
      useProcessingStore.getState().setAudioFiles(matched, currentTracks.length)
    }

    const { audioFileHandles: handles } = useProcessingStore.getState()

    // No audio matched or user skipped -> finalize immediately
    if (handles.size === 0) {
      useAnalysisStore.getState().finalizeAudioAnalysis(currentTracks)
      return
    }

    // Only process matched tracks
    const matchedIds = currentTracks.filter((t) => handles.has(t.id)).map((t) => t.id)
    useProcessingStore.getState().startProcessing(matchedIds)

    let decodeCount = 0
    const expectedCount = matchedIds.length

    const checkDone = () => {
      if (decodeCount >= expectedCount) {
        decodePipeline.terminate()
        decodePipelineRef.current = null
        startAnalysisPipelines()
      }
    }

    const decodePipeline = new DecodePipeline(undefined, {
      onProgress: (trackId, percent) => {
        useProcessingStore.getState().updateTrackState(trackId, { progress: percent })
      },
      onComplete: (trackId, pcm) => {
        useProcessingStore.getState().storeResult(trackId, pcm)
        useTrackStore.getState().updateTrackDuration(trackId, pcm.duration)
        decodeCount++
        checkDone()
      },
      onError: (trackId, error) => {
        useProcessingStore.getState().updateTrackState(trackId, { status: 'error', error })
        decodeCount++
        checkDone()
      },
      onStateChange: (trackId, update) => {
        useProcessingStore.getState().updateTrackState(trackId, {
          status: update.status as 'decoding' | 'processing',
          phase: update.phase as 'loading' | 'decoding' | 'processing',
        })
      },
    })

    decodePipelineRef.current = decodePipeline
    await decodePipeline.init()

    // Read and enqueue matched tracks
    for (const track of currentTracks) {
      const handle = handles.get(track.id)
      if (!handle) continue

      const codec = codecFromFileType(track.fileType)
      if (!codec) {
        useProcessingStore.getState().updateTrackState(track.id, { status: 'skipped' })
        decodeCount++
        checkDone()
        continue
      }

      try {
        const audioData = await readAudioFile(handle)
        decodePipeline.enqueue(track.id, audioData, codec)
      } catch (err) {
        useProcessingStore.getState().updateTrackState(track.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Read failed',
        })
        decodeCount++
        checkDone()
      }
    }
  }, [startAnalysisPipelines])

  // Navigate to report when analysis is complete
  useEffect(() => {
    if (step === 'processing' && !isRunning && results) {
      router.push('/report')
    }
  }, [step, isRunning, results, router])

  // Cleanup pipelines on unmount
  useEffect(() => {
    return () => {
      decodePipelineRef.current?.terminate()
      terminateAnalysisPipelines()
    }
  }, [terminateAnalysisPipelines])

  const trackNameMap = useMemo(
    () => new Map(tracks.map((t) => [t.id, `${t.artist} - ${t.title}`.trim() || t.fileName])),
    [tracks]
  )

  const showAnalysisError = step === 'processing' && !isRunning && !results && analysisError
  const canGoBack = stepIndex > 0 && step !== 'processing'

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-6 md:p-10">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i <= stepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <h1 className="text-center text-2xl font-bold tracking-tight">{STEP_TITLES[step]}</h1>

        {/* Step content */}
        {step === 'software' && (
          <SoftwareSelector
            selected={software}
            onChange={async (sw) => {
              setSoftware(sw)
              const hasDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window
              if (!hasDirectoryPicker) return
              if (sw === 'audio-folder') {
                try {
                  const handle = await window.showDirectoryPicker({ mode: 'read' })
                  await handleAudioFolderDirectory(handle)
                } catch { /* Abgebrochen */ }
              } else if (sw === 'rekordbox-usb') {
                try {
                  const handle = await window.showDirectoryPicker({ mode: 'read' })
                  await handleUsbDirectory(handle)
                } catch { /* Abgebrochen */ }
              }
            }}
          />
        )}

        {step === 'config' && (
          <div className="space-y-6">
            <TrackClassificationSummary tracks={getActiveTracks()} />
            {playlists.length > 0 && (
              <PlaylistSelector
                playlists={playlists}
                activeId={activePlaylistId}
                totalTrackCount={tracks.length}
                onChange={setActivePlaylist}
              />
            )}
            <CheckSelector
              selected={config.checks}
              onChange={(checks: CheckId[]) => setChecks(checks)}
              onNeedsAudioChange={setNeedsAudio}
            />
            {needsAudio && !audioSkipped && software !== 'rekordbox-usb' && software !== 'audio-folder' && (
              <AudioDirectoryPicker
                tracks={tracks}
                matchStats={matchStats}
                onPick={handlePickDirectory}
                onSkip={() => setAudioSkipped(true)}
                isPicking={isPicking}
              />
            )}
            <Button
              onClick={handleRunAnalysis}
              disabled={
                config.checks.length === 0 ||
                (needsAudio && !audioSkipped && software !== 'rekordbox-usb' && software !== 'audio-folder' && audioFileHandles.size === 0)
              }
              className="w-full"
              size="lg"
            >
              Analyse starten
            </Button>
            {(() => {
              const { freshCount } = classifyTracks(getActiveTracks())
              if (freshCount === 0) return null
              const secs = freshCount * 10
              const est = secs < 60 ? `~${secs} Sek.` : `~${Math.ceil(secs / 60)} Min.`
              return (
                <p className="text-center text-xs text-muted-foreground/60">
                  {freshCount} Tracks benötigen vollständige Audio-Analyse · {est} länger
                </p>
              )
            })()}
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4">
            <ProcessingIndicator trackNames={trackNameMap} />
            {showAnalysisError && (
              <div className="space-y-4 text-center">
                <p role="alert" className="text-sm text-destructive">{analysisError}</p>
                <Button variant="outline" onClick={() => setStep('config')}>
                  Zurück zur Konfiguration
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step !== 'processing' && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(STEPS[stepIndex - 1])}
              disabled={!canGoBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
