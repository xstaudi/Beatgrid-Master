'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useTrackStore } from '@/stores/track-store'
import { useHealthScore, useUnifiedTrackData } from '@/features/report'
import { ReportHeader } from '@/components/report/ReportHeader'
import { OverviewStep } from '@/components/report/steps/OverviewStep'
import { TracksStep } from '@/components/report/steps/TracksStep'
import { FixesStep } from '@/components/report/steps/FixesStep'
import { ExportStep } from '@/components/report/steps/ExportStep'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { classifyTracks } from '@/features/analyze/services/classify-tracks'

export default function ReportPage() {
  const results = useAnalysisStore((s) => s.results)
  const tracks = useTrackStore((s) => s.tracks)
  const healthScore = useHealthScore()
  const { rows, activeChecks } = useUnifiedTrackData()
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState('overview')

  if (!results || results.results.length === 0) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="art-deco-heading text-2xl">Keine Analyse vorhanden</h1>
        <p className="text-muted-foreground">Fuehre zuerst eine Analyse durch.</p>
        <Button asChild>
          <Link href="/analyze">Zur Analyse</Link>
        </Button>
      </main>
    )
  }

  const { verifyCount, freshCount } = classifyTracks(tracks)

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {healthScore && (
          <ReportHeader
            healthScore={healthScore}
            trackCount={rows.length}
            completedAt={results.completedAt}
            verifyCount={verifyCount}
            freshCount={freshCount}
          />
        )}

        <Tabs value={activeStep} onValueChange={setActiveStep}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="fixes">Fixes</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewStep results={results} onNext={() => setActiveStep('tracks')} />
          </TabsContent>

          <TabsContent value="tracks" className="mt-6">
            <TracksStep
              rows={rows}
              activeChecks={activeChecks}
              selectedTrackId={selectedTrackId}
              onSelectTrack={setSelectedTrackId}
              onCloseDetail={() => setSelectedTrackId(null)}
              onNext={() => setActiveStep('fixes')}
            />
          </TabsContent>

          <TabsContent value="fixes" className="mt-6">
            <FixesStep onNext={() => setActiveStep('export')} />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ExportStep />
          </TabsContent>
        </Tabs>

      </div>
    </main>
  )
}
