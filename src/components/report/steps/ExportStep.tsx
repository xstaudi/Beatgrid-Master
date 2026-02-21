'use client'

import { ExportPanel } from '@/features/autofix'
import { ImportInstructions } from '@/features/autofix/components/ImportInstructions'
import { useFixStore } from '@/stores/fix-store'
import { Badge } from '@/components/ui/badge'

export function ExportStep() {
  const fixes = useFixStore((s) => s.fixes)
  const approvedCount = fixes.filter((f) => f.status === 'approved').length

  return (
    <div className="space-y-6">
      <h2 className="art-deco-heading text-lg">
        <span className="art-deco-divider">Export</span>
      </h2>

      {fixes.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="secondary">
            {approvedCount} / {fixes.length} genehmigt
          </Badge>
        </div>
      )}

      <ExportPanel />
      <ImportInstructions />
    </div>
  )
}
