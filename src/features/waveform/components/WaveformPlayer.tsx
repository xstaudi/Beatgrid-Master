'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioPlayback } from '../hooks/useAudioPlayback'
import type { WaveformBandData, WaveformWorkerRequest, WaveformWorkerResponse } from '../types'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import type { BeatDriftPoint, ClipRegion } from '@/types/analysis'
import type { TempoMarker } from '@/types/track'
import { downsampleForWaveform } from '@/lib/audio/waveform-utils'

// Rekordbox-style colors
const COLOR_LOW = { r: 0, g: 212, b: 255 }     // Cyan #00D4FF
const COLOR_MID = { r: 91, g: 63, b: 255 }      // Violet #5B3FFF
const COLOR_HIGH = { r: 224, g: 224, b: 255 }    // White/Blue #E0E0FF
const BG_COLOR = '#0A0A0F'
const PLAYHEAD_COLOR = '#FFFFFF'
const BEAT_GRID_ALPHA = 0.3

interface WaveformPlayerProps {
  pcmData: PcmData | null
  audioFileHandle?: AudioFileHandle | null
  duration: number
  beatDriftPoints?: BeatDriftPoint[]
  tempoMarkers?: TempoMarker[]
  clipRegions?: ClipRegion[]
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

  // --- Band computation via Worker ---
  useEffect(() => {
    if (!pcmData) {
      bandDataRef.current = null
      setBandReady(false)
      return
    }

    const container = containerRef.current
    const bucketCount = container ? Math.max(200, Math.floor(container.getBoundingClientRect().width)) : 800

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

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, width, height)

    const centerY = height / 2
    const effectiveDuration = duration > 0 ? duration : 1

    if (bandReady && bandDataRef.current) {
      // 3-Band colored waveform
      const { buckets } = bandDataRef.current
      const barWidth = width / buckets.length

      for (let i = 0; i < buckets.length; i++) {
        const { min, max, low, mid, high } = buckets[i]
        const x = i * barWidth

        // Color = weighted mix of band colors
        const r = low * COLOR_LOW.r + mid * COLOR_MID.r + high * COLOR_HIGH.r
        const g = low * COLOR_LOW.g + mid * COLOR_MID.g + high * COLOR_HIGH.g
        const b = low * COLOR_LOW.b + mid * COLOR_MID.b + high * COLOR_HIGH.b

        // "Played" region brightening
        const playProgress = currentTime / effectiveDuration
        const bucketProgress = i / buckets.length
        const alpha = bucketProgress <= playProgress ? 1.0 : 0.7

        ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`

        // Draw mirrored bars from center
        const topHeight = Math.max(0.5, Math.abs(max) * centerY)
        const bottomHeight = Math.max(0.5, Math.abs(min) * centerY)

        ctx.fillRect(x, centerY - topHeight, Math.max(1, barWidth - 0.5), topHeight)
        ctx.fillRect(x, centerY, Math.max(1, barWidth - 0.5), bottomHeight)
      }
    } else if (pcmData) {
      // Fallback: mono-color waveform while computing
      const bucketCount = Math.max(100, Math.floor(width))
      const buckets = downsampleForWaveform(pcmData.samples, bucketCount)
      const barWidth = width / buckets.length

      ctx.fillStyle = 'rgba(0, 212, 255, 0.5)'
      for (let i = 0; i < buckets.length; i++) {
        const { min, max } = buckets[i]
        const x = i * barWidth
        const topHeight = Math.max(0.5, Math.abs(max) * centerY)
        const bottomHeight = Math.max(0.5, Math.abs(min) * centerY)
        ctx.fillRect(x, centerY - topHeight, Math.max(1, barWidth - 0.5), topHeight)
        ctx.fillRect(x, centerY, Math.max(1, barWidth - 0.5), bottomHeight)
      }
    }

    // Clipping regions overlay
    if (clipRegions && clipRegions.length > 0) {
      ctx.fillStyle = 'rgba(255, 50, 50, 0.25)'
      for (const region of clipRegions) {
        const x = (region.startTime / effectiveDuration) * width
        const w = Math.max(1, ((region.endTime - region.startTime) / effectiveDuration) * width)
        ctx.fillRect(x, 0, w, height)
      }
    }

    // Beat grid overlay
    if (tempoMarkers && tempoMarkers.length > 0) {
      ctx.strokeStyle = PLAYHEAD_COLOR
      ctx.lineWidth = 1
      ctx.globalAlpha = BEAT_GRID_ALPHA

      ctx.beginPath()
      for (const marker of tempoMarkers) {
        if (marker.bpm <= 0) continue
        const beatIntervalMs = 60000 / marker.bpm
        let posMs = marker.position
        while (posMs < effectiveDuration * 1000) {
          const x = (posMs / (effectiveDuration * 1000)) * width
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
          posMs += beatIntervalMs
        }
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Detected beat drift points
    if (beatDriftPoints && beatDriftPoints.length > 0) {
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])

      ctx.beginPath()
      for (const point of beatDriftPoints) {
        const x = (point.positionMs / (effectiveDuration * 1000)) * width
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Playhead cursor
    if (canPlay && currentTime > 0) {
      const playheadX = (currentTime / effectiveDuration) * width
      ctx.strokeStyle = PLAYHEAD_COLOR
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.9

      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }, [bandReady, pcmData, duration, currentTime, canPlay, tempoMarkers, beatDriftPoints, clipRegions])

  // Render loop: re-render on every animation frame during playback
  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        render()
        rafRenderRef.current = requestAnimationFrame(loop)
      }
      rafRenderRef.current = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(rafRenderRef.current)
    }
    // Static render when not playing
    render()
  }, [isPlaying, render])

  // ResizeObserver for responsive rendering
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(render)
    observer.observe(container)
    return () => observer.disconnect()
  }, [render])

  // Click-to-seek handler
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canPlay || duration <= 0) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = x / rect.width
      seek(ratio * duration)
    },
    [canPlay, duration, seek],
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
      {/* Waveform Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-md overflow-hidden"
        style={{ height: 120 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-pointer"
          onClick={handleCanvasClick}
        />
        {isComputing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className="text-xs text-muted-foreground animate-pulse">Analyzing frequencies...</p>
          </div>
        )}
      </div>

      {/* Transport Controls */}
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
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" className="hidden" />
    </div>
  )
}
