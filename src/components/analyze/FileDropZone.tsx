'use client'

import { useCallback, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Upload } from 'lucide-react'

interface FileDropZoneProps {
  onFile: (content: string, fileName: string) => void
  isLoading: boolean
}

export function FileDropZone({ onFile, isLoading }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      const text = await file.text()
      onFile(text, file.name)
    },
    [onFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload library file. Drag and drop or click to browse."
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-12 transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          }`}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1 text-center">
            <p className="text-lg font-medium">
              {isLoading ? 'Parsing...' : 'Drop your library file here'}
            </p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.nml"
            onChange={handleFileInput}
            className="hidden"
            aria-label="Upload library file"
          />
        </div>
      </CardContent>
    </Card>
  )
}
