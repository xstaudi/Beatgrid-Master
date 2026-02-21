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

// CDJ-3000 3-Band Waveform Palette (siehe design-principles.md → Waveform)
const COLOR_LOW = { r: 228, g: 150, b: 30 }      // Amber-Orange #E4961E (Bass)
const COLOR_MID = { r: 230, g: 226, b: 216 }     // Warm White #E6E2D8 (Mids)
const COLOR_HIGH = { r: 75, g: 140, b: 202 }     // CDJ Blue #4B8CCA (Highs)
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

  // 3-Band Waveform (pixel-basiert: 1 fillRect pro Pixel fuer stufenfreien Zoom)
  if (bandData) {
    const { buckets } = bandData
    const totalBuckets = buckets.length
    const startF = (visibleStart / effectiveDuration) * totalBuckets
    const endF = (visibleEnd / effectiveDuration) * totalBuckets
    const playProgress = currentTime / effectiveDuration

    for (let px = 0; px < width; px++) {
      // Bucket-Range fuer dieses Pixel
      const bStart = startF + (px / width) * (endF - startF)
      const bEnd = startF + ((px + 1) / width) * (endF - startF)
      const iStart = Math.max(0, Math.floor(bStart))
      const iEnd = Math.min(totalBuckets - 1, Math.floor(bEnd))

      // Merge: min/max aus allen Buckets, Bands = Durchschnitt
      let mergedMin = 0, mergedMax = 0, mergedLow = 0, mergedMid = 0, mergedHigh = 0
      let count = 0
      for (let j = iStart; j <= iEnd; j++) {
        const b = buckets[j]
        if (b.max > mergedMax) mergedMax = b.max
        if (b.min < mergedMin) mergedMin = b.min
        mergedLow += b.low
        mergedMid += b.mid
        mergedHigh += b.high
        count++
      }
      if (count === 0) continue
      mergedLow /= count
      mergedMid /= count
      mergedHigh /= count

      // Kontrast-verstaerkte Farbmischung (CDJ-3000 Style)
      const pL = mergedLow * mergedLow * mergedLow
      const pM = mergedMid * mergedMid * mergedMid
      const pH = mergedHigh * mergedHigh * mergedHigh
      const total = pL + pM + pH
      let r: number, g: number, b: number
      if (total > 0) {
        const wL = pL / total
        const wM = pM / total
        const wH = pH / total
        r = wL * COLOR_LOW.r + wM * COLOR_MID.r + wH * COLOR_HIGH.r
        g = wL * COLOR_LOW.g + wM * COLOR_MID.g + wH * COLOR_HIGH.g
        b = wL * COLOR_LOW.b + wM * COLOR_MID.b + wH * COLOR_HIGH.b
      } else {
        r = COLOR_MID.r; g = COLOR_MID.g; b = COLOR_MID.b
      }

      const bucketProgress = ((iStart + iEnd) / 2) / totalBuckets
      const alpha = bucketProgress <= playProgress ? 1.0 : 0.7

      ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`
      const topHeight = Math.max(0.5, Math.abs(mergedMax) * centerY)
      const bottomHeight = Math.max(0.5, Math.abs(mergedMin) * centerY)
      ctx.fillRect(px, centerY - topHeight, 1, topHeight)
      ctx.fillRect(px, centerY, 1, bottomHeight)
    }
  } else if (fallbackBuckets) {
    const barWidth = width / fallbackBuckets.length
    ctx.fillStyle = 'rgba(228, 150, 30, 0.5)'
    for (let i = 0; i < fallbackBuckets.length; i++) {
      const { min, max } = fallbackBuckets[i]
      const x = i * barWidth
      const topHeight = Math.max(0.5, Math.abs(max) * centerY)
      const bottomHeight = Math.max(0.5, Math.abs(min) * centerY)
      const w = Math.ceil(barWidth)
      ctx.fillRect(x, centerY - topHeight, w, topHeight)
      ctx.fillRect(x, centerY, w, bottomHeight)
    }
  }

  // BPM Segment Overlay
  if (bpmSegments && bpmSegments.length > 0) {
    renderBpmSegments(ctx, bpmSegments, referenceBpm ?? 0, width, height, visibleStart, visibleEnd, visibleDuration)
  }

  // Clipping regions
  if (clipRegions && clipRegions.length > 0) {
    renderClipRegions(ctx, clipRegions, width, height, visibleStart, visibleDuration)
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

function renderClipRegions(
  ctx: CanvasRenderingContext2D,
  regions: { startTime: number; endTime: number }[],
  width: number, height: number,
  visibleStart: number, visibleDuration: number,
): void {
  const INDICATOR_H = 4  // Roter Balken oben + unten

  for (const region of regions) {
    const x = ((region.startTime - visibleStart) / visibleDuration) * width
    const w = Math.max(2, ((region.endTime - region.startTime) / visibleDuration) * width)
    if (x + w < 0 || x > width) continue

    // Halbtransparente Fläche
    ctx.fillStyle = 'rgba(255, 30, 30, 0.18)'
    ctx.fillRect(x, 0, w, height)

    // Roter Indikator-Balken oben + unten (wie CDJ Clip-Warnung)
    ctx.fillStyle = 'rgba(255, 40, 40, 0.90)'
    ctx.fillRect(x, 0, w, INDICATOR_H)
    ctx.fillRect(x, height - INDICATOR_H, w, INDICATOR_H)

    // Linke Kante (harte Clip-Grenze)
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
}

function renderDriftPoints(
  ctx: CanvasRenderingContext2D,
  points: BeatDriftPoint[],
  width: number, height: number,
  visibleStart: number, visibleEnd: number, visibleDuration: number,
): void {
  ctx.strokeStyle = 'rgba(80, 200, 180, 0.5)'
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
