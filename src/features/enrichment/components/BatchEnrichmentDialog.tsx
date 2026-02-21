'use client'

import { useMemo } from 'react'
import { Sparkles, X, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEnrichmentBatch } from '../hooks/useEnrichmentBatch'
import { useTrackStore } from '@/stores/track-store'
import { getMissingFields } from '../services/suggestion-merger'

interface BatchEnrichmentDialogProps {
  open: boolean
  onClose: () => void
}

export function BatchEnrichmentDialog({ open, onClose }: BatchEnrichmentDialogProps) {
  const tracks = useTrackStore((s) => s.tracks)
  const { isRunning, progress, startBatch, abort } = useEnrichmentBatch()

  // Nur Tracks mit fehlenden Feldern enrichen
  const tracksToEnrich = useMemo(() => {
    return tracks.filter((t) => {
      const missing = getMissingFields(t)
      // isrc und coverUrl ignorieren - nur "echte" Metadaten-Felder zaehlen
      missing.delete('isrc')
      missing.delete('coverUrl')
      return missing.size > 0
    })
  }, [tracks])

  const handleStart = () => {
    startBatch(tracksToEnrich)
  }

  const handleClose = () => {
    if (isRunning) {
      abort()
    }
    onClose()
  }

  const progressPercent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-card border border-primary/30 shadow-[0_0_30px_rgba(193,125,83,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              Batch Enrichment
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {!isRunning && progress.completed === 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {tracksToEnrich.length} von {tracks.length} Tracks haben fehlende Metadaten.
                Enrichment durchsucht AcoustID, MusicBrainz und Discogs nach Vorschlaegen.
              </p>
              <div className="text-xs text-muted-foreground/60 space-y-1">
                <p>Geschaetzte Dauer: ~{Math.ceil(tracksToEnrich.length * 3 / 60)} Minuten</p>
                <p>Rate-Limits werden automatisch eingehalten.</p>
              </div>
            </>
          )}

          {(isRunning || progress.completed > 0) && (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.completed} / {progress.total} Tracks</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs">
                <span className="text-chart-2">{progress.completed - progress.errors} erfolgreich</span>
                {progress.errors > 0 && (
                  <span className="text-destructive">{progress.errors} Fehler</span>
                )}
              </div>

              {/* Completion */}
              {!isRunning && progress.completed > 0 && (
                <p className="text-sm text-chart-2">
                  Enrichment abgeschlossen. Vorschlaege koennen pro Track akzeptiert oder abgelehnt werden.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-3 border-t border-primary/10">
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:border-destructive"
              onClick={abort}
            >
              <StopCircle className="size-3 mr-1.5" />
              Abbrechen
            </Button>
          ) : progress.completed > 0 ? (
            <Button variant="outline" size="sm" onClick={handleClose}>
              Schliessen
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleStart}
                disabled={tracksToEnrich.length === 0}
              >
                <Sparkles className="size-3 mr-1.5" />
                {tracksToEnrich.length} Tracks enrichen
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
