'use client'

import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFixStore } from '@/stores/fix-store'
import { useExport } from '../hooks/useExport'

export function FixToolbar() {
  const fixes = useFixStore((s) => s.fixes)
  const approveAll = useFixStore((s) => s.approveAll)
  const skipAll = useFixStore((s) => s.skipAll)
  const { exportFixed, canExport, isExporting, exportError } = useExport()

  const approvedCount = fixes.filter((f) => f.status === 'approved').length
  const total = fixes.length

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={approveAll}>
          Alle genehmigen ({total})
        </Button>
        <Button variant="ghost" size="sm" onClick={skipAll}>
          Alle überspringen
        </Button>
        <Badge variant="secondary">
          {approvedCount} / {total} genehmigt
        </Badge>
        <div className="flex-1" />
        <Button
          size="sm"
          disabled={approvedCount === 0 || !canExport || isExporting}
          onClick={exportFixed}
        >
          {isExporting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          {isExporting ? 'Exportiere...' : 'Export Fixed XML'}
        </Button>
      </div>
      {exportError && (
        <p className="text-sm text-destructive">{exportError}</p>
      )}
    </div>
  )
}
