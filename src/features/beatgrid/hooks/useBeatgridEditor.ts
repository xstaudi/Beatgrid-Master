import { useState, useCallback } from 'react'
import type { GeneratedBeatgrid } from '../services/beatgrid-generation'
import type { TempoMarker } from '@/types/track'
import { useTrackStore } from '@/stores/track-store'
import { useFixStore } from '@/stores/fix-store'

function findNearestTimestamp(target: number, timestamps: number[]): number {
  if (timestamps.length === 0) return target

  let lo = 0
  let hi = timestamps.length - 1

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (timestamps[mid] < target) lo = mid + 1
    else hi = mid
  }

  const candidates = [timestamps[lo]]
  if (lo > 0) candidates.push(timestamps[lo - 1])

  let best = candidates[0]
  let bestDist = Math.abs(best - target)
  for (let i = 1; i < candidates.length; i++) {
    const dist = Math.abs(candidates[i] - target)
    if (dist < bestDist) {
      bestDist = dist
      best = candidates[i]
    }
  }
  return best
}

export function useBeatgridEditor(
  trackId: string,
  initialGrid: GeneratedBeatgrid,
  rawBeatTimestamps: number[],
) {
  const [phaseOffset, setPhaseOffsetState] = useState(initialGrid.phaseOffsetSec)
  const [bpm] = useState(initialGrid.medianBpm)
  const applyGeneratedBeatgrid = useTrackStore((s) => s.applyGeneratedBeatgrid)
  const setFixStatus = useFixStore((s) => s.setFixStatus)

  // snap=true: zum naechsten erkannten Beat snappen (fuer Set Downbeat)
  // snap=false (default): freie Positionierung (Drag, Pfeiltasten, Beat-Shift)
  const setPhaseOffset = useCallback((rawOffset: number, snap = false): number => {
    const value = snap ? findNearestTimestamp(rawOffset, rawBeatTimestamps) : rawOffset
    setPhaseOffsetState(value)
    return value
  }, [rawBeatTimestamps])

  const resetToDetected = useCallback(() => {
    setPhaseOffsetState(initialGrid.phaseOffsetSec)
  }, [initialGrid.phaseOffsetSec])

  const confirmEdit = useCallback(() => {
    const marker: TempoMarker = {
      position: phaseOffset,
      bpm,
      meter: '4/4',
      beat: 1,
    }
    applyGeneratedBeatgrid(trackId, [marker])
    setFixStatus(trackId, 'beatgrid', 'approved')
  }, [trackId, phaseOffset, bpm, applyGeneratedBeatgrid, setFixStatus])

  const skipEdit = useCallback(() => {
    setFixStatus(trackId, 'beatgrid', 'skipped')
    setPhaseOffsetState(initialGrid.phaseOffsetSec)
  }, [trackId, initialGrid.phaseOffsetSec, setFixStatus])

  const currentMarkers: TempoMarker[] = [{
    position: phaseOffset,
    bpm,
    meter: '4/4',
    beat: 1,
  }]

  return {
    phaseOffset,
    bpm,
    currentMarkers,
    setPhaseOffset,
    resetToDetected,
    confirmEdit,
    skipEdit,
    isModified: phaseOffset !== initialGrid.phaseOffsetSec,
  }
}
