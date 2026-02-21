'use client'

import type { DjSoftware } from '@/types/track'
import { Card, CardContent } from '@/components/ui/card'
import { Music2, Headphones, Usb } from 'lucide-react'

interface SoftwareSelectorProps {
  selected: DjSoftware | null
  onChange: (sw: DjSoftware) => void
}

const options: { id: DjSoftware; label: string; description: string; icon: typeof Music2 }[] = [
  {
    id: 'rekordbox',
    label: 'Rekordbox',
    description: 'XML Library Export',
    icon: Music2,
  },
  {
    id: 'rekordbox-usb',
    label: 'Rekordbox USB',
    description: 'USB Stick (Performance Export)',
    icon: Usb,
  },
  {
    id: 'traktor',
    label: 'Traktor',
    description: 'NML Collection File',
    icon: Headphones,
  },
]

export function SoftwareSelector({ selected, onChange }: SoftwareSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {options.map((opt) => {
        const Icon = opt.icon
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
            <CardContent className="flex flex-col items-center gap-3 pt-6 pb-6">
              <Icon className={`h-10 w-10 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
