'use client'

import { useEffect } from 'react'
import type { CheckId } from '@/types/analysis'
import { checkRequiresAudio } from '@/types/analysis'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CheckOption {
  id: CheckId
  label: string
  description: string
  available: boolean
}

const CHECK_OPTIONS: CheckOption[] = [
  { id: 'metadata', label: 'Metadata Audit', description: 'Check for missing tags, incomplete metadata', available: true },
  { id: 'beatgrid', label: 'Beatgrid Check', description: 'Verify beatgrid alignment and accuracy', available: true },
  { id: 'bpm', label: 'BPM Verification', description: 'Validate BPM values against audio analysis', available: true },
  { id: 'key', label: 'Key Detection', description: 'Verify musical key accuracy', available: true },
  { id: 'clipping', label: 'Clipping Detection', description: 'Find tracks with audio clipping', available: true },
]

interface CheckSelectorProps {
  selected: CheckId[]
  onChange: (checks: CheckId[]) => void
  onNeedsAudioChange?: (needsAudio: boolean) => void
}

export function CheckSelector({ selected, onChange, onNeedsAudioChange }: CheckSelectorProps) {
  useEffect(() => {
    onNeedsAudioChange?.(selected.some((c) => checkRequiresAudio(c)))
  }, [selected, onNeedsAudioChange])
  const handleToggle = (id: CheckId, checked: boolean) => {
    if (checked) {
      onChange([...selected, id])
    } else {
      onChange(selected.filter((c) => c !== id))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Analysis Checks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {CHECK_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-start gap-3 ${!opt.available ? 'opacity-50' : 'cursor-pointer'}`}
          >
            <Checkbox
              checked={opt.available && selected.includes(opt.id)}
              onCheckedChange={(checked) => handleToggle(opt.id, checked === true)}
              disabled={!opt.available}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{opt.label}</span>
                {!opt.available && (
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                )}
                {opt.available && checkRequiresAudio(opt.id) && (
                  <Badge variant="outline" className="text-xs">Requires Audio</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  )
}
