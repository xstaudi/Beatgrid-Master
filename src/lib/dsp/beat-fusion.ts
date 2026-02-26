/**
 * Beat-Fusion: Zusammenfuehrung mehrerer Onset-Quellen zu finalen Beat-Positionen.
 * Gewichteter Centroid + Gap-Filling.
 */

export interface BeatFusionInput {
  aubioBeats: number[]
  onsetPeaks: number[]
  kickOnsets: number[]
  bpm: number
}

export interface BeatFusionResult {
  fusedBeats: number[]
  confidence: number  // 0-1
}

// Gewichte der Quellen
const WEIGHT_AUBIO = 1.0
const WEIGHT_ONSET = 0.7
const WEIGHT_KICK = 0.8
const MIN_SCORE = 0.5  // Mindestens Aubio + eine weitere Quelle

/**
 * Fusioniert Beat-Positionen aus mehreren Quellen.
 */
export function fuseBeats(input: BeatFusionInput): BeatFusionResult {
  const { aubioBeats, onsetPeaks, kickOnsets, bpm } = input

  if (bpm <= 0 || aubioBeats.length === 0) {
    return { fusedBeats: aubioBeats, confidence: 0 }
  }

  const beatInterval = 60 / bpm
  const tolerance = Math.min(0.02, beatInterval * 0.03) // min(20ms, 3% des Beat-Intervalls)

  // Expected-Beat-Grid aus BPM erzeugen
  const duration = Math.max(
    aubioBeats[aubioBeats.length - 1] ?? 0,
    onsetPeaks[onsetPeaks.length - 1] ?? 0,
    kickOnsets[kickOnsets.length - 1] ?? 0,
  )
  if (duration <= 0) return { fusedBeats: aubioBeats, confidence: 0 }

  // Startposition vom ersten Aubio-Beat
  const gridStart = aubioBeats[0]
  const expectedCount = Math.floor((duration - gridStart) / beatInterval) + 1
  const expectedPositions: number[] = []
  for (let i = 0; i < expectedCount; i++) {
    expectedPositions.push(gridStart + i * beatInterval)
  }

  // Pro erwarteter Position: Scoring + gewichteter Centroid
  const fusedBeats: number[] = []
  let totalScore = 0
  let scoredPositions = 0

  for (const expected of expectedPositions) {
    const matches = collectMatches(expected, tolerance, aubioBeats, onsetPeaks, kickOnsets)

    if (matches.score >= MIN_SCORE) {
      fusedBeats.push(matches.centroid)
      totalScore += matches.score
      scoredPositions++
    }
  }

  // Gap-Filling: Luecken > 2x beatInterval mit Expected-Positions fuellen
  const filled = fillGaps(fusedBeats, beatInterval)

  const confidence = scoredPositions > 0
    ? totalScore / (scoredPositions * (WEIGHT_AUBIO + WEIGHT_ONSET + WEIGHT_KICK))
    : 0

  return { fusedBeats: filled, confidence: Math.min(1, confidence) }
}

interface MatchResult {
  score: number
  centroid: number
}

function collectMatches(
  expected: number,
  tolerance: number,
  aubioBeats: number[],
  onsetPeaks: number[],
  kickOnsets: number[],
): MatchResult {
  let weightedSum = 0
  let totalWeight = 0

  // Aubio
  const aubioMatch = findNearest(expected, aubioBeats, tolerance)
  if (aubioMatch !== null) {
    weightedSum += aubioMatch * WEIGHT_AUBIO
    totalWeight += WEIGHT_AUBIO
  }

  // Onset-Strength
  const onsetMatch = findNearest(expected, onsetPeaks, tolerance)
  if (onsetMatch !== null) {
    weightedSum += onsetMatch * WEIGHT_ONSET
    totalWeight += WEIGHT_ONSET
  }

  // Multi-Band-Kick
  const kickMatch = findNearest(expected, kickOnsets, tolerance)
  if (kickMatch !== null) {
    weightedSum += kickMatch * WEIGHT_KICK
    totalWeight += WEIGHT_KICK
  }

  return {
    score: totalWeight,
    centroid: totalWeight > 0 ? weightedSum / totalWeight : expected,
  }
}

/**
 * Findet den naechsten Wert innerhalb tolerance (Binary-Search).
 */
function findNearest(target: number, sorted: number[], tolerance: number): number | null {
  if (sorted.length === 0) return null

  let lo = 0
  let hi = sorted.length - 1

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] < target - tolerance) lo = mid + 1
    else if (sorted[mid] > target + tolerance) hi = mid - 1
    else return sorted[mid]
  }

  // Pruefe Nachbarn
  const candidates = [lo - 1, lo, lo + 1].filter(i => i >= 0 && i < sorted.length)
  let best: number | null = null
  let bestDist = Infinity
  for (const idx of candidates) {
    const dist = Math.abs(sorted[idx] - target)
    if (dist <= tolerance && dist < bestDist) {
      best = sorted[idx]
      bestDist = dist
    }
  }
  return best
}

/**
 * Fuellt Luecken > 2x beatInterval mit interpolierten Positionen.
 */
function fillGaps(beats: number[], beatInterval: number): number[] {
  if (beats.length < 2) return beats

  const maxGap = beatInterval * 2
  const result: number[] = [beats[0]]

  for (let i = 1; i < beats.length; i++) {
    const gap = beats[i] - beats[i - 1]
    if (gap > maxGap) {
      const fillCount = Math.round(gap / beatInterval) - 1
      for (let f = 1; f <= fillCount; f++) {
        result.push(beats[i - 1] + f * beatInterval)
      }
    }
    result.push(beats[i])
  }

  return result
}
