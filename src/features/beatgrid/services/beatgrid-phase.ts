import type { BeatDriftPoint } from '@/types/analysis'
import { buildExpectedBeats } from './beatgrid-check'

function sortedMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function findNearestExpected(detected: number, expected: number[]): number | null {
  if (expected.length === 0) return null
  let lo = 0
  let hi = expected.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (expected[mid] < detected) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && Math.abs(expected[lo - 1] - detected) < Math.abs(expected[lo] - detected)) lo--
  return expected[lo]
}

/**
 * Berechnet Grid-Precision-Metriken live während des Editierens.
 * Wird aufgerufen wenn der Nutzer phaseOffset im BeatgridEditor verschiebt.
 */
export function computeLivePrecision(
  rawBeatTimestamps: number[],
  phaseOffsetSec: number,
  bpm: number,
  duration: number,
): { avgDriftMs: number; offBeatMs: number | undefined } {
  if (rawBeatTimestamps.length === 0) return { avgDriftMs: 0, offBeatMs: undefined }

  const expectedBeats = buildExpectedBeats(
    [{ position: phaseOffsetSec, bpm, meter: '4/4', beat: 1 }],
    duration,
  )

  let totalAbsDrift = 0
  const signedDrifts: number[] = []

  for (const detected of rawBeatTimestamps) {
    const nearest = findNearestExpected(detected, expectedBeats)
    if (nearest === null) continue
    const driftMs = (detected - nearest) * 1000
    totalAbsDrift += Math.abs(driftMs)
    signedDrifts.push(driftMs)
  }

  const avgDriftMs = signedDrifts.length > 0 ? totalAbsDrift / signedDrifts.length : 0
  const offBeatRaw = signedDrifts.length >= 4 ? sortedMedian(signedDrifts) : 0
  const offBeatMs = Math.abs(offBeatRaw) >= 3 ? offBeatRaw : undefined

  return { avgDriftMs, offBeatMs }
}

/**
 * Berechnet den systematischen Phase-Offset des Beatgrids.
 * Positiver Wert = Grid zu früh (Beats kommen nach den Gridlinien)
 * Negativer Wert = Grid zu spät (Beats kommen vor den Gridlinien)
 */
export function detectOffBeat(driftPoints: BeatDriftPoint[]): number {
  if (driftPoints.length < 4) return 0
  const drifts = driftPoints.map((dp) => dp.driftMs)
  return sortedMedian(drifts)
}

/**
 * Erkennt ob der erste Taktschlag (Beat 1) tatsächlich Beat 2, 3 oder 4 ist.
 * Gibt 1 zurück wenn Kicks auf Taktschlägen 2+4 statt 1+3 liegen (Off by 1 Beat),
 * 0 wenn korrekt in Phase, null wenn zu wenig Daten.
 */
export function detectOutOfPhase(expectedBeats: number[], kickOnsets: number[]): 0 | 1 | null {
  if (kickOnsets.length < 8) return null

  const counts = [0, 0, 0, 0]

  for (const kick of kickOnsets) {
    // Binäre Suche: nächstgelegenen Expected Beat finden
    let lo = 0
    let hi = expectedBeats.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (expectedBeats[mid] < kick) lo = mid + 1
      else hi = mid
    }
    // Prüfe lo und lo-1
    let bestIdx = lo
    if (lo > 0 && Math.abs(expectedBeats[lo - 1] - kick) < Math.abs(expectedBeats[lo] - kick)) {
      bestIdx = lo - 1
    }
    counts[bestIdx % 4]++
  }

  const evenScore = counts[0] + counts[2]  // Taktschläge 1+3 (Indices 0+2)
  const oddScore = counts[1] + counts[3]   // Taktschläge 2+4 (Indices 1+3)
  const total = kickOnsets.length

  if (oddScore > evenScore * 1.5 && oddScore / total >= 0.6) return 1
  return 0
}
