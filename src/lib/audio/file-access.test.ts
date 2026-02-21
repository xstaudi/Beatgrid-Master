import { describe, it, expect } from 'vitest'
import { matchTracksToFiles } from './file-access'
import type { Track } from '@/types/track'
import type { AudioFileHandle } from './file-access'

function mockTrack(id: string, fileName: string): Track {
  return {
    id,
    source: 'rekordbox',
    sourceId: id,
    title: fileName,
    artist: '',
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    duration: 180,
    bpm: null,
    key: null,
    bitrate: null,
    sampleRate: null,
    fileSize: null,
    fileType: 'mp3',
    filePath: `/music/${fileName}`,
    fileName,
    tempoMarkers: [],
    cuePoints: [],
    dateAdded: null,
  }
}

function mockAudioFile(name: string): AudioFileHandle {
  return { file: new File([], name), name, size: 1024 }
}

describe('matchTracksToFiles', () => {
  it('matches tracks to files by filename', () => {
    const tracks = [mockTrack('1', 'song.mp3'), mockTrack('2', 'beat.flac')]
    const files = [mockAudioFile('song.mp3'), mockAudioFile('beat.flac')]

    const result = matchTracksToFiles(tracks, files)
    expect(result.size).toBe(2)
    expect(result.get('1')?.name).toBe('song.mp3')
    expect(result.get('2')?.name).toBe('beat.flac')
  })

  it('matches case-insensitively', () => {
    const tracks = [mockTrack('1', 'Song.MP3')]
    const files = [mockAudioFile('song.mp3')]

    const result = matchTracksToFiles(tracks, files)
    expect(result.size).toBe(1)
  })

  it('returns empty map when no matches', () => {
    const tracks = [mockTrack('1', 'song.mp3')]
    const files = [mockAudioFile('other.flac')]

    const result = matchTracksToFiles(tracks, files)
    expect(result.size).toBe(0)
  })

  it('handles empty inputs', () => {
    expect(matchTracksToFiles([], []).size).toBe(0)
    expect(matchTracksToFiles([mockTrack('1', 'a.mp3')], []).size).toBe(0)
    expect(matchTracksToFiles([], [mockAudioFile('a.mp3')]).size).toBe(0)
  })

  it('handles duplicate filenames in audio files (last wins)', () => {
    const tracks = [mockTrack('1', 'song.mp3')]
    const file1 = mockAudioFile('song.mp3')
    const file2 = mockAudioFile('song.mp3')
    file2.size = 2048

    const result = matchTracksToFiles(tracks, [file1, file2])
    expect(result.size).toBe(1)
    expect(result.get('1')?.size).toBe(2048)
  })
})
