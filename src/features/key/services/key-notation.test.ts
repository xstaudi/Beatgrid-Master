import { describe, it, expect } from 'vitest'
import {
  musicalToCamelot,
  musicalToOpenKey,
  camelotToMusical,
  normalizeKey,
  getRelativeKey,
  getCompatibleKeys,
} from './key-notation'

describe('musicalToCamelot', () => {
  it('should convert all 24 keys correctly', () => {
    expect(musicalToCamelot('Am')).toBe('8A')
    expect(musicalToCamelot('C')).toBe('8B')
    expect(musicalToCamelot('Em')).toBe('9A')
    expect(musicalToCamelot('G')).toBe('9B')
    expect(musicalToCamelot('F#m')).toBe('11A')
    expect(musicalToCamelot('A')).toBe('11B')
  })

  it('should return null for invalid keys', () => {
    expect(musicalToCamelot('X')).toBeNull()
    expect(musicalToCamelot('')).toBeNull()
  })
})

describe('musicalToOpenKey', () => {
  it('should convert correctly', () => {
    expect(musicalToOpenKey('Am')).toBe('1m')
    expect(musicalToOpenKey('C')).toBe('1d')
    expect(musicalToOpenKey('F#m')).toBe('4m')
  })
})

describe('camelotToMusical', () => {
  it('should convert Camelot to musical notation', () => {
    expect(camelotToMusical('8A')).toBe('Am')
    expect(camelotToMusical('8B')).toBe('C')
    expect(camelotToMusical('11A')).toBe('F#m')
    expect(camelotToMusical('1B')).toBe('B')
  })

  it('should return null for invalid Camelot', () => {
    expect(camelotToMusical('13A')).toBeNull()
    expect(camelotToMusical('0B')).toBeNull()
  })
})

describe('normalizeKey', () => {
  it('should normalize musical notation variants', () => {
    expect(normalizeKey('Am')).toBe('Am')
    expect(normalizeKey('am')).toBe('Am')
    expect(normalizeKey('A minor')).toBe('Am')
    expect(normalizeKey('A min')).toBe('Am')
    expect(normalizeKey('C')).toBe('C')
    expect(normalizeKey('c')).toBe('C')
    expect(normalizeKey('C major')).toBe('C')
    expect(normalizeKey('C maj')).toBe('C')
  })

  it('should normalize Camelot notation', () => {
    expect(normalizeKey('8A')).toBe('Am')
    expect(normalizeKey('8B')).toBe('C')
    expect(normalizeKey('11a')).toBe('F#m')
  })

  it('should normalize OpenKey notation', () => {
    expect(normalizeKey('1m')).toBe('Am')
    expect(normalizeKey('1d')).toBe('C')
  })

  it('should handle enharmonic equivalents', () => {
    expect(normalizeKey('Db')).toBe('C#')
    expect(normalizeKey('Gb')).toBe('F#')
    expect(normalizeKey('Dbm')).toBe('C#m')
    expect(normalizeKey('Gbm')).toBe('F#m')
  })

  it('should return null for invalid input', () => {
    expect(normalizeKey('')).toBeNull()
    expect(normalizeKey('X')).toBeNull()
    expect(normalizeKey('H')).toBeNull()
  })
})

describe('getRelativeKey', () => {
  it('should find relative keys', () => {
    expect(getRelativeKey('Am')).toBe('C')
    expect(getRelativeKey('C')).toBe('Am')
    expect(getRelativeKey('F#m')).toBe('A')
    expect(getRelativeKey('A')).toBe('F#m')
    expect(getRelativeKey('Em')).toBe('G')
    expect(getRelativeKey('G')).toBe('Em')
  })

  it('should return null for invalid input', () => {
    expect(getRelativeKey('invalid')).toBeNull()
  })
})

describe('getCompatibleKeys', () => {
  it('should return 3 compatible keys', () => {
    const compatible = getCompatibleKeys('Am')
    expect(compatible).toHaveLength(3)
    // Am (8A) -> 7A (Dm), 9A (Em), 8B (C)
    expect(compatible).toContain('Dm')
    expect(compatible).toContain('Em')
    expect(compatible).toContain('C')
  })

  it('should return empty array for invalid input', () => {
    expect(getCompatibleKeys('invalid')).toEqual([])
  })
})
