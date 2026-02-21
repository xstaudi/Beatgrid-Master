'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ListChecks, AudioWaveform, Music, ScanSearch } from 'lucide-react'

const features = [
  {
    title: 'Metadata Audit',
    description: 'Find missing tags, incomplete metadata, and inconsistencies across your library.',
    icon: ListChecks,
    available: true,
  },
  {
    title: 'Beatgrid Check',
    description: 'Verify beatgrid alignment and detect drift in your tracks.',
    icon: AudioWaveform,
    available: false,
  },
  {
    title: 'BPM Verification',
    description: 'Cross-check BPM values against audio analysis results.',
    icon: Music,
    available: false,
  },
  {
    title: 'Key Detection',
    description: 'Validate musical key assignments for harmonic mixing accuracy.',
    icon: ScanSearch,
    available: false,
  },
]

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Know Your Library.
          <br />
          <span className="text-muted-foreground">Fix It Before the Gig.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Analyze your Rekordbox or Traktor library for beatgrid issues, wrong BPMs, missing
          metadata, and more — all without uploading a single file.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/analyze">Analyze Your Library</Link>
        </Button>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">What We Check</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <Card key={f.title}>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  {!f.available && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Privacy Section */}
      <section className="border-t border-border py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 text-center">
          <ShieldCheck className="h-12 w-12 text-chart-2" />
          <h2 className="text-2xl font-bold tracking-tight">Your Music Never Leaves Your Computer</h2>
          <p className="text-muted-foreground">
            All analysis runs locally in your browser using WebAssembly. No audio is uploaded, no
            data is stored on our servers. Your library stays private.
          </p>
        </div>
      </section>

      {/* CTA Repeat */}
      <section className="border-t border-border py-16">
        <div className="mx-auto flex flex-col items-center gap-4 px-6">
          <h2 className="text-xl font-bold">Ready to check your library?</h2>
          <Button asChild size="lg">
            <Link href="/analyze">Analyze Your Library</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
