'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioPlayback } from '../hooks/useAudioPlayback'
import { useWaveformZoom } from '../hooks/useWaveformZoom'
import { renderWaveformCanvas } from '../services/canvas-renderer'
import type { WaveformBandData, WaveformWorkerRequest, WaveformWorkerResponse } from '../types'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import type { BeatDriftPoint, ClipRegion } from '@/types/analysis'
import type { TempoMarker } from '@/types/track'
import { downsampleForWaveform } from '@/lib/audio/waveform-utils'

interface WaveformPlayerProps {
  pcmData: PcmData | null
  audioFileHandle?: AudioFileHandle | null
  duration: number
  beatDriftPoints?: BeatDriftPoint[]
  tempoMarkers?: TempoMarker[]
  clipRegions?: ClipRegion[]
  zoomEnabled?: boolean
  className?: string
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
  zoomEnabled = false,
  className,
}: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const bandDataRef = useRef<WaveformBandData | null>(null)
  const rafRenderRef = useRef<number>(0)

  const [isComputing, setIsComputing] = useState(false)
  const [bandReady, setBandReady] = useState(false)

  const { audioRef, isPlaying, currentTime, canPlay, toggle, seek } =
    useAudioPlayback(audioFileHandle)

  const { zoomLevel, viewStart, viewEnd, zoomLevels } =
    useWaveformZoom(duration, canvasRef)

  const effectiveZoom = zoomEnabled ? zoomLevel : 1
  const effectiveViewStart = zoomEnabled ? viewStart : 0
  const effectiveViewEnd = zoomEnabled ? viewEnd : duration

  // --- Band computation via Worker ---
  useEffect(() => {
    if (!pcmData) {
      bandDataRef.current = null
      setBandReady(false)
      return
    }

    const container = containerRef.current
    const bucketCount = container
      ? Math.max(200, Math.floor(container.getBoundingClientRect().width))
      : 800

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
        setIsComputing(false)
      }
    }

    const request: WaveformWorkerRequest = {
      type: 'compute',
      trackId: 'current',
      samples: pcmData.samples,
      sampleRate: pcmData.sampleRate,
      bucketCount,
    }
    worker.postMessage(request, [pcmData.samples.buffer.slice(0)])

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

    const fallbackBuckets = (!bandReady && pcmData)
      ? downsampleForWaveform(pcmData.samples, Math.max(100, Math.floor(width)))
      : null

    renderWaveformCanvas(ctx, {
      width,
      height,
      duration,
      currentTime,
      canPlay,
      visibleStart: effectiveViewStart,
      visibleEnd: effectiveViewEnd,
      bandData: bandReady ? bandDataRef.current : null,
      fallbackBuckets,
      tempoMarkers,
      beatDriftPoints,
      clipRegions,
    })
  }, [bandReady, pcmData, duration, currentTime, canPlay,
    tempoMarkers, beatDriftPoints, clipRegions,
    effectiveViewStart, effectiveViewEnd])

  // Render loop
  useEffect(() => {
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
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(render)
    observer.observe(container)
    return () => observer.disconnect()
  }, [render])

  // Click-to-seek (mit Zoom-Korrektur)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canPlay || duration <= 0) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const visDuration = effectiveViewEnd - effectiveViewStart
      seek(effectiveViewStart + ratio * visDuration)
    },
    [canPlay, duration, seek, effectiveViewStart, effectiveViewEnd],
  )

  // Keyboard-Seek
  const handleCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (!canPlay) return
      const step = e.shiftKey ? 10 : 5
      if (e.key === 'ArrowRight') { e.preventDefault(); seek(Math.min(duration, currentTime + step)) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); seek(Math.max(0, currentTime - step)) }
    },
    [canPlay, duration, currentTime, seek],
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
          className="absolute inset-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
          onClick={handleCanvasClick}
          onKeyDown={handleCanvasKeyDown}
        />
        {isComputing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className="text-xs text-muted-foreground animate-pulse">Analyzing frequencies...</p>
          </div>
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
