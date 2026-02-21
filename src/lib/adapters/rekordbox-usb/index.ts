import type { DirectoryAdapter, DirectoryImportResult, ParseWarning, ProgressCallback } from '../types'
import { parsePdbFile } from './pdb-parser'
import { parseAnlzFile, mergeAnlzData, type AnlzData } from './anlz-parser'
import { resolveAnlzFiles } from './anlz-resolver'
import { mapPdbTrackToTrack } from './track-mapper'

const MAX_CONCURRENT_ANLZ = 10

export class RekordboxUsbAdapter implements DirectoryAdapter {
  readonly softwareType = 'rekordbox-usb' as const
  readonly importMode = 'directory' as const

  async parseDirectory(handle: FileSystemDirectoryHandle, onProgress?: ProgressCallback): Promise<DirectoryImportResult> {
    const warnings: ParseWarning[] = []
    const report = onProgress ?? (() => {})

    // Find PIONEER directory
    report('USB-Laufwerk erkennen...')
    let pioneerDir: FileSystemDirectoryHandle
    try {
      pioneerDir = await handle.getDirectoryHandle('PIONEER', { create: false })
    } catch {
      try {
        pioneerDir = await handle.getDirectoryHandle('Contents', { create: false })
      } catch {
        throw new Error(
          'Kein PIONEER- oder Contents-Ordner gefunden. Waehle das Wurzelverzeichnis deines USB-Sticks.'
        )
      }
    }

    // Find export.pdb
    report('Datenbank suchen...')
    const pdbFile = await this.findPdbFile(pioneerDir)
    if (!pdbFile) {
      throw new Error('Keine export.pdb im PIONEER-Ordner gefunden.')
    }

    // Parse PDB
    report('Datenbank lesen...')
    const pdbData = await pdbFile.arrayBuffer()
    const { tracks: pdbTracks, playlists } = parsePdbFile(pdbData)

    if (pdbTracks.length === 0) {
      throw new Error('Keine Tracks in der Datenbank gefunden.')
    }

    report(`${pdbTracks.length} Tracks gefunden — Beatgrids laden...`)

    // Load ANLZ files with concurrency limit
    const anlzMap = new Map<number, AnlzData>()
    const tracksWithPaths = pdbTracks.filter((t) => t.analyzePath)
    let anlzLoaded = 0

    for (let i = 0; i < tracksWithPaths.length; i += MAX_CONCURRENT_ANLZ) {
      const batch = tracksWithPaths.slice(i, i + MAX_CONCURRENT_ANLZ)
      const results = await Promise.allSettled(
        batch.map(async (pdbTrack) => {
          const files = await resolveAnlzFiles(handle, pdbTrack.analyzePath)
          if (!files.dat && !files.ext) return null

          const datData = files.dat ? parseAnlzFile(await files.dat.arrayBuffer()) : null
          const extData = files.ext ? parseAnlzFile(await files.ext.arrayBuffer()) : null
          const anlzData = mergeAnlzData(datData, extData)
          return { id: pdbTrack.id, data: anlzData }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          anlzMap.set(result.value.id, result.value.data)
          anlzLoaded++
        } else if (result.status === 'rejected') {
          warnings.push({
            field: 'anlz',
            message: `Failed to load ANLZ: ${result.reason}`,
          })
        }
      }

      report(`Beatgrids laden... ${anlzLoaded}/${tracksWithPaths.length}`)
    }

    // Map to Track objects
    report('Tracks verarbeiten...')
    const tracks = pdbTracks.map((pdbTrack) =>
      mapPdbTrackToTrack(pdbTrack, anlzMap.get(pdbTrack.id))
    )

    const anlzFinal = anlzMap.size
    const anlzTotal = tracksWithPaths.length
    if (anlzTotal > 0 && anlzFinal < anlzTotal) {
      warnings.push({
        field: 'anlz',
        message: `ANLZ data loaded for ${anlzFinal}/${anlzTotal} tracks. Tracks without ANLZ will be missing beat grid and cue point data.`,
      })
    }

    return {
      tracks,
      playlists,
      source: 'rekordbox-usb',
      version: 'USB Export',
      totalTracks: tracks.length,
      warnings,
      importMode: 'directory',
    }
  }

  private async findPdbFile(pioneerDir: FileSystemDirectoryHandle): Promise<File | null> {
    // Standard location: PIONEER/rekordbox/export.pdb
    try {
      const rbDir = await pioneerDir.getDirectoryHandle('rekordbox', { create: false })
      const fileHandle = await rbDir.getFileHandle('export.pdb', { create: false })
      return await fileHandle.getFile()
    } catch {
      // Fallback: search for export.pdb recursively (some firmware versions differ)
    }

    // Search one level deep
    try {
      for await (const [name, entry] of pioneerDir.entries()) {
        if (entry.kind === 'directory' && name !== 'rekordbox') {
          try {
            const subDir = await pioneerDir.getDirectoryHandle(name, { create: false })
            const fileHandle = await subDir.getFileHandle('export.pdb', { create: false })
            return await fileHandle.getFile()
          } catch {
            continue
          }
        }
      }
    } catch {
      // Iterator not supported or other issue
    }

    return null
  }
}
