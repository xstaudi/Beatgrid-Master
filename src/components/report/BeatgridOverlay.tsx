'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { BeatDriftPoint } from '@/types/analysis'
import type { TempoMarker } from '@/types/track'

interface BeatgridOverlayProps {
  driftPoints: BeatDriftPoint[]
  tempoMarkers: TempoMarker[]
  duration: number
  className?: string
}

export function BeatgridOverlay({
  driftPoints,
  tempoMarkers,
  duration,
  className,
}: BeatgridOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || duration <= 0) return

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
    ctx.clearRect(0, 0, width, height)

    const style = getComputedStyle(canvas)

    // Draw stored grid lines (batched single path)
    ctx.strokeStyle = `hsl(${style.getPropertyValue('--muted-foreground').trim()})`
    ctx.lineWidth = 0.5
    ctx.globalAlpha = 0.3

    ctx.beginPath()
    for (const marker of tempoMarkers) {
      if (marker.bpm <= 0) continue
      const beatInterval = 60000 / marker.bpm
      let posMs = marker.position
      while (posMs < duration * 1000) {
        const x = (posMs / (duration * 1000)) * width
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        posMs += beatInterval
      }
    }
    ctx.stroke()

    // Draw detected beats (batched single path)
    ctx.strokeStyle = `hsl(${style.getPropertyValue('--chart-2').trim()})`
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.6
    ctx.setLineDash([4, 4])

    ctx.beginPath()
    for (const point of driftPoints) {
      const x = (point.positionMs / (duration * 1000)) * width
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }
    ctx.stroke()

    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }, [driftPoints, tempoMarkers, duration])

  useEffect(() => {
    render()
  }, [render])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(render)
    observer.observe(container)
    return () => observer.disconnect()
  }, [render])

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className ?? ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
