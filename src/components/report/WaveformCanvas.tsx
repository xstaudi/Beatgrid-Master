'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { PcmData } from '@/types/audio'
import { downsampleForWaveform, type WaveformBucket } from '@/lib/audio/waveform-utils'

interface WaveformCanvasProps {
  pcmData: PcmData | null
  className?: string
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  buckets: WaveformBucket[],
  width: number,
  height: number,
) {
  const style = getComputedStyle(ctx.canvas)
  const waveColor = `hsl(${style.getPropertyValue('--chart-1').trim()})`
  const bgColor = `hsl(${style.getPropertyValue('--card').trim()})`

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  if (buckets.length === 0) return

  const centerY = height / 2
  const barWidth = width / buckets.length
  ctx.fillStyle = waveColor

  for (let i = 0; i < buckets.length; i++) {
    const { min, max } = buckets[i]
    const x = i * barWidth
    const yTop = centerY - max * centerY
    const yBot = centerY - min * centerY
    const barHeight = Math.max(1, yBot - yTop)
    ctx.fillRect(x, yTop, Math.max(1, barWidth - 0.5), barHeight)
  }
}

export function WaveformCanvas({ pcmData, className }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const bucketsRef = useRef<WaveformBucket[]>([])

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
    drawWaveform(ctx, bucketsRef.current, width, height)
  }, [])

  useEffect(() => {
    if (pcmData) {
      const container = containerRef.current
      const bucketCount = container ? Math.floor(container.getBoundingClientRect().width) : 800
      bucketsRef.current = downsampleForWaveform(pcmData.samples, Math.max(100, bucketCount))
    } else {
      bucketsRef.current = []
    }
    render()
  }, [pcmData, render])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      if (pcmData) {
        const bucketCount = Math.floor(container.getBoundingClientRect().width)
        bucketsRef.current = downsampleForWaveform(pcmData.samples, Math.max(100, bucketCount))
      }
      render()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [pcmData, render])

  if (!pcmData) {
    return (
      <div className={`flex items-center justify-center rounded-md border border-dashed bg-muted/30 ${className ?? ''}`}
        style={{ minHeight: 80 }}>
        <p className="text-sm text-muted-foreground">No audio data available</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`} style={{ minHeight: 80 }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
