/**
 * Musical key notation system: Musical <-> Camelot <-> Open Key conversions.
 */

export interface KeyInfo {
  musical: string      // "Am", "C", "F#m"
  camelot: string      // "8A", "11B"
  openKey: string      // "1m", "6d"
  pitchClass: number   // 0-11
  scale: 'major' | 'minor'
}

// All 24 keys mapped between notation systems
const KEY_TABLE: KeyInfo[] = [
  // Minor keys (Camelot A = minor)
  { musical: 'Am',  camelot: '8A',  openKey: '1m',  pitchClass: 9,  scale: 'minor' },
  { musical: 'Em',  camelot: '9A',  openKey: '2m',  pitchClass: 4,  scale: 'minor' },
  { musical: 'Bm',  camelot: '10A', openKey: '3m',  pitchClass: 11, scale: 'minor' },
  { musical: 'F#m', camelot: '11A', openKey: '4m',  pitchClass: 6,  scale: 'minor' },
  { musical: 'C#m', camelot: '12A', openKey: '5m',  pitchClass: 1,  scale: 'minor' },
  { musical: 'G#m', camelot: '1A',  openKey: '6m',  pitchClass: 8,  scale: 'minor' },
  { musical: 'D#m', camelot: '2A',  openKey: '7m',  pitchClass: 3,  scale: 'minor' },
  { musical: 'A#m', camelot: '3A',  openKey: '8m',  pitchClass: 10, scale: 'minor' },
  { musical: 'Fm',  camelot: '4A',  openKey: '9m',  pitchClass: 5,  scale: 'minor' },
  { musical: 'Cm',  camelot: '5A',  openKey: '10m', pitchClass: 0,  scale: 'minor' },
  { musical: 'Gm',  camelot: '6A',  openKey: '11m', pitchClass: 7,  scale: 'minor' },
  { musical: 'Dm',  camelot: '7A',  openKey: '12m', pitchClass: 2,  scale: 'minor' },

  // Major keys (Camelot B = major)
  { musical: 'C',   camelot: '8B',  openKey: '1d',  pitchClass: 0,  scale: 'major' },
  { musical: 'G',   camelot: '9B',  openKey: '2d',  pitchClass: 7,  scale: 'major' },
  { musical: 'D',   camelot: '10B', openKey: '3d',  pitchClass: 2,  scale: 'major' },
  { musical: 'A',   camelot: '11B', openKey: '4d',  pitchClass: 9,  scale: 'major' },
  { musical: 'E',   camelot: '12B', openKey: '5d',  pitchClass: 4,  scale: 'major' },
  { musical: 'B',   camelot: '1B',  openKey: '6d',  pitchClass: 11, scale: 'major' },
  { musical: 'F#',  camelot: '2B',  openKey: '7d',  pitchClass: 6,  scale: 'major' },
  { musical: 'C#',  camelot: '3B',  openKey: '8d',  pitchClass: 1,  scale: 'major' },
  { musical: 'Ab',  camelot: '4B',  openKey: '9d',  pitchClass: 8,  scale: 'major' },
  { musical: 'Eb',  camelot: '5B',  openKey: '10d', pitchClass: 3,  scale: 'major' },
  { musical: 'Bb',  camelot: '6B',  openKey: '11d', pitchClass: 10, scale: 'major' },
  { musical: 'F',   camelot: '7B',  openKey: '12d', pitchClass: 5,  scale: 'major' },
]

// Build lookup maps
const byMusical = new Map<string, KeyInfo>()
const byCamelot = new Map<string, KeyInfo>()
const byOpenKey = new Map<string, KeyInfo>()

for (const info of KEY_TABLE) {
  byMusical.set(info.musical, info)
  byCamelot.set(info.camelot, info)
  byOpenKey.set(info.openKey, info)
}

// Enharmonic equivalents for normalization
const ENHARMONIC_MAP: Record<string, string> = {
  'Db': 'C#', 'Dbm': 'C#m',
  'Gb': 'F#', 'Gbm': 'F#m',
  'Abm': 'G#m',
  'Bbm': 'A#m',
  'Ebm': 'D#m',
  'Cb': 'B', 'Cbm': 'Bm',
  'E#': 'F', 'E#m': 'Fm',
  'B#': 'C', 'B#m': 'Cm',
}

export function musicalToCamelot(key: string): string | null {
  const normalized = normalizeKey(key)
  if (!normalized) return null
  return byMusical.get(normalized)?.camelot ?? null
}

export function musicalToOpenKey(key: string): string | null {
  const normalized = normalizeKey(key)
  if (!normalized) return null
  return byMusical.get(normalized)?.openKey ?? null
}

export function camelotToMusical(camelot: string): string | null {
  return byCamelot.get(camelot.toUpperCase())?.musical ?? null
}

/**
 * Normalize any key format to canonical musical notation.
 * Accepts: "Am", "am", "A minor", "A min", "8A" (Camelot), "1m" (OpenKey)
 */
export function normalizeKey(input: string): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try Camelot format (e.g. "8A", "11B")
  const camelotMatch = trimmed.match(/^(\d{1,2})([ABab])$/)
  if (camelotMatch) {
    const camelotKey = `${camelotMatch[1]}${camelotMatch[2].toUpperCase()}`
    return byCamelot.get(camelotKey)?.musical ?? null
  }

  // Try OpenKey format (e.g. "1m", "6d")
  const openKeyMatch = trimmed.match(/^(\d{1,2})([mdMD])$/)
  if (openKeyMatch) {
    const okKey = `${openKeyMatch[1]}${openKeyMatch[2].toLowerCase()}`
    return byOpenKey.get(okKey)?.musical ?? null
  }

  // Try musical notation
  // "A minor" -> "Am", "C# major" -> "C#", "Db min" -> "C#"
  const musicalMatch = trimmed.match(/^([A-Ga-g][#b]?)\s*(m|min|minor|maj|major)?$/i)
  if (musicalMatch) {
    const root = musicalMatch[1].charAt(0).toUpperCase() + musicalMatch[1].slice(1)
    const qualifier = (musicalMatch[2] ?? '').toLowerCase()
    const isMinor = qualifier === 'm' || qualifier === 'min' || qualifier === 'minor'
    const key = isMinor ? `${root}m` : root

    // Apply enharmonic normalization
    const enharmonic = ENHARMONIC_MAP[key]
    if (enharmonic) return byMusical.has(enharmonic) ? enharmonic : null

    return byMusical.has(key) ? key : null
  }

  return null
}

/**
 * Get relative major/minor key. Am <-> C, F#m <-> A, etc.
 */
export function getRelativeKey(key: string): string | null {
  const normalized = normalizeKey(key)
  if (!normalized) return null
  const info = byMusical.get(normalized)
  if (!info) return null

  // Relative key: same Camelot number, opposite letter
  const camelotNum = info.camelot.slice(0, -1)
  const camelotLetter = info.camelot.endsWith('A') ? 'B' : 'A'
  return byCamelot.get(`${camelotNum}${camelotLetter}`)?.musical ?? null
}

/**
 * Get harmonically compatible keys (Camelot wheel neighbors).
 * Returns keys that are +1, -1 on the wheel, plus the relative key.
 */
export function getCompatibleKeys(key: string): string[] {
  const normalized = normalizeKey(key)
  if (!normalized) return []
  const info = byMusical.get(normalized)
  if (!info) return []

  const num = parseInt(info.camelot.slice(0, -1), 10)
  const letter = info.camelot.endsWith('A') ? 'A' : 'B'

  const neighbors: string[] = []

  // Same letter, +/- 1
  const prev = ((num - 2 + 12) % 12) + 1
  const next = (num % 12) + 1
  const prevKey = byCamelot.get(`${prev}${letter}`)
  const nextKey = byCamelot.get(`${next}${letter}`)
  if (prevKey) neighbors.push(prevKey.musical)
  if (nextKey) neighbors.push(nextKey.musical)

  // Relative key (same number, opposite letter)
  const relLetter = letter === 'A' ? 'B' : 'A'
  const relKey = byCamelot.get(`${num}${relLetter}`)
  if (relKey) neighbors.push(relKey.musical)

  return neighbors
}
