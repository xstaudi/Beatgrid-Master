'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { ClipRegion } from '@/types/analysis'

interface ClippingOverlayProps {
  regions: ClipRegion[]
  duration: number
  className?: string
}

export function ClippingOverlay({ regions, duration, className }: ClippingOverlayProps) {
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

    const redColor = getComputedStyle(canvas).getPropertyValue('--destructive').trim()
    ctx.fillStyle = `hsla(${redColor}, 0.25)`

    for (const region of regions) {
      const x = (region.startTime / duration) * width
      const w = Math.max(1, ((region.endTime - region.startTime) / duration) * width)
      ctx.fillRect(x, 0, w, height)
    }
  }, [regions, duration])

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
