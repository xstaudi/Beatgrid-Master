'use client'

import { useFixStore } from '@/stores/fix-store'
import { useAnalysisStore } from '@/stores/analysis-store'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import type { BeatgridCheckResult, BpmCheckResult, KeyCheckResult } from '@/types/analysis'
import type { FixKind } from '@/types/fix'

type AudioCheckKind = Exclude<FixKind, 'duplicate-remove'>

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value == null) return null
  const color =
    value >= 80
      ? 'text-green-600 dark:text-green-400'
      : value >= 60
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'
  return <span className={`text-xs font-medium ${color}`}>{value}%</span>
}

export function SaveSelectionTable() {
  const fixes = useFixStore((s) => s.fixes)
  const setFixStatus = useFixStore((s) => s.setFixStatus)
  const results = useAnalysisStore((s) => s.results)
  const generatedBeatgrids = useAnalysisStore((s) => s.generatedBeatgrids)

  const relevantFixes = fixes.filter(
    (f): f is typeof f & { operation: { kind: AudioCheckKind } } =>
      f.operation.kind === 'bpm' ||
      f.operation.kind === 'key' ||
      f.operation.kind === 'beatgrid',
  )

  if (relevantFixes.length === 0) return null

  const trackIds = [...new Set(relevantFixes.map((f) => f.operation.trackId))]

  const beatgridResult = results?.results.find(
    (r): r is BeatgridCheckResult => r.type === 'beatgrid',
  )
  const bpmResult = results?.results.find((r): r is BpmCheckResult => r.type === 'bpm')
  const keyResult = results?.results.find((r): r is KeyCheckResult => r.type === 'key')

  function getBeatgridConfidence(trackId: string): number | null {
    const verifyTrack = beatgridResult?.tracks.find((t) => t.trackId === trackId)
    if (verifyTrack) return verifyTrack.confidence
    return generatedBeatgrids.get(trackId)?.confidence ?? null
  }

  function getKeyConfidence(trackId: string): number | null {
    return keyResult?.tracks.find((t) => t.trackId === trackId)?.confidence ?? null
  }

  function isVariableBpm(trackId: string): boolean {
    if (bpmResult?.tracks.find((t) => t.trackId === trackId)?.isVariableBpm) return true
    if (beatgridResult?.tracks.find((t) => t.trackId === trackId)?.isVariableBpm) return true
    return false
  }

  function getFixForTrack(trackId: string, kind: AudioCheckKind) {
    return relevantFixes.find((f) => f.operation.trackId === trackId && f.operation.kind === kind)
  }

  function handleApproveAll() {
    for (const fix of relevantFixes) {
      const { kind, trackId } = fix.operation
      if ((kind === 'bpm' || kind === 'beatgrid') && isVariableBpm(trackId)) continue
      setFixStatus(trackId, kind as FixKind, 'approved')
    }
  }

  function handleAcceptHighConfidence() {
    for (const fix of relevantFixes) {
      const { kind, trackId } = fix.operation
      if (kind === 'beatgrid') {
        const conf = getBeatgridConfidence(trackId)
        if (conf != null && conf >= 90) setFixStatus(trackId, kind as FixKind, 'approved')
      } else if (kind === 'key') {
        const conf = getKeyConfidence(trackId)
        if (conf != null && conf >= 90) setFixStatus(trackId, kind as FixKind, 'approved')
      } else if (kind === 'bpm' && !isVariableBpm(trackId)) {
        setFixStatus(trackId, kind as FixKind, 'approved')
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Fix-Auswahl</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAcceptHighConfidence}>
            Alle ≥90% akzeptieren
          </Button>
          <Button variant="outline" size="sm" onClick={handleApproveAll}>
            Alle akzeptieren
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Track</th>
              <th className="px-4 py-2 text-center font-medium">BPM Fix</th>
              <th className="px-4 py-2 text-center font-medium">Key Fix</th>
              <th className="px-4 py-2 text-center font-medium">Beatgrid Fix</th>
            </tr>
          </thead>
          <tbody>
            {trackIds.map((trackId) => {
              const bpmFix = getFixForTrack(trackId, 'bpm')
              const keyFix = getFixForTrack(trackId, 'key')
              const beatgridFix = getFixForTrack(trackId, 'beatgrid')
              const varBpm = isVariableBpm(trackId)
              const label =
                bpmFix?.preview.label ??
                keyFix?.preview.label ??
                beatgridFix?.preview.label ??
                trackId
              const bgConfidence = getBeatgridConfidence(trackId)
              const keyConfidence = getKeyConfidence(trackId)

              return (
                <tr key={trackId} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="max-w-[240px] truncate px-4 py-2 font-medium" title={label}>
                    {varBpm && (
                      <AlertTriangle
                        className="mr-1 inline size-3.5 text-yellow-500"
                        aria-label="Variable BPM"
                      />
                    )}
                    {label}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {bpmFix && (
                      <Checkbox
                        aria-label={`BPM Fix: ${label}${varBpm ? ' (Variable BPM)' : ''}`}
                        checked={bpmFix.status === 'approved'}
                        disabled={varBpm}
                        onCheckedChange={(checked) =>
                          setFixStatus(trackId, 'bpm', checked ? 'approved' : 'skipped')
                        }
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {keyFix && (
                      <div className="flex flex-col items-center gap-0.5">
                        <Checkbox
                          aria-label={`Key Fix: ${label}`}
                          checked={keyFix.status === 'approved'}
                          onCheckedChange={(checked) =>
                            setFixStatus(trackId, 'key', checked ? 'approved' : 'skipped')
                          }
                        />
                        <ConfidenceBadge value={keyConfidence} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {beatgridFix && (
                      <div className="flex flex-col items-center gap-0.5">
                        <Checkbox
                          aria-label={`Beatgrid Fix: ${label}${varBpm ? ' (Variable BPM)' : ''}`}
                          checked={beatgridFix.status === 'approved'}
                          disabled={varBpm}
                          onCheckedChange={(checked) =>
                            setFixStatus(trackId, 'beatgrid', checked ? 'approved' : 'skipped')
                          }
                        />
                        <ConfidenceBadge value={bgConfidence} />
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
