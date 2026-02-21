'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FolderSearch, RefreshCw } from 'lucide-react'
import { useDuplicateScanner } from '@/features/duplicates/hooks/useDuplicateScanner'
import { DuplicateGroupList } from '@/features/duplicates/components/DuplicateGroupList'
import { BulkActionBar } from '@/features/duplicates/components/BulkActionBar'

export default function DuplicatesPage() {
  const {
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
  } = useDuplicateScanner()

  return (
    <main className="min-h-[calc(100vh-3.5rem)] p-6 md:p-10 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Duplicate Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scannt einen Ordner nach Duplikaten – ohne Audio-Analyse, rein auf Basis von Dateinamen.
          </p>
        </div>

        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 rounded-lg border border-dashed border-border py-16 text-center">
            <FolderSearch className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">Ordner wählen</p>
              <p className="text-sm text-muted-foreground">
                MP3, WAV, FLAC, AIFF – alle Unterordner werden rekursiv gescannt
              </p>
            </div>
            <Button size="lg" onClick={startScan}>
              <FolderSearch className="mr-2 h-4 w-4" />
              Ordner wählen...
            </Button>
          </div>
        )}

        {(phase === 'scanning' || phase === 'detecting') && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-16 text-center">
            <FolderSearch className="h-10 w-10 text-primary animate-pulse" />
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-medium">
                {phase === 'scanning' ? 'Scanne Dateien...' : 'Analysiere Duplikate...'}
              </p>
              <Progress value={undefined} className="h-2" />
              {phase === 'scanning' && scannedCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {scannedCount.toLocaleString()} Dateien gefunden
                </p>
              )}
            </div>
          </div>
        )}

        {phase === 'done' && result && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {result.libraryStats.totalTracks.toLocaleString()} Dateien gescannt
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.libraryStats.duplicateGroups > 0
                    ? `${result.libraryStats.duplicateGroups} Duplikat-Gruppen · ${result.libraryStats.tracksInGroups} betroffene Dateien`
                    : 'Keine Duplikate gefunden'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Neuer Scan
              </Button>
            </div>

            <DuplicateGroupList
              result={result}
              fileMap={fileMap}
              selectedIds={selectedIds}
              onToggle={toggleSelection}
              onSelectAllInGroup={selectAllInGroup}
            />
          </>
        )}
      </div>

      {phase === 'done' && (
        <BulkActionBar selectedCount={selectedIds.size} onDelete={deleteSelected} />
      )}
    </main>
  )
}
