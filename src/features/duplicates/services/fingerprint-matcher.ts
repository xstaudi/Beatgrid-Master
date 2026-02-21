import type { RawFingerprintResult } from '@/types/audio'
import { FINGERPRINT_SIMILARITY_THRESHOLD, FINGERPRINT_MIN_OVERLAP_RATIO } from '../constants'

/**
 * Count set bits in a 32-bit integer (Hamming weight).
 */
export function popcount(n: number): number {
  n = n - ((n >>> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333)
  n = (n + (n >>> 4)) & 0x0f0f0f0f
  return (n * 0x01010101) >>> 24
}

/**
 * Hamming similarity between two fingerprints (0-1).
 * Compares bit-level differences like AcoustID.
 */
export function hammingSimilarity(a: Int32Array, b: Int32Array): number {
  const len = Math.min(a.length, b.length)
  if (len === 0) return 0

  // Reject if overlap is less than 50% of the longer fingerprint
  const maxLen = Math.max(a.length, b.length)
  if (len / maxLen < FINGERPRINT_MIN_OVERLAP_RATIO) return 0

  const totalBits = len * 32
  let differentBits = 0

  for (let i = 0; i < len; i++) {
    differentBits += popcount(a[i] ^ b[i])
  }

  return 1 - differentBits / totalBits
}

/**
 * Confirm duplicates within metadata candidate groups using audio fingerprints.
 * Only compares pairs within each group (blocking strategy).
 */
export function confirmDuplicates(
  candidateGroups: Map<string, Set<string>>,
  fingerprints: Map<string, RawFingerprintResult>,
): Map<string, { members: Set<string>; similarity: number }> {
  const confirmedGroups = new Map<string, { members: Set<string>; similarity: number }>()

  for (const [, members] of candidateGroups) {
    const memberIds = Array.from(members)
    const confirmed = new Set<string>()
    let totalSimilarity = 0
    let pairCount = 0

    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const fpA = fingerprints.get(memberIds[i])
        const fpB = fingerprints.get(memberIds[j])

        if (!fpA || !fpB) continue

        const sim = hammingSimilarity(fpA.fingerprint, fpB.fingerprint)
        if (sim >= FINGERPRINT_SIMILARITY_THRESHOLD) {
          confirmed.add(memberIds[i])
          confirmed.add(memberIds[j])
          totalSimilarity += sim
          pairCount++
        }
      }
    }

    if (confirmed.size >= 2) {
      const groupId = Array.from(confirmed).sort().join('::')
      confirmedGroups.set(groupId, {
        members: confirmed,
        similarity: pairCount > 0 ? totalSimilarity / pairCount : 0,
      })
    }
  }

  return confirmedGroups
}
