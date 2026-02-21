'use client'

import { useCallback, useState } from 'react'
import { RotateCcw, Check, SkipForward } from 'lucide-react'
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
    skipEdit,
    isModified,
  } = useBeatgridEditor(trackId, generatedGrid, beatTimestamps)

  const [viewCenter, setViewCenter] = useState(duration / 2)

  const handleViewChange = useCallback((vs: number, ve: number) => {
    setViewCenter((vs + ve) / 2)
  }, [])

  const handlePhaseMarkerDrag = useCallback((sec: number) => {
    const value = setPhaseOffset(sec)
    onPhaseOffsetChange?.(value)
  }, [setPhaseOffset, onPhaseOffsetChange])

  const shiftGrid = useCallback((beats: number) => {
    const interval = 60 / bpm
    const raw = phaseOffset + beats * interval
    const value = setPhaseOffset(Math.max(0, Math.min(duration, raw)))
    onPhaseOffsetChange?.(value)
  }, [bpm, phaseOffset, setPhaseOffset, duration, onPhaseOffsetChange])

  const handleSetDownbeat = useCallback(() => {
    // Naechsten roten Downbeat (4/4 Takt) zur Waveform-Mitte verschieben
    const barInterval = (60 / bpm) * 4
    const n = Math.round((viewCenter - phaseOffset) / barInterval)
    const nearestDownbeat = phaseOffset + n * barInterval
    const delta = viewCenter - nearestDownbeat
    const newOffset = Math.max(0, Math.min(duration, phaseOffset + delta))
    const value = setPhaseOffset(newOffset)
    onPhaseOffsetChange?.(value)
  }, [viewCenter, phaseOffset, bpm, duration, setPhaseOffset, onPhaseOffsetChange])

  // Keyboard: Arrow-Keys verschieben Beat-1 fein
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.01 : 0.001
    let newOffset: number | null = null
    if (e.key === 'ArrowLeft') { e.preventDefault(); newOffset = Math.max(0, phaseOffset - step) }
    if (e.key === 'ArrowRight') { e.preventDefault(); newOffset = Math.min(duration, phaseOffset + step) }
    if (newOffset !== null) {
      const value = setPhaseOffset(newOffset)
      onPhaseOffsetChange?.(value)
    }
  }, [phaseOffset, duration, setPhaseOffset, onPhaseOffsetChange])

  return (
    <div
      className="space-y-3"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Beatgrid Editor"
    >
      {/* Waveform mit Beat-Grid – Phase-Marker und Center-Line im Canvas */}
      <WaveformPlayer
        pcmData={pcmData}
        audioFileHandle={audioFileHandle}
        duration={duration}
        tempoMarkers={currentMarkers}
        zoomEnabled
        showCenterLine
        phaseMarkerPosition={phaseOffset}
        onPhaseMarkerDrag={handlePhaseMarkerDrag}
        onViewChange={handleViewChange}
      />

      {/* Beat-Shift-Buttons (Rekordbox-Style) */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => shiftGrid(-4)} title="4 Beats zurück">
          ◄◄ |||
        </Button>
        <Button variant="outline" size="sm" onClick={() => shiftGrid(-1)} title="1 Beat zurück">
          ◄ |||
        </Button>
        <Button variant="outline" size="sm" onClick={handleSetDownbeat} title="Downbeat an Waveform-Mitte setzen">
          <span className="inline-block w-0.5 h-4 bg-red-500 mr-1.5" />
          Set Downbeat
        </Button>
        <Button variant="outline" size="sm" onClick={() => shiftGrid(+1)} title="1 Beat vor">
          ||| ►
        </Button>
        <Button variant="outline" size="sm" onClick={() => shiftGrid(+4)} title="4 Beats vor">
          ||| ►►
        </Button>
      </div>

      {/* Info-Karten: Beats Detected / Phase / Confidence */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded border p-2">
          <div className="text-muted-foreground">Beats Detected</div>
          <div className="font-mono font-semibold">{beatTimestamps.length}</div>
        </div>
        <div className="rounded border p-2">
          <div className="text-muted-foreground">Phase</div>
          <div className="font-mono font-semibold">{phaseOffset.toFixed(3)}s</div>
        </div>
        <div className="rounded border p-2">
          <div className="text-muted-foreground">Confidence</div>
          <div className={`font-mono font-semibold ${confidenceColor(generatedGrid.confidence)}`}>
            {formatConfidence(generatedGrid.confidence)}
          </div>
        </div>
      </div>

      {/* Reset / Bestätigen / Überspringen */}
      <div className="flex items-center justify-end gap-2">
        {isModified && (
          <Button variant="ghost" size="sm" onClick={resetToDetected}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={skipEdit}>
          <SkipForward className="h-3.5 w-3.5 mr-1" />
          Ueberspringen
        </Button>
        <Button size="sm" onClick={confirmEdit}>
          <Check className="h-3.5 w-3.5 mr-1" />
          Uebernehmen
        </Button>
      </div>
    </div>
  )
}
