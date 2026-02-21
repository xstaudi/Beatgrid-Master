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
import { FileDropZone } from '@/components/analyze/FileDropZone'
import { CheckSelector } from '@/components/analyze/CheckSelector'
import { AudioDirectoryPicker } from '@/components/analyze/AudioDirectoryPicker'
import { UsbDirectoryPicker } from '@/components/analyze/UsbDirectoryPicker'
import { RekordboxPcPicker } from '@/components/analyze/RekordboxPcPicker'
import { AudioFolderPicker } from '@/components/analyze/AudioFolderPicker'
import { PlaylistSelector } from '@/components/analyze/PlaylistSelector'
import { ProcessingIndicator } from '@/components/analyze/ProcessingIndicator'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type Step = 'software' | 'import' | 'classification' | 'config' | 'processing'
const STEPS: Step[] = ['software', 'import', 'classification', 'config', 'processing']

const STEP_TITLES: Record<Step, string> = {
  software: 'DJ-Software wählen',
  import: 'Bibliothek importieren',
  classification: 'Tracks klassifizieren',
  config: 'Analyse konfigurieren',
  processing: 'Analyse läuft',
}

export default function AnalyzePage() {
  const router = useRouter()
  const {
    tracks,
    isLoading,
    importLibrary,
    importUsbLibrary,
    importPcLibrary,
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
  const [importError, setImportError] = useState<string | null>(null)
  const [needsAudio, setNeedsAudio] = useState(false)
  const [audioSkipped, setAudioSkipped] = useState(false)
  const [isPicking, setIsPicking] = useState(false)
  const [usbError, setUsbError] = useState<string | null>(null)
  const [pcError, setPcError] = useState<string | null>(null)
  const [audioFolderError, setAudioFolderError] = useState<string | null>(null)

  const decodePipelineRef = useRef<DecodePipeline | null>(null)
  const usbHandleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const audioFolderHandleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const stepIndex = STEPS.indexOf(step)

  const handleFile = useCallback(
    (content: string) => {
      setImportError(null)
      try {
        importLibrary(content)
        setStep('classification')
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse file')
      }
    },
    [importLibrary]
  )

  const handleUsbDirectory = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      setUsbError(null)
      try {
        await importUsbLibrary(handle)
        usbHandleRef.current = handle
        setStep('classification')
      } catch (err) {
        setUsbError(err instanceof Error ? err.message : 'Failed to read USB drive')
      }
    },
    [importUsbLibrary]
  )

  const handlePcDirectory = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      setPcError(null)
      try {
        await importPcLibrary(handle)
        setStep('classification')
      } catch (err) {
        setPcError(err instanceof Error ? err.message : 'Fehler beim Lesen der rekordbox-Bibliothek')
      }
    },
    [importPcLibrary]
  )

  const handleAudioFolderDirectory = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      setAudioFolderError(null)
      try {
        await importAudioFolder(handle)
        audioFolderHandleRef.current = handle
        setStep('classification')
      } catch (err) {
        setAudioFolderError(err instanceof Error ? err.message : 'Fehler beim Lesen des Audio-Ordners')
      }
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
  const canGoForward =
    (step === 'software' && software != null) ||
    (step === 'import' && tracks.length > 0) ||
    step === 'classification'

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
          <SoftwareSelector selected={software} onChange={setSoftware} />
        )}

        {step === 'import' && software === 'rekordbox-usb' && (
          <UsbDirectoryPicker
            isLoading={isLoading}
            trackCount={tracks.length > 0 ? tracks.length : null}
            error={usbError}
            onSelect={handleUsbDirectory}
          />
        )}

        {step === 'import' && software === 'rekordbox-pc' && (
          <RekordboxPcPicker
            isLoading={isLoading}
            trackCount={tracks.length > 0 ? tracks.length : null}
            error={pcError}
            onSelect={handlePcDirectory}
          />
        )}

        {step === 'import' && software === 'audio-folder' && (
          <AudioFolderPicker
            isLoading={isLoading}
            trackCount={tracks.length > 0 ? tracks.length : null}
            error={audioFolderError}
            onSelect={handleAudioFolderDirectory}
          />
        )}

        {step === 'import' && software !== 'rekordbox-usb' && software !== 'rekordbox-pc' && software !== 'audio-folder' && (
          <div className="space-y-4">
            <FileDropZone onFile={handleFile} isLoading={isLoading} />
            {importError && (
              <p role="alert" className="text-sm text-destructive text-center">
                {importError}
              </p>
            )}
          </div>
        )}

        {step === 'classification' && (
          <TrackClassificationSummary tracks={getActiveTracks()} />
        )}

        {step === 'config' && (
          <div className="space-y-6">
            <p className="text-center text-muted-foreground">
              {getActiveTracks().length.toLocaleString()} Tracks
              {activePlaylistId ? ' in Playlist' : ' importiert'}
            </p>
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
            {step !== 'config' && (
              <Button
                onClick={() => setStep(STEPS[stepIndex + 1])}
                disabled={!canGoForward}
              >
                Weiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
