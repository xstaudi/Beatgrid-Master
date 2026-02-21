'use client'

import { useState, useCallback } from 'react'
import type { Track } from '@/types/track'
import type { DuplicateCheckResult } from '@/types/analysis'
import { checkDuplicatesMetadataOnly } from '../services/duplicate-check'

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.ogg', '.aac', '.m4a', '.wav', '.aiff', '.aif']

function isAuxiliaryFile(name: string): boolean {
  return name.startsWith('_') || name.startsWith('.')
}

export interface ScannedFile {
  file: File
  name: string
  size: number
  parentHandle: FileSystemDirectoryHandle
}

/** Parse "Artist - Title.ext" or "Title.ext" from filename */
function parseFilename(name: string): { title: string; artist: string; fileType: string } {
  const lastDot = name.lastIndexOf('.')
  const fileType = lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : ''
  const baseName = lastDot >= 0 ? name.slice(0, lastDot) : name
  const dashIdx = baseName.indexOf(' - ')
  if (dashIdx >= 0) {
    return {
      artist: baseName.slice(0, dashIdx).trim(),
      title: baseName.slice(dashIdx + 3).trim(),
      fileType,
    }
  }
  return { artist: '', title: baseName.trim(), fileType }
}

function buildTrack(scanned: ScannedFile, index: number): Track {
  const { title, artist, fileType } = parseFilename(scanned.name)
  return {
    id: `dup-${index}`,
    source: 'audio-folder',
    sourceId: scanned.name,
    title,
    artist,
    album: '',
    genre: '',
    composer: '',
    label: '',
    comment: '',
    year: null,
    rating: 0,
    duration: 0,
    bpm: null,
    key: null,
    bitrate: null,
    sampleRate: null,
    fileSize: scanned.size,
    fileType,
    filePath: scanned.name,
    fileName: scanned.name,
    tempoMarkers: [],
    cuePoints: [],
    dateAdded: null,
  }
}

export type ScanPhase = 'idle' | 'scanning' | 'detecting' | 'done'

export interface UseDuplicateScannerReturn {
  phase: ScanPhase
  scannedCount: number
  result: DuplicateCheckResult | null
  fileMap: Map<string, ScannedFile>
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  selectAllInGroup: (groupId: string, keepId: string) => void
  deleteSelected: () => Promise<{ deleted: number; errors: string[] }>
  startScan: () => Promise<void>
  reset: () => void
}

export function useDuplicateScanner(): UseDuplicateScannerReturn {
  const [phase, setPhase] = useState<ScanPhase>('idle')
  const [scannedCount, setScannedCount] = useState(0)
  const [result, setResult] = useState<DuplicateCheckResult | null>(null)
  const [fileMap, setFileMap] = useState<Map<string, ScannedFile>>(new Map())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const startScan = useCallback(async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setPhase('scanning')
      setScannedCount(0)

      const scanned: ScannedFile[] = []

      async function walk(handle: FileSystemDirectoryHandle) {
        for await (const [name, entry] of handle.entries()) {
          try {
            if (entry.kind === 'file') {
              if (isAuxiliaryFile(name)) continue
              const ext = '.' + name.split('.').pop()?.toLowerCase()
              if (AUDIO_EXTENSIONS.includes(ext)) {
                const file = await (entry as FileSystemFileHandle).getFile()
                scanned.push({ file, name: file.name, size: file.size, parentHandle: handle })
                setScannedCount(scanned.length)
              }
            } else if (entry.kind === 'directory') {
              await walk(entry as FileSystemDirectoryHandle)
            }
          } catch {
            // Skip inaccessible entries
          }
        }
      }

      await walk(dirHandle)
      setPhase('detecting')

      const tracks = scanned.map((s, i) => buildTrack(s, i))
      const newFileMap = new Map<string, ScannedFile>()
      tracks.forEach((t, i) => newFileMap.set(t.id, scanned[i]))

      const checkResult = checkDuplicatesMetadataOnly(tracks)
      setFileMap(newFileMap)
      setResult(checkResult)
      setSelectedIds(new Set())
      setPhase('done')
    } catch {
      // User cancelled or permission denied
      setPhase('idle')
    }
  }, [])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAllInGroup = useCallback(
    (groupId: string, keepId: string) => {
      if (!result) return
      const group = result.groups.find((g) => g.groupId === groupId)
      if (!group) return
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const member of group.tracks) {
          if (member.trackId !== keepId) {
            next.add(member.trackId)
          } else {
            next.delete(member.trackId)
          }
        }
        return next
      })
    },
    [result],
  )

  const deleteSelected = useCallback(async (): Promise<{ deleted: number; errors: string[] }> => {
    const deleted: string[] = []
    const errors: string[] = []

    for (const trackId of selectedIds) {
      const scanned = fileMap.get(trackId)
      if (!scanned) continue
      try {
        await scanned.parentHandle.removeEntry(scanned.file.name)
        deleted.push(trackId)
      } catch (err) {
        errors.push(
          scanned.file.name + ': ' + (err instanceof Error ? err.message : 'Fehler'),
        )
      }
    }

    const deletedSet = new Set(deleted)
    setResult((prev) => {
      if (!prev) return prev
      const newGroups = prev.groups
        .map((g) => ({
          ...g,
          tracks: g.tracks.filter((m) => !deletedSet.has(m.trackId)),
        }))
        .filter((g) => g.tracks.length >= 2)

      const trackGroupMap = new Map<string, string>()
      for (const g of newGroups) {
        for (const m of g.tracks) trackGroupMap.set(m.trackId, g.groupId)
      }

      return {
        ...prev,
        groups: newGroups,
        tracks: prev.tracks.filter((t) => !deletedSet.has(t.trackId)),
        libraryStats: {
          ...prev.libraryStats,
          totalTracks: prev.libraryStats.totalTracks - deleted.length,
          duplicateGroups: newGroups.length,
          tracksInGroups: trackGroupMap.size,
          metadataOnlyGroups: newGroups.filter((g) => g.matchLevel === 'metadata').length,
          fingerprintConfirmedGroups: newGroups.filter((g) => g.matchLevel === 'fingerprint').length,
        },
      }
    })
    setSelectedIds(new Set())
    return { deleted: deleted.length, errors }
  }, [selectedIds, fileMap])

  const reset = useCallback(() => {
    setPhase('idle')
    setScannedCount(0)
    setResult(null)
    setFileMap(new Map())
    setSelectedIds(new Set())
  }, [])

  return {
    phase,
    scannedCount,
    result,
    fileMap,
    selectedIds,
    toggleSelection,
    selectAllInGroup,
    deleteSelected,
    startScan,
    reset,
  }
}
