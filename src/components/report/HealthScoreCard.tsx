'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HealthScoreResult } from '@/features/report'
import { CHECK_LABELS, scoreColor, RECHARTS_TOOLTIP_STYLE } from '@/features/report'
import { getChartColor } from '@/lib/utils/chart-colors'

interface HealthScoreCardProps {
  healthScore: HealthScoreResult
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const colors = useMemo(
    () => healthScore.checks.map((_, i) => getChartColor((i % 5) + 1)),
    [healthScore.checks],
  )

  const data = healthScore.checks.map((c) => ({
    name: CHECK_LABELS[c.checkId] ?? c.checkId,
    value: c.weight * 100,
    score: c.score,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Library Health Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative h-52"
          role="img"
          aria-label={`Library health score: ${healthScore.overall}%`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="60%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(_value, name, props) => {
                  const score = (props.payload as { score: number }).score
                  return [`${score}%`, name]
                }}
                contentStyle={RECHARTS_TOOLTIP_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-3xl font-bold ${scoreColor(healthScore.overall)}`}>
              {healthScore.overall}%
            </span>
            <span className="text-xs text-muted-foreground">Overall</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {healthScore.checks.map((c, i) => (
            <div key={c.checkId} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="text-muted-foreground">
                {CHECK_LABELS[c.checkId] ?? c.checkId}: {c.score}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
