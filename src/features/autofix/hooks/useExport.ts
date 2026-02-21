'use client'

import { useCallback, useState } from 'react'
import { fileSave } from 'browser-fs-access'
import { useTrackStore } from '@/stores/track-store'
import { useFixStore } from '@/stores/fix-store'
import { useProcessingStore } from '@/stores/processing-store'
import { applyFixes } from '@/lib/xml'
import { normalizeClipping } from '@/features/clipping/services/clip-normalizer'
import { writeAudioBuffer } from '@/lib/audio/buffer-writer'
import type { MutationResult } from '@/types/fix'

export function useExport() {
  const rawXml = useTrackStore((s) => s.rawXml)
  const source = useTrackStore((s) => s.source)
  const getApprovedOperations = useFixStore((s) => s.getApprovedOperations)
  const audioFileHandles = useProcessingStore((s) => s.audioFileHandles)
  const hasAudioFixes = useFixStore((s) =>
    s.fixes.some((f) => f.status === 'approved' && f.operation.kind === 'clipping-normalize'),
  )

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

  /** Normalisiert alle approbierten clipping-normalize Tracks und speichert sie. */
  const exportAudioFixes = useCallback(async (): Promise<{ ok: number; failed: number }> => {
    setIsExporting(true)
    setExportError(null)
    let ok = 0
    let failed = 0

    try {
      const ops = getApprovedOperations().filter((op) => op.kind === 'clipping-normalize')

      for (const op of ops) {
        const handle = audioFileHandles.get(op.trackId)
        if (!handle || op.peakLevelLinear == null) {
          failed++
          continue
        }
        try {
          const result = await normalizeClipping(handle.file, op.peakLevelLinear, op.targetPeakDb)
          await writeAudioBuffer(handle.file, result.buffer, result.fileName)
          ok++
        } catch {
          failed++
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Audio-Export fehlgeschlagen'
      setExportError(msg)
    } finally {
      setIsExporting(false)
    }

    return { ok, failed }
  }, [getApprovedOperations, audioFileHandles])

  return {
    exportFixed,
    exportAudioFixes,
    canExport: !!rawXml && !!source,
    hasAudioFixes,
    isExporting,
    exportError,
  }
}
