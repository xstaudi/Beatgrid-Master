'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Usb, FolderOpen } from 'lucide-react'

interface UsbDirectoryPickerProps {
  isLoading: boolean
  trackCount: number | null
  loadingStatus: string | null
  error: string | null
  onSelect: (handle: FileSystemDirectoryHandle) => void
}

function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export function UsbDirectoryPicker({ isLoading, trackCount, loadingStatus, error, onSelect }: UsbDirectoryPickerProps) {
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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      // webkitdirectory gives us File objects, but we need a DirectoryHandle.
      // Unfortunately, webkitdirectory doesn't provide FileSystemDirectoryHandle.
      // This fallback path is limited - we show an error suggesting Chrome.
      // In practice, showDirectoryPicker is available in all Chromium browsers.
    },
    []
  )

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
            <Usb className="h-10 w-10 text-primary animate-pulse" />
            <div className="w-full max-w-xs space-y-2 text-center">
              <p className="text-sm font-medium">{loadingStatus || 'USB lesen...'}</p>
              <Progress value={undefined} className="h-2" />
            </div>
          </>
        ) : (
          <>
            <Usb className="h-10 w-10 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium">Select your USB drive</p>
              <p className="text-sm text-muted-foreground">
                Choose the root of your Rekordbox USB stick
              </p>
            </div>
            {useFallback ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-destructive">
                  Your browser doesn&apos;t support direct folder access.
                  Please use Chrome, Edge, or another Chromium-based browser.
                </p>
                <label>
                  <input
                    type="file"
                    // @ts-expect-error - webkitdirectory is non-standard
                    webkitdirectory=""
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Try folder select (limited)
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <Button onClick={handlePick} size="lg">
                <FolderOpen className="mr-2 h-4 w-4" />
                Browse...
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
