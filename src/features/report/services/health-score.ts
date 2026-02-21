import type {
  AnalysisResults,
  AnyCheckResult,
  CheckId,
  MetadataAuditResult,
  BeatgridCheckResult,
  BpmCheckResult,
  KeyCheckResult,
  ClippingCheckResult,
  DuplicateCheckResult,
} from '@/types/analysis'

const HEALTH_WEIGHTS: Record<CheckId, number> = {
  metadata: 0.30,
  beatgrid: 0.20,
  bpm: 0.15,
  key: 0.15,
  clipping: 0.10,
  duplicates: 0.10,
}

export interface CheckScore {
  checkId: CheckId
  score: number // 0-100
  weight: number // normalized weight
  tracksOk: number
  tracksTotal: number
  tracksSkipped: number
}

export interface HealthScoreResult {
  overall: number // 0-100
  checks: CheckScore[]
}

function getCheckStats(result: AnyCheckResult): { ok: number; total: number; skipped: number } {
  const s = result.libraryStats
  switch (result.type) {
    case 'metadata':
      return { ok: (s as MetadataAuditResult['libraryStats']).tracksOk, total: s.totalTracks, skipped: 0 }
    case 'beatgrid':
      return { ok: (s as BeatgridCheckResult['libraryStats']).tracksOk, total: s.totalTracks, skipped: (s as BeatgridCheckResult['libraryStats']).tracksSkipped }
    case 'bpm':
      return { ok: (s as BpmCheckResult['libraryStats']).tracksOk, total: s.totalTracks, skipped: (s as BpmCheckResult['libraryStats']).tracksSkipped }
    case 'key':
      return { ok: (s as KeyCheckResult['libraryStats']).tracksMatched, total: s.totalTracks, skipped: (s as KeyCheckResult['libraryStats']).tracksSkipped }
    case 'clipping':
      return { ok: (s as ClippingCheckResult['libraryStats']).tracksClean, total: s.totalTracks, skipped: 0 }
    case 'duplicates': {
      const ds = s as DuplicateCheckResult['libraryStats']
      return { ok: ds.totalTracks - ds.tracksInGroups, total: ds.totalTracks, skipped: 0 }
    }
  }
}

export function calculateHealthScore(results: AnalysisResults): HealthScoreResult {
  const activeChecks = results.config.checks
  if (activeChecks.length === 0) return { overall: 0, checks: [] }

  // Normalize weights for active checks only
  const totalWeight = activeChecks.reduce((sum, id) => sum + HEALTH_WEIGHTS[id], 0)

  const checks: CheckScore[] = []
  let weightedSum = 0

  for (const checkId of activeChecks) {
    const result = results.results.find((r) => r.type === checkId)
    if (!result) continue

    const { ok, total, skipped } = getCheckStats(result)
    const eligible = total - skipped
    const score = eligible > 0 ? (ok / eligible) * 100 : 100
    const normalizedWeight = HEALTH_WEIGHTS[checkId] / totalWeight

    checks.push({
      checkId,
      score: Math.round(score),
      weight: normalizedWeight,
      tracksOk: ok,
      tracksTotal: total,
      tracksSkipped: skipped,
    })

    weightedSum += score * normalizedWeight
  }

  return {
    overall: Math.round(weightedSum),
    checks,
  }
}
