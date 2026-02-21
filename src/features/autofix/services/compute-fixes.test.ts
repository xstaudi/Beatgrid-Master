import { describe, it, expect } from 'vitest'
import { computeFixes } from './compute-fixes'
import type { Track } from '@/types/track'
import type {
  AnalysisResults,
  BpmCheckResult,
  KeyCheckResult,
  BeatgridCheckResult,
  ClippingCheckResult,
  MetadataAuditResult,
} from '@/types/analysis'

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'rb-1',
    source: 'rekordbox',
    sourceId: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    duration: 300,
    bpm: 128,
    key: 'Am',
    bitrate: 320,
    sampleRate: 44100,
    fileSize: 1000000,
    fileType: 'MP3',
    filePath: '/test.mp3',
    fileName: 'test.mp3',
    tempoMarkers: [{ position: 0.1, bpm: 128, meter: '4/4', beat: 1 }],
    cuePoints: [],
    dateAdded: null,
    ...overrides,
  }
}

function makeResults(results: AnalysisResults['results']): AnalysisResults {
  return {
    completedAt: new Date(),
    config: { checks: [] },
    results,
  }
}

describe('computeFixes', () => {
  describe('BPM', () => {
    it('should create fix for BPM error + !variableBpm', () => {
      const track = makeTrack()
      const bpmResult: BpmCheckResult = {
        type: 'bpm',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'error',
            storedBpm: 128,
            detectedBpm: 130,
            bpmDelta: 2,
            halfDoubleAdjusted: false,
            isVariableBpm: false,
            segmentBpms: [130],
            bpmVariancePercent: 0,
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksOk: 0,
          tracksWithWarnings: 0,
          tracksWithErrors: 1,
          tracksSkipped: 0,
          avgDetectedBpm: 130,
        },
      }

      const fixes = computeFixes([track], makeResults([bpmResult]))
      expect(fixes).toHaveLength(1)
      expect(fixes[0].operation.kind).toBe('bpm')
      expect(fixes[0].operation.detectedBpm).toBe(130)
      expect(fixes[0].status).toBe('pending')
      expect(fixes[0].preview.before).toBe('128.00 BPM')
      expect(fixes[0].preview.after).toBe('130.00 BPM')
    })

    it('should NOT create fix for variable BPM', () => {
      const track = makeTrack()
      const bpmResult: BpmCheckResult = {
        type: 'bpm',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'error',
            storedBpm: 128,
            detectedBpm: 130,
            bpmDelta: 2,
            halfDoubleAdjusted: false,
            isVariableBpm: true,
            segmentBpms: [128, 130, 132],
            bpmVariancePercent: 5,
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksOk: 0,
          tracksWithWarnings: 0,
          tracksWithErrors: 1,
          tracksSkipped: 0,
          avgDetectedBpm: 130,
        },
      }

      const fixes = computeFixes([track], makeResults([bpmResult]))
      expect(fixes).toHaveLength(0)
    })
  })

  describe('Key', () => {
    it('should create fix for key mismatch', () => {
      const track = makeTrack()
      const keyResult: KeyCheckResult = {
        type: 'key',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'error',
            detectedKey: 'Cm',
            libraryKey: 'Am',
            detectedCamelot: '5A',
            detectedOpenKey: '10m',
            confidence: 85,
            match: 'mismatch',
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksMatched: 0,
          tracksMismatched: 1,
          tracksRelativeKey: 0,
          tracksNoLibraryKey: 0,
          tracksSkipped: 0,
          avgConfidence: 85,
        },
      }

      const fixes = computeFixes([track], makeResults([keyResult]))
      expect(fixes).toHaveLength(1)
      expect(fixes[0].operation.kind).toBe('key')
      expect(fixes[0].operation.detectedKey).toBe('Cm')
      expect(fixes[0].preview.before).toBe('Am')
      expect(fixes[0].preview.after).toBe('Cm')
    })

    it('should create fix for no-library-key + detected', () => {
      const track = makeTrack({ key: null })
      const keyResult: KeyCheckResult = {
        type: 'key',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'warning',
            detectedKey: 'F#m',
            libraryKey: null,
            detectedCamelot: '11A',
            detectedOpenKey: '4m',
            confidence: 90,
            match: 'no-library-key',
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksMatched: 0,
          tracksMismatched: 0,
          tracksRelativeKey: 0,
          tracksNoLibraryKey: 1,
          tracksSkipped: 0,
          avgConfidence: 90,
        },
      }

      const fixes = computeFixes([track], makeResults([keyResult]))
      expect(fixes).toHaveLength(1)
      expect(fixes[0].operation.kind).toBe('key')
      expect(fixes[0].preview.before).toBe('–')
      expect(fixes[0].preview.after).toBe('F#m')
    })

    it('should NOT create fix for key match', () => {
      const track = makeTrack()
      const keyResult: KeyCheckResult = {
        type: 'key',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'ok',
            detectedKey: 'Am',
            libraryKey: 'Am',
            detectedCamelot: '8A',
            detectedOpenKey: '1m',
            confidence: 95,
            match: 'match',
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksMatched: 1,
          tracksMismatched: 0,
          tracksRelativeKey: 0,
          tracksNoLibraryKey: 0,
          tracksSkipped: 0,
          avgConfidence: 95,
        },
      }

      const fixes = computeFixes([track], makeResults([keyResult]))
      expect(fixes).toHaveLength(0)
    })
  })

  describe('Beatgrid', () => {
    it('should create fix for beatgrid error + !variableBpm', () => {
      const track = makeTrack()
      const bgResult: BeatgridCheckResult = {
        type: 'beatgrid',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'error',
            confidence: 80,
            driftPoints: [
              { beatIndex: 0, positionMs: 100, driftMs: 10, severity: 'error' },
              { beatIndex: 1, positionMs: 600, driftMs: 20, severity: 'error' },
            ],
            avgDriftMs: 15,
            maxDriftMs: 20,
            beatsAnalyzed: 100,
            beatsMatched: 85,
            isVariableBpm: false,
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksOk: 0,
          tracksWithWarnings: 0,
          tracksWithErrors: 1,
          tracksSkipped: 0,
          avgConfidence: 80,
        },
      }

      const fixes = computeFixes([track], makeResults([bgResult]))
      expect(fixes).toHaveLength(1)
      expect(fixes[0].operation.kind).toBe('beatgrid')
      // avgDrift = (10+20)/2 = 15ms = 0.015s, newDownbeat = 0.1 + 0.015 = 0.115
      expect(fixes[0].operation.newDownbeatSec).toBeCloseTo(0.115, 3)
      expect(fixes[0].status).toBe('pending')
    })

    it('should NOT create fix for variable BPM beatgrid', () => {
      const track = makeTrack()
      const bgResult: BeatgridCheckResult = {
        type: 'beatgrid',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'error',
            confidence: 60,
            driftPoints: [
              { beatIndex: 0, positionMs: 100, driftMs: 10, severity: 'error' },
            ],
            avgDriftMs: 10,
            maxDriftMs: 10,
            beatsAnalyzed: 100,
            beatsMatched: 70,
            isVariableBpm: true,
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksOk: 0,
          tracksWithWarnings: 0,
          tracksWithErrors: 1,
          tracksSkipped: 0,
          avgConfidence: 60,
        },
      }

      const fixes = computeFixes([track], makeResults([bgResult]))
      expect(fixes).toHaveLength(0)
    })
  })

  describe('Non-fixable checks', () => {
    it('should create clipping-normalize fix for error severity', () => {
      const track = makeTrack()
      const clippingResult: ClippingCheckResult = {
        type: 'clipping',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'error',
            hasClipping: true,
            clipCount: 5,
            totalClippedDuration: 0.5,
            peakLevelDb: 0,
            peakLevelLinear: 1,
            regions: [],
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksClean: 0,
          tracksWithWarnings: 0,
          tracksWithClipping: 1,
          avgPeakLevelDb: 0,
        },
      }

      const fixes = computeFixes([track], makeResults([clippingResult]))
      expect(fixes).toHaveLength(1)
      expect(fixes[0].operation.kind).toBe('clipping-normalize')
      expect(fixes[0].operation.peakLevelLinear).toBe(1)
      expect(fixes[0].operation.targetPeakDb).toBe(-0.1)
      expect(fixes[0].preview.before).toBe('0.0 dBFS')
      expect(fixes[0].preview.after).toBe('-0.1 dBFS')
    })

    it('should NOT create clipping-normalize fix for warning/ok severity', () => {
      const track = makeTrack()
      const clippingResult: ClippingCheckResult = {
        type: 'clipping',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'warning',
            hasClipping: true,
            clipCount: 2,
            totalClippedDuration: 0.05,
            peakLevelDb: -0.2,
            peakLevelLinear: 0.98,
            regions: [],
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksClean: 0,
          tracksWithWarnings: 1,
          tracksWithClipping: 0,
          avgPeakLevelDb: -0.2,
        },
      }

      const fixes = computeFixes([track], makeResults([clippingResult]))
      expect(fixes).toHaveLength(0)
    })

    it('should NOT create fixes for metadata results', () => {
      const track = makeTrack()
      const metaResult: MetadataAuditResult = {
        type: 'metadata',
        tracks: [
          {
            trackId: 'rb-1',
            overallSeverity: 'error',
            completenessScore: 50,
            fields: [],
          },
        ],
        libraryStats: {
          totalTracks: 1,
          tracksWithErrors: 1,
          tracksWithWarnings: 0,
          tracksOk: 0,
          avgCompletenessScore: 50,
          fieldCoverage: {},
        },
      }

      const fixes = computeFixes([track], makeResults([metaResult]))
      expect(fixes).toHaveLength(0)
    })
  })

  it('should set all statuses to pending', () => {
    const track = makeTrack()
    const bpmResult: BpmCheckResult = {
      type: 'bpm',
      tracks: [
        {
          trackId: 'rb-1',
          overallSeverity: 'error',
          storedBpm: 128,
          detectedBpm: 130,
          bpmDelta: 2,
          halfDoubleAdjusted: false,
          isVariableBpm: false,
          segmentBpms: [130],
          bpmVariancePercent: 0,
        },
      ],
      libraryStats: {
        totalTracks: 1,
        tracksOk: 0,
        tracksWithWarnings: 0,
        tracksWithErrors: 1,
        tracksSkipped: 0,
        avgDetectedBpm: 130,
      },
    }
    const keyResult: KeyCheckResult = {
      type: 'key',
      tracks: [
        {
          trackId: 'rb-1',
          overallSeverity: 'error',
          detectedKey: 'Cm',
          libraryKey: 'Am',
          detectedCamelot: '5A',
          detectedOpenKey: '10m',
          confidence: 85,
          match: 'mismatch',
        },
      ],
      libraryStats: {
        totalTracks: 1,
        tracksMatched: 0,
        tracksMismatched: 1,
        tracksRelativeKey: 0,
        tracksNoLibraryKey: 0,
        tracksSkipped: 0,
        avgConfidence: 85,
      },
    }

    const fixes = computeFixes([track], makeResults([bpmResult, keyResult]))
    expect(fixes).toHaveLength(2)
    expect(fixes.every((f) => f.status === 'pending')).toBe(true)
  })
})
