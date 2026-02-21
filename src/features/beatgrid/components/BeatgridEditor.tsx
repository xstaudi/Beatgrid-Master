'use client'

import { useRef, useCallback, useState } from 'react'
import { RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WaveformPlayer } from '@/features/waveform'
import { useBeatgridEditor } from '../hooks/useBeatgridEditor'
import type { GeneratedBeatgrid } from '../services/beatgrid-generation'
import type { PcmData } from '@/types/audio'
import type { AudioFileHandle } from '@/lib/audio/file-access'
import { formatConfidence, confidenceColor } from '@/lib/utils'

interface BeatgridEditorProps {
  trackId: string
  pcmData: PcmData
  audioFileHandle?: AudioFileHandle | null
  generatedGrid: GeneratedBeatgrid
  beatTimestamps: number[]
  duration: number
  onPhaseOffsetChange?: (newOffsetSec: number) => void
}

export function BeatgridEditor({
  trackId,
  pcmData,
  audioFileHandle,
  generatedGrid,
  beatTimestamps,
  duration,
  onPhaseOffsetChange,
}: BeatgridEditorProps) {
  const {
    phaseOffset,
    bpm,
    currentMarkers,
    setPhaseOffset,
    resetToDetected,
    confirmEdit,
    isModified,
  } = useBeatgridEditor(trackId, generatedGrid, beatTimestamps)

  const waveformContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Beat-1 Marker Drag-Logik
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = waveformContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Hit-Test: ±20px um den Beat-1-Marker
    const markerX = (phaseOffset / duration) * rect.width
    if (Math.abs(x - markerX) > 20) return

    setIsDragging(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveX = moveEvent.clientX - rect.left
      const newSec = Math.max(0, Math.min(duration, (moveX / rect.width) * duration))
      const snapped = setPhaseOffset(newSec)
      onPhaseOffsetChange?.(snapped)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [duration, phaseOffset, setPhaseOffset, onPhaseOffsetChange])

  // Keyboard: Arrow-Keys verschieben Beat-1
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.01 : 0.001
    let newOffset: number | null = null
    if (e.key === 'ArrowLeft') { e.preventDefault(); newOffset = Math.max(0, phaseOffset - step) }
    if (e.key === 'ArrowRight') { e.preventDefault(); newOffset = Math.min(duration, phaseOffset + step) }
    if (newOffset !== null) {
      const snapped = setPhaseOffset(newOffset)
      onPhaseOffsetChange?.(snapped)
    }
  }, [phaseOffset, duration, setPhaseOffset, onPhaseOffsetChange])

  return (
    <div className="space-y-3">
      {/* Waveform mit Beat-Grid + Drag-Overlay */}
      <div
        ref={waveformContainerRef}
        className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
      >
        <WaveformPlayer
          pcmData={pcmData}
          audioFileHandle={audioFileHandle}
          duration={duration}
          tempoMarkers={currentMarkers}
          zoomEnabled
        />

        {/* Beat-1 Marker Overlay */}
        <div
          role="slider"
          aria-label="Beat-1-Position"
          aria-valuenow={parseFloat(phaseOffset.toFixed(3))}
          aria-valuemin={0}
          aria-valuemax={duration}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="absolute top-0 bottom-0 pointer-events-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            left: `${(phaseOffset / duration) * 100}%`,
            width: '3px',
            marginLeft: '-1.5px',
            background: 'var(--color-beat-marker, #FF8800)',
            zIndex: 10,
          }}
        >
          {/* Drag-Handle oben */}
          <div
            className="absolute -top-0.5 -left-[5px] w-[13px] h-[8px] pointer-events-auto cursor-grab"
            style={{ background: 'var(--color-beat-marker, #FF8800)' }}
          />
          {/* Drag-Handle unten */}
          <div
            className="absolute -bottom-0.5 -left-[5px] w-[13px] h-[8px] pointer-events-auto cursor-grab"
            style={{ background: 'var(--color-beat-marker, #FF8800)' }}
          />
        </div>
      </div>

      {/* Info + Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            BPM: <span className="text-foreground font-mono">{bpm.toFixed(2)}</span>
          </span>
          <span className="text-muted-foreground">
            Phase: <span className="text-foreground font-mono">{phaseOffset.toFixed(3)}s</span>
          </span>
          <span className="text-muted-foreground">
            Confidence: <span className={`font-mono ${confidenceColor(generatedGrid.confidence)}`}>{formatConfidence(generatedGrid.confidence)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isModified && (
            <Button variant="ghost" size="sm" onClick={resetToDetected}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
          <Button size="sm" onClick={confirmEdit}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Uebernehmen
          </Button>
        </div>
      </div>
    </div>
  )
}
