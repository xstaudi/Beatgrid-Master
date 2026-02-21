import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { detectSoftware, createAdapter, parseLibraryXml } from './index'
import { RekordboxAdapter } from './rekordbox'
import { TraktorAdapter } from './traktor'

const rekordboxXml = readFileSync(
  resolve(__dirname, '../../test/fixtures/rekordbox-sample.xml'),
  'utf-8'
)
const traktorNml = readFileSync(
  resolve(__dirname, '../../test/fixtures/traktor-sample.nml'),
  'utf-8'
)

describe('detectSoftware', () => {
  it('detects Rekordbox XML', () => {
    expect(detectSoftware(rekordboxXml)).toBe('rekordbox')
  })

  it('detects Traktor NML', () => {
    expect(detectSoftware(traktorNml)).toBe('traktor')
  })

  it('throws on unknown format', () => {
    expect(() => detectSoftware('<root><unknown/></root>')).toThrow('Unrecognized DJ software')
  })
})

describe('createAdapter', () => {
  it('creates RekordboxAdapter', () => {
    expect(createAdapter('rekordbox')).toBeInstanceOf(RekordboxAdapter)
  })

  it('creates TraktorAdapter', () => {
    expect(createAdapter('traktor')).toBeInstanceOf(TraktorAdapter)
  })
})

describe('parseLibraryXml', () => {
  it('auto-detects and parses Rekordbox XML', () => {
    const result = parseLibraryXml(rekordboxXml)
    expect(result.source).toBe('rekordbox')
    expect(result.tracks.length).toBeGreaterThan(0)
  })

  it('auto-detects and parses Traktor NML', () => {
    const result = parseLibraryXml(traktorNml)
    expect(result.source).toBe('traktor')
    expect(result.tracks.length).toBeGreaterThan(0)
  })
})
