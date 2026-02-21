'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalysisResults, AnyCheckResult } from '@/types/analysis'
import { CHECK_LABELS, RECHARTS_TOOLTIP_STYLE } from '@/features/report'
import { getSeverityColor } from '@/lib/utils/chart-colors'

interface CheckBreakdownChartProps {
  results: AnalysisResults
}

function getBarData(result: AnyCheckResult) {
  switch (result.type) {
    case 'metadata':
      return { ok: result.libraryStats.tracksOk, warning: result.libraryStats.tracksWithWarnings, error: result.libraryStats.tracksWithErrors }
    case 'beatgrid':
      return { ok: result.libraryStats.tracksOk, warning: result.libraryStats.tracksWithWarnings, error: result.libraryStats.tracksWithErrors }
    case 'bpm':
      return { ok: result.libraryStats.tracksOk, warning: result.libraryStats.tracksWithWarnings, error: result.libraryStats.tracksWithErrors }
    case 'key':
      return { ok: result.libraryStats.tracksMatched, warning: result.libraryStats.tracksRelativeKey + result.libraryStats.tracksNoLibraryKey, error: result.libraryStats.tracksMismatched }
    case 'clipping':
      return { ok: result.libraryStats.tracksClean, warning: result.libraryStats.tracksWithWarnings, error: result.libraryStats.tracksWithClipping }
    case 'duplicates':
      return { ok: result.libraryStats.totalTracks - result.libraryStats.tracksInGroups, warning: 0, error: result.libraryStats.tracksInGroups }
  }
}

export function CheckBreakdownChart({ results }: CheckBreakdownChartProps) {
  const colors = useMemo(() => ({
    ok: getSeverityColor('ok'),
    warning: getSeverityColor('warning'),
    error: getSeverityColor('error'),
  }), [])

  const data = results.results.map((r) => ({
    name: CHECK_LABELS[r.type] ?? r.type,
    ...getBarData(r),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Check Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={RECHARTS_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ok" stackId="a" fill={colors.ok} name="OK" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warning" stackId="a" fill={colors.warning} name="Warning" />
              <Bar dataKey="error" stackId="a" fill={colors.error} name="Error" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
