export interface AnlzFiles {
  ext: File | null
  dat: File | null
}

/**
 * Resolve ANLZ files for a track from a USB directory.
 *
 * PDB stores analyze paths like `/PIONEER/USBANLZ/P001/0000ABCD/ANLZ0000.DAT`
 * The EXT file is at the same path with `.EXT` extension.
 * We navigate the FileSystemDirectoryHandle to find these files.
 */
export async function resolveAnlzFiles(
  rootHandle: FileSystemDirectoryHandle,
  analyzePath: string
): Promise<AnlzFiles> {
  if (!analyzePath) return { ext: null, dat: null }

  // Normalize path: remove leading slash, split into segments
  const cleaned = analyzePath.replace(/^\//, '')
  const segments = cleaned.split('/')

  if (segments.length < 2) return { ext: null, dat: null }

  // Navigate to parent directory
  let dirHandle = rootHandle
  const parentSegments = segments.slice(0, -1)
  const fileName = segments[segments.length - 1]

  try {
    for (const segment of parentSegments) {
      dirHandle = await dirHandle.getDirectoryHandle(segment, { create: false })
    }
  } catch {
    return { ext: null, dat: null }
  }

  // Get base name without extension
  const dotIdx = fileName.lastIndexOf('.')
  const baseName = dotIdx > -1 ? fileName.slice(0, dotIdx) : fileName

  const result: AnlzFiles = { ext: null, dat: null }

  // Try to get .EXT file (has extended cue data with colors)
  try {
    const extHandle = await dirHandle.getFileHandle(`${baseName}.EXT`, { create: false })
    result.ext = await extHandle.getFile()
  } catch {
    // EXT file optional
  }

  // Try to get .DAT file
  try {
    const datHandle = await dirHandle.getFileHandle(`${baseName}.DAT`, { create: false })
    result.dat = await datHandle.getFile()
  } catch {
    // DAT file optional
  }

  return result
}
