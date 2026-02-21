'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Monitor, FolderOpen } from 'lucide-react'

interface RekordboxPcPickerProps {
  isLoading: boolean
  trackCount: number | null
  error: string | null
  onSelect: (handle: FileSystemDirectoryHandle) => void
}

function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export function RekordboxPcPicker({ isLoading, trackCount, error, onSelect }: RekordboxPcPickerProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handlePick = useCallback(async () => {
    if (supportsDirectoryPicker()) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'read' })
        onSelect(handle)
      } catch {
        // User cancelled
      }
    }
  }, [onSelect])

  const useFallback = !supportsDirectoryPicker()

  return (
    <Card
      className={`transition-colors ${isDragOver ? 'border-primary bg-primary/5' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault()
        setIsDragOver(false)
        const items = e.dataTransfer.items
        if (!items || items.length === 0) return
        const item = items[0]
        if ('getAsFileSystemHandle' in item) {
          const handle = await (item as DataTransferItem).getAsFileSystemHandle()
          if (handle && handle.kind === 'directory') {
            onSelect(handle as FileSystemDirectoryHandle)
          }
        }
      }}
    >
      <CardContent className="flex flex-col items-center gap-4 py-8">
        {isLoading ? (
          <>
            <Monitor className="h-10 w-10 text-primary animate-pulse" />
            <div className="w-full max-w-xs space-y-2 text-center">
              <p className="text-sm font-medium">Lese rekordbox-Bibliothek...</p>
              <Progress value={undefined} className="h-2" />
              {trackCount != null && (
                <p className="text-xs text-muted-foreground">
                  {trackCount.toLocaleString()} Tracks gefunden
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <Monitor className="h-10 w-10 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium">Wähle deinen rekordbox-Bibliotheksordner</p>
              <p className="text-sm text-muted-foreground">
                Enthält normalerweise die Datei rekordbox.xml (z.B. Musik → rekordbox)
              </p>
            </div>
            {useFallback ? (
              <p className="text-sm text-destructive text-center">
                Dein Browser unterstützt keinen direkten Ordner-Zugriff.
                Bitte Chrome, Edge oder einen anderen Chromium-Browser verwenden.
              </p>
            ) : (
              <Button onClick={handlePick} size="lg">
                <FolderOpen className="mr-2 h-4 w-4" />
                Ordner wählen...
              </Button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive text-center">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
