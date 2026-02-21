/**
 * Pure Canvas-Rendering-Logik fuer die Waveform-Darstellung.
 *
 * Farben sind bewusst als RGB-Werte hardcoded, da Canvas 2D Context
 * keine CSS Custom Properties lesen kann. Bei Design-System-Aenderungen
 * muessen diese Werte manuell synchronisiert werden.
 */

import type { WaveformBandData, BpmSegment } from '../types'
import type { BeatDriftPoint, ClipRegion } from '@/types/analysis'
import type { TempoMarker } from '@/types/track'

// Art Deco Kupfer-Palette (Canvas kann keine CSS-Variablen lesen)
const COLOR_LOW = { r: 193, g: 125, b: 83 }     // Kupfer #c17d53
const COLOR_MID = { r: 126, g: 81, b: 56 }      // Dunkelbraun #7e5138
const COLOR_HIGH = { r: 242, g: 240, b: 228 }    // Champagne Cream #F2F0E4
const BG_COLOR = '#1d1511'
const PLAYHEAD_COLOR = '#FFFFFF'

interface MinMaxBucket { min: number; max: number }

export interface CanvasRenderOptions {
  width: number
  height: number
  duration: number
  currentTime: number
  canPlay: boolean
  visibleStart: number
  visibleEnd: number
  bandData: WaveformBandData | null
  fallbackBuckets: MinMaxBucket[] | null
  tempoMarkers?: TempoMarker[]
  beatDriftPoints?: BeatDriftPoint[]
  clipRegions?: ClipRegion[]
  bpmSegments?: BpmSegment[]
  referenceBpm?: number
  phaseMarkerPosition?: number  // Beat-1 in Sekunden → orange Linie + Dreiecke
  showCenterLine?: boolean       // Roter fixer Strich in Waveform-Mitte
}

export function renderWaveformCanvas(
  ctx: CanvasRenderingContext2D,
  opts: CanvasRenderOptions,
): void {
  const { width, height, duration, currentTime, canPlay,
    visibleStart, visibleEnd, bandData, fallbackBuckets,
    tempoMarkers, beatDriftPoints, clipRegions,
    bpmSegments, referenceBpm, phaseMarkerPosition, showCenterLine } = opts

  const centerY = height / 2
  const effectiveDuration = duration > 0 ? duration : 1
  const visibleDuration = visibleEnd - visibleStart

  // Background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, width, height)

  // 3-Band Waveform
  if (bandData) {
    const { buckets } = bandData
    const startBucket = Math.floor((visibleStart / effectiveDuration) * buckets.length)
    const endBucket = Math.ceil((visibleEnd / effectiveDuration) * buckets.length)
    const visibleBuckets = buckets.slice(startBucket, endBucket)
    const barWidth = visibleBuckets.length > 0 ? width / visibleBuckets.length : 1

    for (let i = 0; i < visibleBuckets.length; i++) {
      const { min, max, low, mid, high } = visibleBuckets[i]
      const x = i * barWidth

      const r = low * COLOR_LOW.r + mid * COLOR_MID.r + high * COLOR_HIGH.r
      const g = low * COLOR_LOW.g + mid * COLOR_MID.g + high * COLOR_HIGH.g
      const b = low * COLOR_LOW.b + mid * COLOR_MID.b + high * COLOR_HIGH.b

      const playProgress = currentTime / effectiveDuration
      const bucketProgress = (startBucket + i) / buckets.length
      const alpha = bucketProgress <= playProgress ? 1.0 : 0.7

      ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`
      const topHeight = Math.max(0.5, Math.abs(max) * centerY)
      const bottomHeight = Math.max(0.5, Math.abs(min) * centerY)
      ctx.fillRect(x, centerY - topHeight, Math.max(1, barWidth - 0.5), topHeight)
      ctx.fillRect(x, centerY, Math.max(1, barWidth - 0.5), bottomHeight)
    }
  } else if (fallbackBuckets) {
    const barWidth = width / fallbackBuckets.length
    ctx.fillStyle = 'rgba(193, 125, 83, 0.5)'
    for (let i = 0; i < fallbackBuckets.length; i++) {
      const { min, max } = fallbackBuckets[i]
      const x = i * barWidth
      const topHeight = Math.max(0.5, Math.abs(max) * centerY)
      const bottomHeight = Math.max(0.5, Math.abs(min) * centerY)
      ctx.fillRect(x, centerY - topHeight, Math.max(1, barWidth - 0.5), topHeight)
      ctx.fillRect(x, centerY, Math.max(1, barWidth - 0.5), bottomHeight)
    }
  }

  // BPM Segment Overlay
  if (bpmSegments && bpmSegments.length > 0) {
    renderBpmSegments(ctx, bpmSegments, referenceBpm ?? 0, width, height, visibleStart, visibleEnd, visibleDuration)
  }

  // Clipping regions
  if (clipRegions && clipRegions.length > 0) {
    ctx.fillStyle = 'rgba(255, 50, 50, 0.25)'
    for (const region of clipRegions) {
      const x = ((region.startTime - visibleStart) / visibleDuration) * width
      const w = Math.max(1, ((region.endTime - region.startTime) / visibleDuration) * width)
      if (x + w < 0 || x > width) continue
      ctx.fillRect(x, 0, w, height)
    }
  }

  // Rekordbox-style Beat Grid
  if (tempoMarkers && tempoMarkers.length > 0) {
    renderBeatGrid(ctx, tempoMarkers, width, height, visibleStart, visibleEnd, visibleDuration)
  }

  // Detected beat drift points
  if (beatDriftPoints && beatDriftPoints.length > 0) {
    renderDriftPoints(ctx, beatDriftPoints, width, height, visibleStart, visibleEnd, visibleDuration)
  }

  // Phase-Marker (Beat-1, orange) – im Canvas gerendert → korrekte Zoom-Koordinaten
  if (phaseMarkerPosition !== undefined) {
    const x = ((phaseMarkerPosition - visibleStart) / visibleDuration) * width
    if (x >= -3 && x <= width + 3) {
      ctx.fillStyle = '#FF8800'
      ctx.fillRect(x - 1.5, 0, 3, height)
      // Dreieck oben
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x - 5, 9)
      ctx.lineTo(x + 5, 9)
      ctx.closePath()
      ctx.fill()
      // Dreieck unten
      ctx.beginPath()
      ctx.moveTo(x, height)
      ctx.lineTo(x - 5, height - 9)
      ctx.lineTo(x + 5, height - 9)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Center-Line (roter fixer Strich in Waveform-Mitte)
  if (showCenterLine) {
    ctx.strokeStyle = 'rgba(220, 50, 50, 0.85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
  }

  // Playhead
  if (canPlay && currentTime > 0) {
    const playheadX = ((currentTime - visibleStart) / visibleDuration) * width
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = PLAYHEAD_COLOR
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
}

function renderBeatGrid(
  ctx: CanvasRenderingContext2D,
  markers: TempoMarker[],
  width: number, height: number,
  visibleStart: number, visibleEnd: number, visibleDuration: number,
): void {
  for (const marker of markers) {
    if (marker.bpm <= 0) continue
    const intervalSec = 60 / marker.bpm
    let pos = marker.position
    let beatInBar = marker.beat

    while (pos < visibleEnd + intervalSec) {
      if (pos >= visibleStart - intervalSec) {
        const x = ((pos - visibleStart) / visibleDuration) * width
        if (x >= -2 && x <= width + 2) {
          const isDownbeat = (beatInBar - 1) % 4 === 0

          ctx.strokeStyle = isDownbeat ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'
          ctx.lineWidth = isDownbeat ? 1.5 : 0.5
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
          ctx.stroke()

          if (isDownbeat) {
            ctx.fillStyle = '#FF3333'
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x - 3, 6)
            ctx.lineTo(x + 3, 6)
            ctx.closePath()
            ctx.fill()
            ctx.beginPath()
            ctx.moveTo(x, height)
            ctx.lineTo(x - 3, height - 6)
            ctx.lineTo(x + 3, height - 6)
            ctx.closePath()
            ctx.fill()
          }
        }
      }
      pos += intervalSec
      beatInBar++
    }
  }
}

function renderBpmSegments(
  ctx: CanvasRenderingContext2D,
  segments: BpmSegment[],
  referenceBpm: number,
  width: number, height: number,
  visibleStart: number, visibleEnd: number, visibleDuration: number,
): void {
  const MIN_LABEL_WIDTH = 40

  for (const seg of segments) {
    if (seg.endTime <= visibleStart || seg.startTime >= visibleEnd) continue

    const x = Math.max(0, ((seg.startTime - visibleStart) / visibleDuration) * width)
    const xEnd = Math.min(width, ((seg.endTime - visibleStart) / visibleDuration) * width)
    const w = xEnd - x

    // Farbkodierung nach Abweichung
    const delta = referenceBpm > 0 ? Math.abs(seg.bpm - referenceBpm) : 0
    if (delta > 2.0) {
      ctx.fillStyle = 'rgba(255, 80, 50, 0.15)'
    } else if (delta > 0.5) {
      ctx.fillStyle = 'rgba(255, 200, 50, 0.12)'
    } else {
      ctx.fillStyle = 'rgba(193, 125, 83, 0.08)'
    }
    ctx.fillRect(x, 0, w, height)

    // Gestrichelte Trennlinie an Segment-Grenze
    if (seg.startTime > visibleStart) {
      ctx.strokeStyle = 'rgba(193, 125, 83, 0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // BPM-Label (nur wenn breit genug)
    if (w >= MIN_LABEL_WIDTH) {
      const label = seg.bpm.toFixed(1)
      ctx.font = '10px monospace'
      const textWidth = ctx.measureText(label).width
      const pillW = textWidth + 8
      const pillH = 16
      const pillX = x + (w - pillW) / 2
      const pillY = 4

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.roundRect(pillX, pillY, pillW, pillH, 3)
      ctx.fill()

      ctx.fillStyle = '#F2F0E4'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, pillX + pillW / 2, pillY + pillH / 2)
    }
  }
}

function renderDriftPoints(
  ctx: CanvasRenderingContext2D,
  points: BeatDriftPoint[],
  width: number, height: number,
  visibleStart: number, visibleEnd: number, visibleDuration: number,
): void {
  ctx.strokeStyle = 'rgba(255, 200, 50, 0.5)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  for (const point of points) {
    const posSec = point.positionMs / 1000
    if (posSec < visibleStart || posSec > visibleEnd) continue
    const x = ((posSec - visibleStart) / visibleDuration) * width
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  ctx.stroke()
  ctx.setLineDash([])
}
