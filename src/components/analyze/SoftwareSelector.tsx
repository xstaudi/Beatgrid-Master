'use client'

import Image from 'next/image'
import type { DjSoftware } from '@/types/track'
import { Card, CardContent } from '@/components/ui/card'
import { Folder } from 'lucide-react'

interface SoftwareSelectorProps {
  selected: DjSoftware | null
  onChange: (sw: DjSoftware) => void
}

const options: { id: DjSoftware; label: string; description: string }[] = [
  {
    id: 'rekordbox-usb',
    label: 'Rekordbox USB',
    description: 'USB Stick (Performance Export)',
  },
  {
    id: 'audio-folder',
    label: 'Audio-Ordner',
    description: 'MP3, WAV, FLAC, AIFF\u2026',
  },
]

export function SoftwareSelector({ selected, onChange }: SoftwareSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
      {options.map((opt) => {
        const isSelected = selected === opt.id
        return (
          <Card
            key={opt.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(opt.id)
              }
            }}
            className={`cursor-pointer transition-colors ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
          >
            <CardContent className="flex flex-col items-center gap-4 py-10">
              {opt.id === 'rekordbox-usb' ? (
                <Image
                  src="/rekordbox-logo.png"
                  alt="Rekordbox"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-lg"
                />
              ) : (
                <Folder className={`h-14 w-14 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <div className="text-center">
                <p className="text-lg font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
