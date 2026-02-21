import { useState, useCallback } from 'react'
import type { GeneratedBeatgrid } from '../services/beatgrid-generation'
import type { TempoMarker } from '@/types/track'
import { useTrackStore } from '@/stores/track-store'

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

  // Gibt den gesnapten Wert zurueck
  const setPhaseOffset = useCallback((rawOffset: number): number => {
    const snapped = findNearestTimestamp(rawOffset, rawBeatTimestamps)
    setPhaseOffsetState(snapped)
    return snapped
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
  }, [trackId, phaseOffset, bpm, applyGeneratedBeatgrid])

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
    isModified: phaseOffset !== initialGrid.phaseOffsetSec,
  }
}
