import { describe, it, expect } from 'vitest'
import { calculateHealthScore } from './health-score'
import type { AnalysisResults, MetadataAuditResult, BeatgridCheckResult, BpmCheckResult } from '@/types/analysis'

function makeResults(overrides: Partial<AnalysisResults> = {}): AnalysisResults {
  return {
    completedAt: new Date(),
    config: { checks: ['metadata'] },
    results: [],
    ...overrides,
  }
}

function makeMetadataResult(ok: number, warnings: number, errors: number): MetadataAuditResult {
  return {
    type: 'metadata',
    tracks: [],
    libraryStats: {
      totalTracks: ok + warnings + errors,
      tracksOk: ok,
      tracksWithWarnings: warnings,
      tracksWithErrors: errors,
      avgCompletenessScore: (ok / (ok + warnings + errors)) * 100,
      fieldCoverage: {},
    },
  }
}

function makeBeatgridResult(ok: number, warnings: number, errors: number, skipped: number): BeatgridCheckResult {
  return {
    type: 'beatgrid',
    tracks: [],
    libraryStats: {
      totalTracks: ok + warnings + errors + skipped,
      tracksOk: ok,
      tracksWithWarnings: warnings,
      tracksWithErrors: errors,
      tracksSkipped: skipped,
      avgConfidence: 85,
    },
  }
}

function makeBpmResult(ok: number, warnings: number, errors: number, skipped: number): BpmCheckResult {
  return {
    type: 'bpm',
    tracks: [],
    libraryStats: {
      totalTracks: ok + warnings + errors + skipped,
      tracksOk: ok,
      tracksWithWarnings: warnings,
      tracksWithErrors: errors,
      tracksSkipped: skipped,
      avgDetectedBpm: 128,
    },
  }
}

describe('calculateHealthScore', () => {
  it('returns 0 for empty checks', () => {
    const result = calculateHealthScore(makeResults({ config: { checks: [] } }))
    expect(result.overall).toBe(0)
    expect(result.checks).toHaveLength(0)
  })

  it('calculates 100% when all tracks are ok', () => {
    const result = calculateHealthScore(
      makeResults({
        config: { checks: ['metadata'] },
        results: [makeMetadataResult(100, 0, 0)],
      }),
    )
    expect(result.overall).toBe(100)
    expect(result.checks).toHaveLength(1)
    expect(result.checks[0].score).toBe(100)
  })

  it('calculates 0% when no tracks are ok', () => {
    const result = calculateHealthScore(
      makeResults({
        config: { checks: ['metadata'] },
        results: [makeMetadataResult(0, 0, 10)],
      }),
    )
    expect(result.overall).toBe(0)
  })

  it('normalizes weights for active checks only', () => {
    const result = calculateHealthScore(
      makeResults({
        config: { checks: ['metadata', 'beatgrid'] },
        results: [
          makeMetadataResult(100, 0, 0),
          makeBeatgridResult(50, 25, 25, 0),
        ],
      }),
    )

    // metadata weight: 0.30, beatgrid weight: 0.20
    // normalized: meta = 0.30/0.50 = 0.60, beat = 0.20/0.50 = 0.40
    // meta score: 100, beat score: 50
    // overall: 100*0.60 + 50*0.40 = 80
    expect(result.overall).toBe(80)
    expect(result.checks).toHaveLength(2)
  })

  it('excludes skipped tracks from score calculation', () => {
    const result = calculateHealthScore(
      makeResults({
        config: { checks: ['beatgrid'] },
        results: [makeBeatgridResult(10, 0, 0, 5)],
      }),
    )

    // 10 ok out of 15 total, 5 skipped -> 10 / (15-5) = 100%
    expect(result.overall).toBe(100)
    expect(result.checks[0].tracksSkipped).toBe(5)
  })

  it('handles three active checks with mixed results', () => {
    const result = calculateHealthScore(
      makeResults({
        config: { checks: ['metadata', 'beatgrid', 'bpm'] },
        results: [
          makeMetadataResult(80, 10, 10),
          makeBeatgridResult(60, 20, 20, 0),
          makeBpmResult(90, 5, 5, 0),
        ],
      }),
    )

    // weights: meta=0.30, beat=0.20, bpm=0.15 -> total=0.65
    // normalized: 0.462, 0.308, 0.231
    // scores: 80, 60, 90
    // overall: 80*0.462 + 60*0.308 + 90*0.231 ≈ 76
    expect(result.overall).toBeGreaterThan(70)
    expect(result.overall).toBeLessThan(85)
    expect(result.checks).toHaveLength(3)
  })

  it('returns weight=1 for single active check', () => {
    const result = calculateHealthScore(
      makeResults({
        config: { checks: ['metadata'] },
        results: [makeMetadataResult(50, 25, 25)],
      }),
    )
    expect(result.checks[0].weight).toBe(1)
  })
})
