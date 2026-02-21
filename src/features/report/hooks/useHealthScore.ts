import { useMemo } from 'react'
import { useAnalysisStore } from '@/stores/analysis-store'
import { calculateHealthScore, type HealthScoreResult } from '../services/health-score'

export function useHealthScore(): HealthScoreResult | null {
  const results = useAnalysisStore((s) => s.results)

  return useMemo(() => {
    if (!results) return null
    return calculateHealthScore(results)
  }, [results])
}
