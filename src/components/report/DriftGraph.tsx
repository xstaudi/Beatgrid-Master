'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts'
import type { BeatDriftPoint } from '@/types/analysis'
import { RECHARTS_TOOLTIP_STYLE } from '@/features/report'
import { getSeverityColor } from '@/lib/utils/chart-colors'
import { formatDurationMs } from '@/lib/utils/format'

interface DriftGraphProps {
  driftPoints: BeatDriftPoint[]
  duration: number
}

export function DriftGraph({ driftPoints, duration }: DriftGraphProps) {
  const colors = useMemo(() => ({
    ok: getSeverityColor('ok'),
    warning: getSeverityColor('warning'),
    error: getSeverityColor('error'),
  }), [])

  if (driftPoints.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed bg-muted/30 h-40">
        <p className="text-sm text-muted-foreground">No drift data available</p>
      </div>
    )
  }

  const data = driftPoints.map((p) => ({
    position: p.positionMs,
    drift: p.driftMs,
    severity: p.severity,
  }))

  const maxAbsDrift = Math.max(
    30,
    ...driftPoints.map((p) => Math.abs(p.driftMs)),
  )
  const yDomain = [-maxAbsDrift * 1.1, maxAbsDrift * 1.1]

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          {/* OK band: +-10ms */}
          <ReferenceArea y1={-10} y2={10} fill={colors.ok} fillOpacity={0.1} />
          {/* Warning band: +-30ms */}
          <ReferenceArea y1={-30} y2={-10} fill={colors.warning} fillOpacity={0.08} />
          <ReferenceArea y1={10} y2={30} fill={colors.warning} fillOpacity={0.08} />
          <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.3} />

          <XAxis
            dataKey="position"
            tickFormatter={formatDurationMs}
            tick={{ fontSize: 10 }}
            domain={[0, duration * 1000]}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}ms`}
            width={50}
          />
          <Tooltip
            labelFormatter={(label) => formatDurationMs(Number(label))}
            formatter={(value) => [`${Number(value).toFixed(1)}ms`, 'Drift']}
            contentStyle={{ ...RECHARTS_TOOLTIP_STYLE, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="drift"
            stroke="hsl(var(--chart-1))"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
