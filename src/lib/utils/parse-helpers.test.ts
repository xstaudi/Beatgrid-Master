import { describe, it, expect } from 'vitest'
import {
  safeParseFloat,
  safeParseInt,
  decodeRekordboxPath,
  buildTraktorPath,
  normalizeRating,
} from './parse-helpers'

describe('safeParseFloat', () => {
  it('parses valid floats', () => {
    expect(safeParseFloat('3.14')).toBe(3.14)
  })

  it('returns null for null/undefined/empty', () => {
    expect(safeParseFloat(null)).toBeNull()
    expect(safeParseFloat(undefined)).toBeNull()
    expect(safeParseFloat('')).toBeNull()
  })

  it('returns null for non-numeric strings', () => {
    expect(safeParseFloat('abc')).toBeNull()
  })

  it('parses integer strings as floats', () => {
    expect(safeParseFloat('42')).toBe(42)
  })
})

describe('safeParseInt', () => {
  it('parses valid integers', () => {
    expect(safeParseInt('42')).toBe(42)
  })

  it('returns null for null/undefined/empty', () => {
    expect(safeParseInt(null)).toBeNull()
    expect(safeParseInt(undefined)).toBeNull()
    expect(safeParseInt('')).toBeNull()
  })

  it('truncates floats to integers', () => {
    expect(safeParseInt('3.99')).toBe(3)
  })

  it('returns null for non-numeric strings', () => {
    expect(safeParseInt('xyz')).toBeNull()
  })
})

describe('decodeRekordboxPath', () => {
  it('removes file://localhost/ prefix', () => {
    expect(decodeRekordboxPath('file://localhost/Users/dj/music.mp3')).toBe(
      '/Users/dj/music.mp3'
    )
  })

  it('decodes URL-encoded characters', () => {
    expect(decodeRekordboxPath('file://localhost/Users/dj/M%C3%BCnchen%20Mix.mp3')).toBe(
      '/Users/dj/München Mix.mp3'
    )
  })
})

describe('buildTraktorPath', () => {
  it('builds path from dir, file, and volume', () => {
    expect(buildTraktorPath('/:Users/:dj/:Music/', 'track.mp3', '/')).toBe(
      '//Users/dj/Music/track.mp3'
    )
  })

  it('handles Windows-style volumes', () => {
    expect(buildTraktorPath('/:Music/:DJ/', 'track.mp3', 'C:')).toBe(
      'C:/Music/DJ/track.mp3'
    )
  })
})

describe('normalizeRating', () => {
  it('normalizes 255 to 5', () => {
    expect(normalizeRating(255)).toBe(5)
  })

  it('normalizes 0 to 0', () => {
    expect(normalizeRating(0)).toBe(0)
  })

  it('normalizes 153 to 3', () => {
    expect(normalizeRating(153)).toBe(3)
  })

  it('normalizes 51 to 1', () => {
    expect(normalizeRating(51)).toBe(1)
  })

  it('handles negative values', () => {
    expect(normalizeRating(-1)).toBe(0)
  })
})
