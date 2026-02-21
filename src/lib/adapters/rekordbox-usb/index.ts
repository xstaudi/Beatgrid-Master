import type { DirectoryAdapter, DirectoryImportResult, ParseWarning } from '../types'
import { parsePdbFile } from './pdb-parser'
import { parseAnlzFile, mergeAnlzData, type AnlzData } from './anlz-parser'
import { resolveAnlzFiles } from './anlz-resolver'
import { mapPdbTrackToTrack } from './track-mapper'

const MAX_CONCURRENT_ANLZ = 10

export class RekordboxUsbAdapter implements DirectoryAdapter {
  readonly softwareType = 'rekordbox-usb' as const
  readonly importMode = 'directory' as const

  async parseDirectory(handle: FileSystemDirectoryHandle): Promise<DirectoryImportResult> {
    const warnings: ParseWarning[] = []

    // Find PIONEER directory
    let pioneerDir: FileSystemDirectoryHandle
    try {
      pioneerDir = await handle.getDirectoryHandle('PIONEER', { create: false })
    } catch {
      // Some sticks use "Contents" instead
      try {
        pioneerDir = await handle.getDirectoryHandle('Contents', { create: false })
      } catch {
        throw new Error(
          'No PIONEER or Contents folder found. Make sure you selected a Rekordbox USB drive.'
        )
      }
    }

    // Find export.pdb
    const pdbFile = await this.findPdbFile(pioneerDir)
    if (!pdbFile) {
      throw new Error('No export.pdb found in the PIONEER folder.')
    }

    // Parse PDB
    const pdbData = await pdbFile.arrayBuffer()
    const { tracks: pdbTracks, playlists } = parsePdbFile(pdbData)

    if (pdbTracks.length === 0) {
      throw new Error('No tracks found in the database.')
    }

    // Load ANLZ files with concurrency limit
    const anlzMap = new Map<number, AnlzData>()
    const tracksWithPaths = pdbTracks.filter((t) => t.analyzePath)

    for (let i = 0; i < tracksWithPaths.length; i += MAX_CONCURRENT_ANLZ) {
      const batch = tracksWithPaths.slice(i, i + MAX_CONCURRENT_ANLZ)
      const results = await Promise.allSettled(
        batch.map(async (pdbTrack) => {
          const files = await resolveAnlzFiles(handle, pdbTrack.analyzePath)
          if (!files.dat && !files.ext) return null

          // Parse both DAT and EXT, then merge:
          // beat grid from DAT, extended cues from EXT
          const datData = files.dat ? parseAnlzFile(await files.dat.arrayBuffer()) : null
          const extData = files.ext ? parseAnlzFile(await files.ext.arrayBuffer()) : null
          const anlzData = mergeAnlzData(datData, extData)
          return { id: pdbTrack.id, data: anlzData }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          anlzMap.set(result.value.id, result.value.data)
        } else if (result.status === 'rejected') {
          warnings.push({
            field: 'anlz',
            message: `Failed to load ANLZ: ${result.reason}`,
          })
        }
      }
    }

    // Map to Track objects
    const tracks = pdbTracks.map((pdbTrack) =>
      mapPdbTrackToTrack(pdbTrack, anlzMap.get(pdbTrack.id))
    )

    const anlzLoaded = anlzMap.size
    const anlzTotal = tracksWithPaths.length
    if (anlzTotal > 0 && anlzLoaded < anlzTotal) {
      warnings.push({
        field: 'anlz',
        message: `ANLZ data loaded for ${anlzLoaded}/${anlzTotal} tracks. Tracks without ANLZ will be missing beat grid and cue point data.`,
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
