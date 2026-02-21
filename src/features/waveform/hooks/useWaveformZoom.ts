import { useState, useCallback, useEffect, type RefObject } from 'react'

const ZOOM_LEVELS = [1, 2, 4, 8, 16] as const
const MIN_ZOOM = 1
const MAX_ZOOM = 16

export function useWaveformZoom(duration: number, canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [viewCenter, setViewCenter] = useState(duration / 2)

  const visibleDuration = duration / zoomLevel
  const viewStart = Math.max(0, viewCenter - visibleDuration / 2)
  const viewEnd = Math.min(duration, viewStart + visibleDuration)
  // Korrektur wenn am Rand
  const correctedStart = viewEnd === duration ? Math.max(0, duration - visibleDuration) : viewStart

  const zoomTo = useCallback((level: number, centerSec?: number) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level))
    setZoomLevel(clamped)
    if (centerSec !== undefined) {
      setViewCenter(Math.max(0, Math.min(duration, centerSec)))
    }
  }, [duration])

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setViewCenter(duration / 2)
  }, [duration])

  const panTo = useCallback((sec: number) => {
    setViewCenter(Math.max(0, Math.min(duration, sec)))
  }, [duration])

  // Wheel-Handler: Ctrl+Scroll = Zoom, Scroll = Pan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const ratio = mouseX / rect.width
        const currentVisibleDuration = duration / zoomLevel
        const mouseSec = correctedStart + ratio * currentVisibleDuration

        const direction = e.deltaY < 0 ? 1 : -1
        const currentIdx = ZOOM_LEVELS.indexOf(zoomLevel as typeof ZOOM_LEVELS[number])
        const nextIdx = Math.max(0, Math.min(ZOOM_LEVELS.length - 1,
          currentIdx === -1 ? (direction > 0 ? 1 : 0) : currentIdx + direction,
        ))
        const nextLevel = ZOOM_LEVELS[nextIdx]

        setZoomLevel(nextLevel)
        setViewCenter(mouseSec)
      } else if (zoomLevel > 1) {
        // Pan
        const panAmount = (e.deltaX !== 0 ? e.deltaX : e.deltaY) * 0.001 * duration / zoomLevel
        setViewCenter((prev) => Math.max(0, Math.min(duration, prev + panAmount)))
      }
    }

    const handleDblClick = () => {
      setZoomLevel(1)
      setViewCenter(duration / 2)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('dblclick', handleDblClick)

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('dblclick', handleDblClick)
    }
  }, [canvasRef, duration, zoomLevel, correctedStart])

  return {
    zoomLevel,
    viewStart: correctedStart,
    viewEnd: Math.min(duration, correctedStart + visibleDuration),
    zoomTo,
    resetZoom,
    panTo,
    zoomLevels: ZOOM_LEVELS,
  }
}
