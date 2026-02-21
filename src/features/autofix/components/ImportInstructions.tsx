'use client'

import { AlertTriangle, FileDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTrackStore } from '@/stores/track-store'

function RekordboxInstructions() {
  return (
    <div className="space-y-3 text-sm">
      <h4 className="font-medium">Rekordbox XML importieren</h4>
      <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
        <li>Öffne Rekordbox</li>
        <li>
          Gehe zu <span className="font-mono text-foreground">File → Import Collection</span>
        </li>
        <li>Wähle die exportierte XML-Datei</li>
        <li>Bestätige den Import</li>
      </ol>
      <div className="flex items-start gap-2 border border-muted bg-muted/50 p-3 text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Wichtig</p>
          <ul className="list-disc space-y-0.5 pl-4 text-xs">
            <li>Der Import überschreibt bestehende Werte (BPM, Key, Beatgrid)</li>
            <li>Ratings können nicht via XML importiert werden</li>
            <li>Erstelle vorher ein Backup deiner Collection</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function TraktorInstructions() {
  return (
    <div className="space-y-3 text-sm">
      <h4 className="font-medium">Traktor NML importieren</h4>
      <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
        <li>Schließe Traktor vollständig</li>
        <li>
          Navigiere zu{' '}
          <span className="font-mono text-foreground">
            Documents/Native Instruments/Traktor [Version]/
          </span>
        </li>
        <li>
          Erstelle ein Backup von <span className="font-mono text-foreground">collection.nml</span>
        </li>
        <li>Ersetze die Datei mit der exportierten NML</li>
        <li>Starte Traktor</li>
      </ol>
      <div className="flex items-start gap-2 border border-destructive/30 bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Backup erstellen!</p>
          <p className="text-xs">
            Erstelle unbedingt ein Backup der originalen collection.nml bevor du sie ersetzt.
            Traktor hat keinen Undo für Collection-Änderungen.
          </p>
        </div>
      </div>
    </div>
  )
}

export function ImportInstructions() {
  const source = useTrackStore((s) => s.source)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="size-4" />
          Import-Anleitung
        </CardTitle>
      </CardHeader>
      <CardContent>
        {source === 'rekordbox' ? <RekordboxInstructions /> : <TraktorInstructions />}
      </CardContent>
    </Card>
  )
}
