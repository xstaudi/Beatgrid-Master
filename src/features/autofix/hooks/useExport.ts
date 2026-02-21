'use client'

import { useCallback, useState } from 'react'
import { fileSave } from 'browser-fs-access'
import { useTrackStore } from '@/stores/track-store'
import { useFixStore } from '@/stores/fix-store'
import { applyFixes } from '@/lib/xml'
import type { MutationResult } from '@/types/fix'

export function useExport() {
  const rawXml = useTrackStore((s) => s.rawXml)
  const source = useTrackStore((s) => s.source)
  const getApprovedOperations = useFixStore((s) => s.getApprovedOperations)

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportFixed = useCallback(async (): Promise<MutationResult | null> => {
    if (!rawXml || !source) return null
    setIsExporting(true)
    setExportError(null)
    try {
      const ops = getApprovedOperations()
      const result = applyFixes(rawXml, ops, source)
      const blob = new Blob([result.xmlContent], { type: 'text/xml' })
      await fileSave(blob, {
        fileName:
          source === 'rekordbox'
            ? 'beatgrid-master-fixed.xml'
            : 'beatgrid-master-fixed.nml',
      })
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export fehlgeschlagen'
      setExportError(msg)
      return null
    } finally {
      setIsExporting(false)
    }
  }, [rawXml, source, getApprovedOperations])

  return {
    exportFixed,
    canExport: !!rawXml && !!source,
    isExporting,
    exportError,
  }
}
