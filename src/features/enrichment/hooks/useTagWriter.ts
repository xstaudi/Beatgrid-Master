'use client'

import { useState, useCallback } from 'react'
import { writeTagsToFile, hasFileSystemAccess } from '../services/tag-writer'
import { useEnrichmentStore } from '@/stores/enrichment-store'
import type { WriteBackResult, FieldSuggestion } from '@/types/enrichment'

interface UseTagWriterReturn {
  isWriting: boolean
  lastResult: WriteBackResult | null
  supportsDirectWrite: boolean
  writeAcceptedTags: (
    fileHandle: FileSystemFileHandle | File,
    trackId: string,
  ) => Promise<WriteBackResult>
}

/**
 * Hook fuer File Write-Back.
 * Schreibt akzeptierte Enrichment-Suggestions in Audio-Dateien.
 */
export function useTagWriter(): UseTagWriterReturn {
  const [isWriting, setIsWriting] = useState(false)
  const [lastResult, setLastResult] = useState<WriteBackResult | null>(null)
  const getResult = useEnrichmentStore((s) => s.getResult)

  const supportsDirectWrite = hasFileSystemAccess()

  const writeAcceptedTags = useCallback(
    async (fileHandle: FileSystemFileHandle | File, trackId: string): Promise<WriteBackResult> => {
      setIsWriting(true)

      try {
        const enrichmentResult = getResult(trackId)
        if (!enrichmentResult) {
          const result: WriteBackResult = {
            success: false,
            method: 'failed',
            error: 'Keine Enrichment-Ergebnisse fuer diesen Track',
          }
          setLastResult(result)
          return result
        }

        const acceptedSuggestions = enrichmentResult.suggestions.filter(
          (s) => s.status === 'accepted',
        )

        if (acceptedSuggestions.length === 0) {
          const result: WriteBackResult = {
            success: false,
            method: 'failed',
            error: 'Keine akzeptierten Vorschlaege zum Schreiben',
          }
          setLastResult(result)
          return result
        }

        const tags = suggestionsToTags(acceptedSuggestions)
        const result = await writeTagsToFile(fileHandle, tags)
        setLastResult(result)
        return result
      } catch (error) {
        const result: WriteBackResult = {
          success: false,
          method: 'failed',
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        }
        setLastResult(result)
        return result
      } finally {
        setIsWriting(false)
      }
    },
    [getResult],
  )

  return {
    isWriting,
    lastResult,
    supportsDirectWrite,
    writeAcceptedTags,
  }
}

/**
 * Konvertiere FieldSuggestions in das Tag-Format fuer taglib-wasm.
 */
function suggestionsToTags(
  suggestions: FieldSuggestion[],
): Record<string, string | number> {
  const tags: Record<string, string | number> = {}

  for (const s of suggestions) {
    switch (s.field) {
      case 'title':
        tags.title = s.value
        break
      case 'artist':
        tags.artist = s.value
        break
      case 'album':
        tags.album = s.value
        break
      case 'genre':
        tags.genre = s.value
        break
      case 'year':
        tags.year = parseInt(s.value, 10) || 0
        break
      case 'label':
        tags.label = s.value
        break
      case 'composer':
        tags.composer = s.value
        break
      case 'isrc':
        tags.isrc = s.value
        break
    }
  }

  return tags
}
