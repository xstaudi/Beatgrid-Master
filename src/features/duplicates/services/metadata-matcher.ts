import type { Track } from '@/types/track'
import {
  METADATA_TITLE_SIMILARITY_THRESHOLD,
  METADATA_ARTIST_SIMILARITY_THRESHOLD,
  METADATA_DURATION_TOLERANCE_SECONDS,
} from '../constants'

/**
 * Normalize a string for fuzzy matching:
 * - lowercase
 * - remove feat/featuring/ft. in parentheses/brackets
 * - collapse whitespace
 */
export function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\(\[]\s*(?:feat\.?|featuring|ft\.?)\s+[^\)\]]*[\)\]]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Dice coefficient (bigram similarity) — returns 0-1.
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0

  const bigramsA = new Map<string, number>()
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.slice(i, i + 2)
    bigramsA.set(bigram, (bigramsA.get(bigram) ?? 0) + 1)
  }

  let intersection = 0
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.slice(i, i + 2)
    const count = bigramsA.get(bigram)
    if (count && count > 0) {
      bigramsA.set(bigram, count - 1)
      intersection++
    }
  }

  return (2 * intersection) / (a.length - 1 + b.length - 1)
}

/**
 * Check if two track durations are within tolerance.
 */
export function durationMatches(durationA: number, durationB: number): boolean {
  return Math.abs(durationA - durationB) <= METADATA_DURATION_TOLERANCE_SECONDS
}

interface MetadataCandidate {
  trackId: string
  normalizedTitle: string
  normalizedArtist: string
  duration: number
}

/**
 * Build metadata-based duplicate groups using a blocking strategy.
 * Blocking key = first 3 chars of normalized artist + title.
 * Only pairs within the same block are compared, reducing O(N^2) to ~O(N).
 */
export function buildMetadataGroups(tracks: Track[]): Map<string, Set<string>> {
  const candidates: MetadataCandidate[] = tracks.map((t) => ({
    trackId: t.id,
    normalizedTitle: normalizeString(t.title),
    normalizedArtist: normalizeString(t.artist),
    duration: t.duration,
  }))

  // Build blocking index: key -> candidate indices
  const blocks = new Map<string, number[]>()
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const blockKey = (c.normalizedArtist.slice(0, 3) + c.normalizedTitle.slice(0, 3)).padEnd(6, '_')
    const list = blocks.get(blockKey)
    if (list) {
      list.push(i)
    } else {
      blocks.set(blockKey, [i])
    }
  }

  // Union-Find for grouping
  const parent = new Map<string, string>()
  function find(x: string): string {
    let root = x
    while (parent.get(root) !== root) {
      root = parent.get(root)!
    }
    // Path compression
    let current = x
    while (current !== root) {
      const next = parent.get(current)!
      parent.set(current, root)
      current = next
    }
    return root
  }
  function union(a: string, b: string) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (const c of candidates) {
    parent.set(c.trackId, c.trackId)
  }

  // Compare pairs within each block
  for (const indices of blocks.values()) {
    if (indices.length < 2) continue

    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        const a = candidates[indices[i]]
        const b = candidates[indices[j]]

        if (!durationMatches(a.duration, b.duration)) continue

        const titleSim = diceCoefficient(a.normalizedTitle, b.normalizedTitle)
        if (titleSim < METADATA_TITLE_SIMILARITY_THRESHOLD) continue

        const artistSim = diceCoefficient(a.normalizedArtist, b.normalizedArtist)
        if (artistSim < METADATA_ARTIST_SIMILARITY_THRESHOLD) continue

        union(a.trackId, b.trackId)
      }
    }
  }

  // Collect groups (only groups with 2+ members)
  const groups = new Map<string, Set<string>>()
  for (const c of candidates) {
    const root = find(c.trackId)
    const group = groups.get(root)
    if (group) {
      group.add(c.trackId)
    } else {
      groups.set(root, new Set([c.trackId]))
    }
  }

  // Filter to actual duplicate groups
  for (const [key, members] of groups) {
    if (members.size < 2) groups.delete(key)
  }

  return groups
}
