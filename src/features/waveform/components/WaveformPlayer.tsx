'use client'

import { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioPlayback } from '../hooks/useAudioPlayback'
import { useWaveformZoom, MAX_ZOOM } from '../hooks/useWaveformZoom'
import { renderWaveformCanvas } from '../services/canvas-renderer'
import type { WaveformBandData, WaveformWorkerRequest, WaveformWorkerResponse, BpmSegment } from '../types'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import type { BeatDriftPoint, ClipRegion } from '@/types/analysis'
import type { TempoMarker } from '@/types/track'
import { downsampleForWaveform, type WaveformBucket } from '@/lib/audio/waveform-utils'

interface WaveformPlayerProps {
  pcmData: PcmData | null
  audioFileHandle?: AudioFileHandle | null
  duration: number
  beatDriftPoints?: BeatDriftPoint[]
  tempoMarkers?: TempoMarker[]
  clipRegions?: ClipRegion[]
  bpmSegments?: BpmSegment[]
  referenceBpm?: number
  kickOnsets?: number[]
  detectedBeats?: number[]
  zoomEnabled?: boolean
  className?: string
  phaseMarkerPosition?: number
  showCenterLine?: boolean
  onPhaseMarkerDrag?: (sec: number) => void
  onViewChange?: (viewStart: number, viewEnd: number) => void
  controlledViewStart?: number
  controlledViewEnd?: number
  visibleBands?: { low: boolean; mid: boolean; high: boolean }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function WaveformPlayer({
  pcmData,
  audioFileHandle,
  duration,
  beatDriftPoints,
  tempoMarkers,
  clipRegions,
  bpmSegments,
  referenceBpm,
  kickOnsets,
  detectedBeats,
  zoomEnabled = false,
  className,
  phaseMarkerPosition,
  showCenterLine,
  onPhaseMarkerDrag,
  onViewChange,
  controlledViewStart,
  controlledViewEnd,
  visibleBands,
}: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const bandDataRef = useRef<WaveformBandData | null>(null)
  const fallbackBucketsRef = useRef<WaveformBucket[] | null>(null)
  const rafRenderRef = useRef<number>(0)

  const [isComputing, setIsComputing] = useState(false)
  const [bandReady, setBandReady] = useState(false)

  const { audioRef, isPlaying, currentTime, canPlay, toggle, seek } =
    useAudioPlayback(audioFileHandle)

  // Nutze pcmData.duration als Fallback wenn track.duration fehlt (z.B. Audio-Folder Import)
  const effectiveDuration = duration > 0 ? duration : (pcmData?.duration ?? 0)

  const phaseMarkerConfig = phaseMarkerPosition !== undefined && onPhaseMarkerDrag
    ? { positionSec: phaseMarkerPosition, onDrag: onPhaseMarkerDrag }
    : undefined

  const { zoomLevel, viewStart, viewEnd, zoomLevels, isDragging, consumeDragGesture } =
    useWaveformZoom(effectiveDuration, canvasRef, phaseMarkerConfig)

  const effectiveZoom = zoomEnabled ? zoomLevel : 1
  const effectiveViewStart = controlledViewStart ?? (zoomEnabled ? viewStart : 0)
  const effectiveViewEnd = controlledViewEnd ?? (zoomEnabled ? viewEnd : effectiveDuration)

  // --- Fallback-Buckets cachen (nur bei pcmData-Wechsel, nicht jedes Frame) ---
  useEffect(() => {
    if (!pcmData || bandReady) {
      fallbackBucketsRef.current = null
      return
    }
    const width = containerRef.current?.getBoundingClientRect().width ?? 800
    fallbackBucketsRef.current = downsampleForWaveform(
      pcmData.samples,
      Math.max(100, Math.floor(width)),
    )
  }, [pcmData, bandReady])

  // --- Band computation via Worker ---
  useEffect(() => {
    if (!pcmData) {
      bandDataRef.current = null
      fallbackBucketsRef.current = null
      setBandReady(false)
      return
    }

    const container = containerRef.current
    const containerWidth = container
      ? Math.floor(container.getBoundingClientRect().width)
      : 800
    const bucketCount = Math.max(200, containerWidth * MAX_ZOOM)

    setIsComputing(true)
    setBandReady(false)

    const worker = new Worker(
      new URL('../../../workers/waveform-worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<WaveformWorkerResponse>) => {
      const msg = e.data
      if (msg.type === 'complete') {
        bandDataRef.current = msg.bandData
        setBandReady(true)
        setIsComputing(false)
      } else if (msg.type === 'error') {
        console.error('[WaveformPlayer] Worker-Fehler:', msg.message)
        setIsComputing(false)
      }
    }

    worker.onerror = (e) => {
      console.error('[WaveformPlayer] Worker konnte nicht geladen werden:', e.message)
      setIsComputing(false)
    }

    const request: WaveformWorkerRequest = {
      type: 'compute',
      trackId: 'current',
      samples: pcmData.samples,
      sampleRate: pcmData.sampleRate,
      bucketCount,
    }
    // Kein Transfer-Array: samples werden geklont (original bleibt fuer Fallback nutzbar)
    worker.postMessage(request)

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [pcmData])

  // --- Canvas rendering ---
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const width = rect.width
    const height = rect.height

    // Resize-Guard: nur bei Dimensionsaenderung
    const newW = Math.round(width * dpr)
    const newH = Math.round(height * dpr)
    if (canvas.width !== newW || canvas.height !== newH) {
      canvas.width = newW
      canvas.height = newH
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Fallback aus Ref (gecacht, nicht per-frame berechnet)
    const fallbackBuckets = bandReady ? null : fallbackBucketsRef.current

    renderWaveformCanvas(ctx, {
      width,
      height,
      duration: effectiveDuration,
      currentTime,
      canPlay,
      visibleStart: effectiveViewStart,
      visibleEnd: effectiveViewEnd,
      bandData: bandReady ? bandDataRef.current : null,
      fallbackBuckets,
      tempoMarkers,
      beatDriftPoints,
      clipRegions,
      bpmSegments,
      referenceBpm,
      kickOnsets,
      detectedBeats,
      phaseMarkerPosition,
      showCenterLine,
      visibleBands,
    })
  }, [bandReady, effectiveDuration, currentTime, canPlay,
    tempoMarkers, beatDriftPoints, clipRegions, bpmSegments, referenceBpm, kickOnsets,
    detectedBeats, effectiveViewStart, effectiveViewEnd, phaseMarkerPosition, showCenterLine,
    visibleBands])

  // Render loop
  useLayoutEffect(() => {
    if (isPlaying) {
      const loop = () => {
        render()
        rafRenderRef.current = requestAnimationFrame(loop)
      }
      rafRenderRef.current = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(rafRenderRef.current)
    }
    render()
  }, [isPlaying, render])

  // ResizeObserver
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(render)
    observer.observe(container)
    return () => observer.disconnect()
  }, [render])

  // onViewChange: Callback wenn sichtbarer Bereich sich aendert
  const onViewChangeRef = useRef(onViewChange)
  useEffect(() => { onViewChangeRef.current = onViewChange })
  useEffect(() => {
    onViewChangeRef.current?.(effectiveViewStart, effectiveViewEnd)
  }, [effectiveViewStart, effectiveViewEnd])

  // Click-to-seek (mit Zoom-Korrektur) — unterdrückt nach Drag
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (consumeDragGesture()) return
      if (!canPlay || effectiveDuration <= 0) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const visDuration = effectiveViewEnd - effectiveViewStart
      seek(effectiveViewStart + ratio * visDuration)
    },
    [consumeDragGesture, canPlay, effectiveDuration, seek, effectiveViewStart, effectiveViewEnd],
  )

  // Keyboard-Seek
  const handleCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (!canPlay) return
      const step = e.shiftKey ? 10 : 5
      if (e.key === 'ArrowRight') { e.preventDefault(); seek(Math.min(effectiveDuration, currentTime + step)) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); seek(Math.max(0, currentTime - step)) }
    },
    [canPlay, effectiveDuration, currentTime, seek],
  )

  if (!pcmData) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-dashed bg-muted/30 ${className ?? ''}`}
        style={{ minHeight: 80 }}
      >
        <p className="text-sm text-muted-foreground">No audio data available</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative rounded-md overflow-hidden"
        style={{ height: 120 }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Waveform – ${formatTime(duration)}`}
          tabIndex={canPlay ? 0 : -1}
          className={`absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring ${
            zoomEnabled && effectiveZoom > 1
              ? isDragging ? 'cursor-grabbing' : 'cursor-grab'
              : 'cursor-pointer'
          }`}
          onClick={handleCanvasClick}
          onKeyDown={handleCanvasKeyDown}
        />
        {isComputing && (
          <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
        )}
        {zoomEnabled && effectiveZoom > 1 && (
          <div className="absolute top-1 right-1 flex gap-0.5">
            {zoomLevels.map((level) => (
              <span
                key={level}
                className={`text-[10px] px-1 ${
                  level === effectiveZoom
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/30'
                }`}
              >
                {level}x
              </span>
            ))}
          </div>
        )}
      </div>

      {audioFileHandle && (
        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggle}
            disabled={!canPlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration > 0 ? duration : 0)}
          </span>
        </div>
      )}

      <audio ref={audioRef} preload="auto" className="hidden" />
    </div>
  )
}
