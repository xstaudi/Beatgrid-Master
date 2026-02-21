import { useState, useCallback, useEffect, useRef, type RefObject } from 'react'

interface PhaseMarkerConfig {
  positionSec: number
  onDrag: (newSec: number) => void
}

const ZOOM_LEVELS = [1, 2, 4, 8, 16] as const
const MIN_ZOOM = 1
const MAX_ZOOM = 16
const DRAG_THRESHOLD_PX = 4

export function useWaveformZoom(
  duration: number,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  phaseMarkerConfig?: PhaseMarkerConfig,
) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [viewCenter, setViewCenter] = useState(duration / 2)
  const [isDragging, setIsDragging] = useState(false)

  // Ref um nach dem Drag dem onClick mitzuteilen: nicht seekbar
  const didDragRef = useRef(false)

  // Ref fuer phaseMarkerConfig damit handleMouseDown immer aktuell ist
  const phaseMarkerConfigRef = useRef(phaseMarkerConfig)
  useEffect(() => { phaseMarkerConfigRef.current = phaseMarkerConfig })

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

  // Gibt true zurueck wenn der letzte Mousedown ein Drag war (und setzt das Flag zurueck)
  const consumeDragGesture = useCallback(() => {
    const wasDragging = didDragRef.current
    didDragRef.current = false
    return wasDragging
  }, [])

  // Wheel: Ctrl+Scroll = Zoom, Scroll = Pan | Mousedown+Drag = Pan | Dblclick = Reset
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
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
        setZoomLevel(ZOOM_LEVELS[nextIdx])
        setViewCenter(mouseSec)
      } else if (zoomLevel > 1) {
        const panAmount = (e.deltaX !== 0 ? e.deltaX : e.deltaY) * 0.001 * duration / zoomLevel
        setViewCenter((prev) => Math.max(0, Math.min(duration, prev + panAmount)))
      }
    }

    const handleDblClick = () => {
      setZoomLevel(1)
      setViewCenter(duration / 2)
    }

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const config = phaseMarkerConfigRef.current
      if (config) {
        const visDuration = duration / zoomLevel
        const visStart = correctedStart
        const markerCanvasX = ((config.positionSec - visStart) / visDuration) * rect.width
        const clickX = e.clientX - rect.left
        if (Math.abs(clickX - markerCanvasX) <= 20) {
          e.preventDefault()
          const onMove = (mv: MouseEvent) => {
            const mx = mv.clientX - rect.left
            const newSec = visStart + (mx / rect.width) * visDuration
            config.onDrag(Math.max(0, Math.min(duration, newSec)))
          }
          const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
          }
          document.addEventListener('mousemove', onMove)
          document.addEventListener('mouseup', onUp, { once: true })
          return
        }
      }

      if (zoomLevel <= 1) return
      e.preventDefault()

      let lastX = e.clientX
      let totalDelta = 0
      didDragRef.current = false
      setIsDragging(true)

      const handleMouseMove = (ev: MouseEvent) => {
        const deltaX = ev.clientX - lastX
        lastX = ev.clientX
        totalDelta += Math.abs(deltaX)

        if (totalDelta >= DRAG_THRESHOLD_PX) {
          didDragRef.current = true
        }

        const rect = canvas.getBoundingClientRect()
        // Negative deltaX = Maus nach links = Inhalt nach rechts = viewCenter nimmt ab
        const deltaSec = -(deltaX / rect.width) * (duration / zoomLevel)
        setViewCenter((prev) => Math.max(0, Math.min(duration, prev + deltaSec)))
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('dblclick', handleDblClick)
    canvas.addEventListener('mousedown', handleMouseDown)

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('dblclick', handleDblClick)
      canvas.removeEventListener('mousedown', handleMouseDown)
    }
  }, [canvasRef, duration, zoomLevel, correctedStart])

  return {
    zoomLevel,
    viewStart: correctedStart,
    viewEnd: Math.min(duration, correctedStart + visibleDuration),
    isDragging,
    consumeDragGesture,
    zoomTo,
    resetZoom,
    panTo,
    zoomLevels: ZOOM_LEVELS,
  }
}
