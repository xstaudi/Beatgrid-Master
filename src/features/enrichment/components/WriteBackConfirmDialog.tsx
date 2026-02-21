'use client'

import { Save, X, Download, HardDrive, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTagWriter } from '../hooks/useTagWriter'
import { useEnrichmentStore } from '@/stores/enrichment-store'
import type { FieldSuggestion } from '@/types/enrichment'
import { ENRICHMENT_FIELD_LABELS } from '../constants'

interface WriteBackConfirmDialogProps {
  open: boolean
  onClose: () => void
  trackId: string
  trackTitle: string
  fileHandle: FileSystemFileHandle | File | null
}

export function WriteBackConfirmDialog({
  open,
  onClose,
  trackId,
  trackTitle,
  fileHandle,
}: WriteBackConfirmDialogProps) {
  const { isWriting, lastResult, supportsDirectWrite, writeAcceptedTags } = useTagWriter()
  const enrichmentResult = useEnrichmentStore((s) => s.results.get(trackId))

  if (!open) return null

  const acceptedSuggestions = enrichmentResult?.suggestions.filter(
    (s) => s.status === 'accepted',
  ) ?? []

  const handleWrite = async () => {
    if (!fileHandle) return
    await writeAcceptedTags(fileHandle, trackId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-card border border-primary/30 shadow-[0_0_30px_rgba(193,125,83,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Save className="size-4 text-primary" />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              In Datei speichern
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Warnung */}
          <div className="flex items-start gap-2 p-3 bg-chart-5/10 border border-chart-5/20">
            <AlertTriangle className="size-4 text-chart-5 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Audio-Datei wird veraendert</p>
              <p>Die folgenden Tags werden in die Datei geschrieben. Es wird empfohlen, vorher ein Backup zu erstellen.</p>
            </div>
          </div>

          {/* Track-Info */}
          <p className="text-sm font-mono truncate">{trackTitle}</p>

          {/* Zu schreibende Tags */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
              {acceptedSuggestions.length} Tags werden geschrieben:
            </p>
            <div className="divide-y divide-border/40">
              {acceptedSuggestions.map((s) => (
                <div key={s.field} className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">
                    {ENRICHMENT_FIELD_LABELS[s.field]}
                  </span>
                  <span className="text-xs font-mono text-chart-2">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Methode */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            {supportsDirectWrite && fileHandle && 'getFile' in fileHandle ? (
              <>
                <HardDrive className="size-3" />
                <span>Direkt in Datei schreiben (File System Access API)</span>
              </>
            ) : (
              <>
                <Download className="size-3" />
                <span>Modifizierte Datei wird heruntergeladen</span>
              </>
            )}
          </div>

          {/* Ergebnis */}
          {lastResult && (
            <div className={`text-xs ${lastResult.success ? 'text-chart-2' : 'text-destructive'}`}>
              {lastResult.success
                ? lastResult.method === 'filesystem-api'
                  ? 'Tags erfolgreich in Datei geschrieben.'
                  : 'Modifizierte Datei wurde heruntergeladen.'
                : `Fehler: ${lastResult.error}`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-3 border-t border-primary/10">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleWrite}
            disabled={isWriting || acceptedSuggestions.length === 0 || !fileHandle}
          >
            {isWriting ? (
              'Schreibe...'
            ) : (
              <>
                <Save className="size-3 mr-1.5" />
                Tags schreiben
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
