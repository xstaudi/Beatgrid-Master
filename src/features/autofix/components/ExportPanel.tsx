'use client'

import { useState } from 'react'
import { CheckCircle2, Download, Loader2, Volume2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFixStore } from '@/stores/fix-store'
import { useTrackStore } from '@/stores/track-store'
import { useExport } from '../hooks/useExport'
import type { MutationResult } from '@/types/fix'

export function ExportPanel() {
  const fixes = useFixStore((s) => s.fixes)
  const source = useTrackStore((s) => s.source)
  const approveAll = useFixStore((s) => s.approveAll)
  const skipAll = useFixStore((s) => s.skipAll)
  const { exportFixed, exportAudioFixes, canExport, hasAudioFixes, isExporting, exportError } = useExport()
  const [result, setResult] = useState<MutationResult | null>(null)
  const [audioResult, setAudioResult] = useState<{ ok: number; failed: number } | null>(null)

  const approvedCount = fixes.filter((f) => f.status === 'approved').length
  const total = fixes.length
  const fileFormat = source === 'rekordbox' ? 'XML' : 'NML'

  const handleExport = async () => {
    const res = await exportFixed()
    if (res) setResult(res)
  }

  const handleAudioExport = async () => {
    const res = await exportAudioFixes()
    setAudioResult(res)
  }

  if (result) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="size-10 text-primary" />
          <h3 className="text-lg font-semibold">Export erfolgreich</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{result.appliedCount} Fixes angewendet</span>
            {result.removedTrackIds.length > 0 && (
              <span>{result.removedTrackIds.length} Duplikate entfernt</span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-4" />
          Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="secondary">
            {approvedCount} / {total} genehmigt
          </Badge>
          <span className="text-muted-foreground">
            Format: {fileFormat}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={approveAll}>
            Alle genehmigen ({total})
          </Button>
          <Button variant="ghost" size="sm" onClick={skipAll}>
            Alle überspringen
          </Button>
          <div className="flex-1" />
          <Button
            disabled={approvedCount === 0 || !canExport || isExporting}
            onClick={handleExport}
          >
            {isExporting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            {isExporting ? 'Exportiere...' : `Fixed ${fileFormat} exportieren`}
          </Button>
        </div>

        {hasAudioFixes && (
          <div className="border-t border-border/50 pt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Audio-Fixes (Clipping-Normalisierung) — werden direkt heruntergeladen.
            </p>
            <Button
              variant="outline"
              disabled={isExporting}
              onClick={handleAudioExport}
            >
              {isExporting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Volume2 className="mr-2 size-4" />
              )}
              Normalisierte Audio-Dateien exportieren
            </Button>
            {audioResult && (
              <p className="text-xs text-muted-foreground">
                {audioResult.ok} exportiert
                {audioResult.failed > 0 && `, ${audioResult.failed} fehlgeschlagen`}
              </p>
            )}
          </div>
        )}

        {exportError && (
          <p className="text-sm text-destructive">{exportError}</p>
        )}
      </CardContent>
    </Card>
  )
}
