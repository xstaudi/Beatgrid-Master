'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onDelete: () => Promise<{ deleted: number; errors: string[] }>
}

export function BulkActionBar({ selectedCount, onDelete }: BulkActionBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  if (selectedCount === 0 && !notification) return null

  async function handleConfirmDelete() {
    setIsDeleting(true)
    const { deleted, errors } = await onDelete()
    setIsDeleting(false)
    setConfirmOpen(false)
    if (errors.length > 0) {
      setNotification(`${deleted} Dateien gelöscht. ${errors.length} Fehler.`)
    } else {
      setNotification(`${deleted} Dateien gelöscht.`)
    }
    setTimeout(() => setNotification(null), 4000)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur shadow-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 gap-4">
          {notification ? (
            <p className="text-sm text-muted-foreground">{notification}</p>
          ) : (
            <p className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? 'Datei' : 'Dateien'} ausgewählt
            </p>
          )}
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dateien löschen?</DialogTitle>
            <DialogDescription>
              {selectedCount} {selectedCount === 1 ? 'Datei wird' : 'Dateien werden'} permanent
              vom Dateisystem gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Wird gelöscht...' : `${selectedCount} Dateien löschen`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
