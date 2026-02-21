import { describe, it, expect } from 'vitest'
import { checkDuplicatesMetadataOnly, checkDuplicatesLibrary } from './duplicate-check'
import type { Track } from '@/types/track'
import type { RawFingerprintResult } from '@/types/audio'

function makeTrack(overrides: Partial<Track> & { id: string; title: string; artist: string; duration: number }): Track {
  return {
    source: 'rekordbox',
    sourceId: overrides.id,
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    bpm: null,
    key: null,
    bitrate: 320,
    sampleRate: 44100,
    fileSize: 12_000_000,
    fileType: 'mp3',
    filePath: `/music/${overrides.id}.mp3`,
    fileName: `${overrides.id}.mp3`,
    tempoMarkers: [],
    cuePoints: [],
    dateAdded: null,
    ...overrides,
  }
}

describe('checkDuplicatesMetadataOnly', () => {
  it('identifies metadata duplicates', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 302 }),
      makeTrack({ id: 'c', title: 'Different Song', artist: 'Other Artist', duration: 200 }),
    ]

    const result = checkDuplicatesMetadataOnly(tracks)

    expect(result.type).toBe('duplicates')
    expect(result.groups.length).toBe(1)
    expect(result.groups[0].matchLevel).toBe('metadata')
    expect(result.groups[0].tracks.length).toBe(2)
    expect(result.libraryStats.totalTracks).toBe(3)
    expect(result.libraryStats.duplicateGroups).toBe(1)
    expect(result.libraryStats.tracksInGroups).toBe(2)
    expect(result.libraryStats.metadataOnlyGroups).toBe(1)
    expect(result.libraryStats.fingerprintConfirmedGroups).toBe(0)
  })

  it('handles no duplicates', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'Song A', artist: 'Artist A', duration: 300 }),
      makeTrack({ id: 'b', title: 'Song B', artist: 'Artist B', duration: 200 }),
    ]

    const result = checkDuplicatesMetadataOnly(tracks)
    expect(result.groups.length).toBe(0)
    expect(result.libraryStats.duplicateGroups).toBe(0)
  })

  it('recommends keeping higher quality track', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300, fileType: 'mp3', bitrate: 128 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 301, fileType: 'flac', bitrate: 1411 }),
    ]

    const result = checkDuplicatesMetadataOnly(tracks)
    expect(result.groups[0].recommendedKeepId).toBe('b')
  })

  it('sets severity warning for tracks in groups', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 301 }),
    ]

    const result = checkDuplicatesMetadataOnly(tracks)
    const trackA = result.tracks.find((t) => t.trackId === 'a')!
    const trackB = result.tracks.find((t) => t.trackId === 'b')!

    expect(trackA.overallSeverity).toBe('warning')
    expect(trackB.overallSeverity).toBe('warning')
    expect(trackA.duplicateGroupId).not.toBeNull()
  })

  it('identifies cross-format duplicates', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'Track One', artist: 'DJ Cool', duration: 300, fileType: 'mp3' }),
      makeTrack({ id: 'b', title: 'Track One', artist: 'DJ Cool', duration: 301, fileType: 'flac' }),
    ]

    const result = checkDuplicatesMetadataOnly(tracks)
    expect(result.groups.length).toBe(1)
  })
})

describe('checkDuplicatesLibrary', () => {
  it('confirms duplicates with matching fingerprints', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 301 }),
    ]

    // Identical fingerprints
    const fingerprints = new Map<string, RawFingerprintResult>([
      ['a', { trackId: 'a', fingerprint: new Int32Array([1, 2, 3, 4, 5, 6, 7, 8]), duration: 300 }],
      ['b', { trackId: 'b', fingerprint: new Int32Array([1, 2, 3, 4, 5, 6, 7, 8]), duration: 301 }],
    ])

    const result = checkDuplicatesLibrary(tracks, fingerprints)
    expect(result.groups.length).toBe(1)
    expect(result.groups[0].matchLevel).toBe('fingerprint')
    expect(result.libraryStats.fingerprintConfirmedGroups).toBe(1)
  })

  it('keeps metadata groups when fingerprints dont match', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 301 }),
    ]

    // Very different fingerprints
    const fingerprints = new Map<string, RawFingerprintResult>([
      ['a', { trackId: 'a', fingerprint: new Int32Array([0, 0, 0, 0, 0, 0, 0, 0]), duration: 300 }],
      ['b', { trackId: 'b', fingerprint: new Int32Array([-1, -1, -1, -1, -1, -1, -1, -1]), duration: 301 }],
    ])

    const result = checkDuplicatesLibrary(tracks, fingerprints)
    expect(result.groups.length).toBe(1)
    expect(result.groups[0].matchLevel).toBe('metadata')
    expect(result.libraryStats.metadataOnlyGroups).toBe(1)
  })

  it('handles missing fingerprints gracefully', () => {
    const tracks = [
      makeTrack({ id: 'a', title: 'My Song', artist: 'Artist', duration: 300 }),
      makeTrack({ id: 'b', title: 'My Song', artist: 'Artist', duration: 301 }),
    ]

    // No fingerprints available
    const fingerprints = new Map<string, RawFingerprintResult>()

    const result = checkDuplicatesLibrary(tracks, fingerprints)
    expect(result.groups.length).toBe(1)
    expect(result.groups[0].matchLevel).toBe('metadata')
  })
})
