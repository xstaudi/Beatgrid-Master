export interface DropDetectionResult {
  dropKickSec: number | null
  confidence: 'high' | 'medium' | 'none'
  method: 'kick-density' | 'fallback'
}

/**
 * Findet den Drop-Einstiegspunkt ueber Kick-Onset-Density-Analyse.
 * In EDM faellt der erste Kick im Drop immer auf Beat 1 einer Phrase.
 *
 * Algorithmus:
 * 1. Kick-Onsets in Fenster aufteilen (16 Beats = 4 Bars)
 * 2. Kicks pro Fenster zaehlen
 * 3. Drop = Uebergang von wenig/keine Kicks zu vielen Kicks
 * 4. Ersten Kick im Drop-Fenster zurueckgeben
 */
export function detectDrop(
  kickOnsets: number[],
  bpm: number,
  duration: number,
): DropDetectionResult {
  const none: DropDetectionResult = {
    dropKickSec: null,
    confidence: 'none',
    method: 'kick-density',
  }

  if (kickOnsets.length === 0 || bpm <= 0 || duration <= 0) {
    return none
  }

  // Fenstergroesse: 4 Bars = 16 Beats
  const windowSec = (60 / bpm) * 16
  if (windowSec <= 0) return none

  const windowCount = Math.ceil(duration / windowSec)
  if (windowCount < 2) return none

  // Kicks pro Fenster zaehlen
  const kickDensity = new Array<number>(windowCount).fill(0)
  for (const kick of kickOnsets) {
    const idx = Math.min(Math.floor(kick / windowSec), windowCount - 1)
    kickDensity[idx]++
  }

  // Drop-Candidate: Fenster mit starkem Density-Anstieg
  for (let i = 1; i < windowCount; i++) {
    const prevDensity = kickDensity[i - 1]
    const currDensity = kickDensity[i]

    // Vorheriges Fenster: wenig/keine Kicks
    // Aktuelles Fenster: viele Kicks (>= 8 = ca. 1 Kick pro 2 Beats)
    // Ratio: mindestens 4x Anstieg
    if (prevDensity < 2 && currDensity >= 8) {
      const ratio = currDensity / Math.max(prevDensity, 1)
      if (ratio >= 4) {
        // Ersten Kick im Drop-Fenster finden
        const windowStart = i * windowSec
        const windowEnd = windowStart + windowSec
        const firstKickInDrop = kickOnsets.find(
          (k) => k >= windowStart && k < windowEnd,
        )

        if (firstKickInDrop !== undefined) {
          return {
            dropKickSec: firstKickInDrop,
            confidence: ratio >= 8 ? 'high' : 'medium',
            method: 'kick-density',
          }
        }
      }
    }
  }

  return none
}
