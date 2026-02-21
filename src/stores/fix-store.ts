import { create } from 'zustand'
import type { Track } from '@/types/track'
import type { AnalysisResults, DuplicateCheckResult } from '@/types/analysis'
import type { FixEntry, FixKind, FixOperation, FixStatus } from '@/types/fix'
import type { GeneratedBeatgrid } from '@/features/beatgrid'
import { computeFixes } from '@/features/autofix/services/compute-fixes'

interface FixStore {
  fixes: FixEntry[]
  keptDuplicates: Map<string, string> // groupId → trackId to keep

  computeAndSetFixes: (tracks: Track[], results: AnalysisResults, generatedBeatgrids?: Map<string, GeneratedBeatgrid>) => void
  setFixStatus: (trackId: string, kind: FixKind, status: FixStatus) => void
  approveAll: () => void
  skipAll: () => void
  setKeptDuplicate: (groupId: string, trackId: string) => void
  getApprovedOperations: () => FixOperation[]
  reset: () => void
}

export const useFixStore = create<FixStore>((set, get) => ({
  fixes: [],
  keptDuplicates: new Map(),

  computeAndSetFixes: (tracks, results, generatedBeatgrids) => {
    const fixes = computeFixes(tracks, results, generatedBeatgrids)

    // Set default kept duplicates from analysis recommendations
    const dupResult = results.results.find(
      (r): r is DuplicateCheckResult => r.type === 'duplicates',
    )
    const keptDuplicates = new Map<string, string>()
    if (dupResult) {
      for (const group of dupResult.groups) {
        keptDuplicates.set(group.groupId, group.recommendedKeepId)
      }
    }

    set({ fixes, keptDuplicates })
  },

  setFixStatus: (trackId, kind, status) => {
    set((state) => ({
      fixes: state.fixes.map((f) =>
        f.operation.trackId === trackId && f.operation.kind === kind
          ? { ...f, status }
          : f,
      ),
    }))
  },

  approveAll: () => {
    set((state) => ({
      fixes: state.fixes.map((f) => ({ ...f, status: 'approved' as const })),
    }))
  },

  skipAll: () => {
    set((state) => ({
      fixes: state.fixes.map((f) => ({ ...f, status: 'skipped' as const })),
      keptDuplicates: new Map(),
    }))
  },

  setKeptDuplicate: (groupId, trackId) => {
    set((state) => {
      const newMap = new Map(state.keptDuplicates)
      newMap.set(groupId, trackId)
      return { keptDuplicates: newMap }
    })
  },

  getApprovedOperations: () => {
    const { fixes, keptDuplicates } = get()

    const ops: FixOperation[] = fixes
      .filter((f) => f.status === 'approved')
      .map((f) => f.operation)

    // Build duplicate-remove ops from keptDuplicates
    // We need access to the duplicate groups from analysis results
    // which we don't store here — but keptDuplicates keys are groupIds
    // and values are the trackId to keep. Group members are encoded in groupId.
    for (const [groupId, keepId] of keptDuplicates) {
      const memberIds = groupId.split('::')
      for (const memberId of memberIds) {
        if (memberId !== keepId) {
          ops.push({
            kind: 'duplicate-remove',
            trackId: memberId,
            sourceId: memberId,
            groupId,
          })
        }
      }
    }

    return ops
  },

  reset: () => {
    set({ fixes: [], keptDuplicates: new Map() })
  },
}))
