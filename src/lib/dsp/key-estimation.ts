/**
 * Krumhansl-Schmuckler key estimation algorithm.
 */
import {
  KRUMHANSL_MAJOR, KRUMHANSL_MINOR,
  TEMPERLEY_MAJOR, TEMPERLEY_MINOR,
  EDMM_MAJOR, EDMM_MINOR,
} from './key-profiles'

export type KeyProfile = 'krumhansl' | 'temperley' | 'edmm'

export interface KeyEstimation {
  key: string           // "C", "Am", "F#m" etc.
  pitchClass: number    // 0-11
  scale: 'major' | 'minor'
  confidence: number    // 0-1 (difference best vs. second-best correlation)
  correlation: number   // Pearson r of best match
}

const PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const PROFILES: Record<KeyProfile, { major: number[]; minor: number[] }> = {
  krumhansl: { major: KRUMHANSL_MAJOR, minor: KRUMHANSL_MINOR },
  temperley: { major: TEMPERLEY_MAJOR, minor: TEMPERLEY_MINOR },
  edmm: { major: EDMM_MAJOR, minor: EDMM_MINOR },
}

function pearsonCorrelation(a: number[] | Float64Array, b: number[]): number {
  const n = a.length
  let sumA = 0, sumB = 0
  for (let i = 0; i < n; i++) { sumA += a[i]; sumB += b[i] }
  const meanA = sumA / n
  const meanB = sumB / n

  let num = 0, denA = 0, denB = 0
  for (let i = 0; i < n; i++) {
    const dA = a[i] - meanA
    const dB = b[i] - meanB
    num += dA * dB
    denA += dA * dA
    denB += dB * dB
  }

  const den = Math.sqrt(denA * denB)
  return den === 0 ? 0 : num / den
}

function rotateProfile(profile: number[], shift: number): number[] {
  const n = profile.length
  const rotated = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    rotated[i] = profile[((i - shift) % n + n) % n]
  }
  return rotated
}

export function estimateKey(hpcp: Float64Array, profile: KeyProfile = 'edmm'): KeyEstimation {
  const { major, minor } = PROFILES[profile]

  let bestCorr = -Infinity
  let secondBestCorr = -Infinity
  let bestPitchClass = 0
  let bestScale: 'major' | 'minor' = 'major'

  // Test all 24 keys (12 major + 12 minor)
  for (let pc = 0; pc < 12; pc++) {
    const majorCorr = pearsonCorrelation(hpcp, rotateProfile(major, pc))
    const minorCorr = pearsonCorrelation(hpcp, rotateProfile(minor, pc))

    if (majorCorr > bestCorr) {
      secondBestCorr = bestCorr
      bestCorr = majorCorr
      bestPitchClass = pc
      bestScale = 'major'
    } else if (majorCorr > secondBestCorr) {
      secondBestCorr = majorCorr
    }

    if (minorCorr > bestCorr) {
      secondBestCorr = bestCorr
      bestCorr = minorCorr
      bestPitchClass = pc
      bestScale = 'minor'
    } else if (minorCorr > secondBestCorr) {
      secondBestCorr = minorCorr
    }
  }

  const keyName = bestScale === 'minor'
    ? `${PITCH_CLASS_NAMES[bestPitchClass]}m`
    : PITCH_CLASS_NAMES[bestPitchClass]

  const confidence = Math.max(0, Math.min(1, bestCorr - secondBestCorr))

  return {
    key: keyName,
    pitchClass: bestPitchClass,
    scale: bestScale,
    confidence,
    correlation: bestCorr,
  }
}
