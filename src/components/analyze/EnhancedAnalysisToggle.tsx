'use client'

import { useState, useMemo } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { detectDeviceMemory, DEMUCS_FEATURE_ENABLED } from '@/lib/audio/device-memory'

interface EnhancedAnalysisToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function EnhancedAnalysisToggle({ enabled, onToggle }: EnhancedAnalysisToggleProps) {
  const [showDialog, setShowDialog] = useState(false)
  const memoryInfo = useMemo(() => detectDeviceMemory(), [])

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      setShowDialog(true)
    } else {
      onToggle(false)
    }
  }

  const handleConfirm = () => {
    setShowDialog(false)
    onToggle(true)
  }

  const handleCancel = () => {
    setShowDialog(false)
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-3 py-3">
          <Switch
            checked={enabled}
            onCheckedChange={handleSwitchChange}
            disabled={!memoryInfo.canRunDemucs}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Erweiterte Beat-Analyse</span>
              <Badge variant="outline" className="text-xs">
                {DEMUCS_FEATURE_ENABLED ? 'Experimentell' : 'Bald verfuegbar'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {!DEMUCS_FEATURE_ENABLED
                ? 'Wird in einer zukuenftigen Version verfuegbar'
                : memoryInfo.canRunDemucs
                  ? 'KI-Stem-Separation fuer praezisere Ergebnisse'
                  : `Mindestens 4 GB RAM erforderlich (~${memoryInfo.estimatedRamGb} GB erkannt)`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erweiterte Beat-Analyse aktivieren</DialogTitle>
            <DialogDescription>
              Die KI-basierte Stem-Separation isoliert die Drum-Spur fuer
              praezisere Beat-Detection, benoetigt aber deutlich mehr Ressourcen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-amber-500">
              <span className="text-base">&#x26A0;</span>
              <span className="font-medium">Hoher Speicherbedarf</span>
            </div>

            <div className="space-y-1 text-muted-foreground">
              <p>Dein System: ~{memoryInfo.estimatedRamGb} GB RAM</p>
              <p>Modell-Download: ~170 MB (einmalig, wird gecached)</p>
              <p>Geschaetzte Dauer: ~2-5 Min pro Track</p>
            </div>

            <p className="text-muted-foreground">
              Empfehlung: Andere Tabs und Programme schliessen
              fuer beste Performance.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleCancel}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirm}>
              Aktivieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
