import { describe, it, expect } from 'vitest'
import { auditTrack, auditLibrary } from './metadata-audit'
import type { Track } from '@/types/track'

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'test-1',
    source: 'rekordbox',
    sourceId: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    genre: 'House',
    composer: 'Test Composer',
    label: 'Test Label',
    comment: 'Great track',
    year: 2023,
    rating: 5,
    duration: 300,
    bpm: 128,
    key: 'Am',
    bitrate: 320,
    sampleRate: 44100,
    fileSize: 9000000,
    fileType: 'MP3',
    filePath: '/music/test.mp3',
    fileName: 'test.mp3',
    tempoMarkers: [],
    cuePoints: [],
    dateAdded: '2023-01-01',
    ...overrides,
  }
}

describe('auditTrack', () => {
  it('returns score 100 and severity ok when all fields present', () => {
    const result = auditTrack(makeTrack())
    expect(result.completenessScore).toBe(100)
    expect(result.overallSeverity).toBe('ok')
    expect(result.fields.every((f) => f.severity === 'ok')).toBe(true)
  })

  it('returns severity error when title is missing', () => {
    const result = auditTrack(makeTrack({ title: '' }))
    expect(result.overallSeverity).toBe('error')
    expect(result.completenessScore).toBe(75)
    const titleField = result.fields.find((f) => f.field === 'title')
    expect(titleField?.severity).toBe('error')
    expect(titleField?.message).toContain('Missing required')
  })

  it('returns severity error when artist is missing', () => {
    const result = auditTrack(makeTrack({ artist: '' }))
    expect(result.overallSeverity).toBe('error')
    expect(result.completenessScore).toBe(75)
    const artistField = result.fields.find((f) => f.field === 'artist')
    expect(artistField?.severity).toBe('error')
  })

  it('returns severity warning when genre is missing', () => {
    const result = auditTrack(makeTrack({ genre: '' }))
    expect(result.overallSeverity).toBe('warning')
    const genreField = result.fields.find((f) => f.field === 'genre')
    expect(genreField?.severity).toBe('warning')
  })

  it('returns warning when year is out of range', () => {
    const result = auditTrack(makeTrack({ year: 1800 }))
    const yearField = result.fields.find((f) => f.field === 'year')
    expect(yearField?.severity).toBe('warning')
    expect(yearField?.message).toContain('out of valid range')
  })

  it('returns ok when key is null (nice-to-have)', () => {
    const result = auditTrack(makeTrack({ key: null }))
    expect(result.overallSeverity).toBe('ok')
    const keyField = result.fields.find((f) => f.field === 'key')
    expect(keyField?.severity).toBe('ok')
  })

  it('returns severity warning when all recommended missing but required present', () => {
    const result = auditTrack(
      makeTrack({
        genre: '',
        year: null,
        album: '',
        key: null,
        composer: '',
        label: '',
        comment: '',
      })
    )
    expect(result.overallSeverity).toBe('warning')
    // title (25) + artist (25) = 50 out of 100
    expect(result.completenessScore).toBe(50)
  })
})

describe('auditLibrary', () => {
  it('handles empty array', () => {
    const result = auditLibrary([])
    expect(result.libraryStats.totalTracks).toBe(0)
    expect(result.libraryStats.avgCompletenessScore).toBe(0)
    expect(result.tracks).toHaveLength(0)
  })

  it('counts mixed severity tracks correctly', () => {
    const tracks = [
      makeTrack({ id: '1' }), // ok
      makeTrack({ id: '2', title: '' }), // error
      makeTrack({ id: '3', genre: '' }), // warning
    ]
    const result = auditLibrary(tracks)
    expect(result.libraryStats.tracksOk).toBe(1)
    expect(result.libraryStats.tracksWithErrors).toBe(1)
    expect(result.libraryStats.tracksWithWarnings).toBe(1)
  })

  it('calculates correct average completeness score', () => {
    const tracks = [
      makeTrack({ id: '1' }), // 100
      makeTrack({ id: '2', title: '' }), // 75
    ]
    const result = auditLibrary(tracks)
    expect(result.libraryStats.avgCompletenessScore).toBe(88) // Math.round((100+75)/2)
  })

  it('calculates field coverage percentages correctly', () => {
    const tracks = [
      makeTrack({ id: '1', genre: 'House' }),
      makeTrack({ id: '2', genre: '' }),
      makeTrack({ id: '3', genre: 'Techno' }),
      makeTrack({ id: '4', genre: '' }),
    ]
    const result = auditLibrary(tracks)
    expect(result.libraryStats.fieldCoverage.genre).toBe(50)
    expect(result.libraryStats.fieldCoverage.title).toBe(100)
  })
})
