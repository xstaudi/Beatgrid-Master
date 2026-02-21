import type { AudioFileTags, FileTagComparison } from '@/types/enrichment'
import type { Track } from '@/types/track'

let taglibModule: typeof import('taglib-wasm') | null = null

async function getTaglib() {
  if (!taglibModule) {
    taglibModule = await import('taglib-wasm')
  }
  return taglibModule
}

/**
 * Tags aus einer Audio-Datei lesen via taglib-wasm.
 * Unterstuetzt MP3 (ID3v2), FLAC (Vorbis), M4A/MP4 (iTunes), WAV, OGG, AIFF.
 *
 * Hinweis: Die Simple API liefert nur Basis-Tags (title, artist, album, genre, year, comment).
 * Fuer erweiterte Felder (composer, label, isrc) wird spaeter die Full API integriert.
 */
export async function readTagsFromFile(file: File | ArrayBuffer): Promise<AudioFileTags> {
  const taglib = await getTaglib()

  const input = file instanceof File ? file : new Uint8Array(file)
  const result = await taglib.readTags(input)

  return {
    title: result.title || null,
    artist: result.artist || null,
    album: result.album || null,
    genre: result.genre || null,
    year: result.year ?? null,
    composer: null, // TODO: Full API fuer erweiterte Felder
    label: null,
    comment: result.comment || null,
    isrc: null,
  }
}

/**
 * Vergleiche Tags in der Audio-Datei mit den Werten aus der DJ-Software (XML/NML).
 * Zeigt Diskrepanzen auf (z.B. Genre in Datei vorhanden aber nicht in Rekordbox).
 */
export function compareFileTags(
  fileTags: AudioFileTags,
  track: Track,
): FileTagComparison[] {
  const comparisons: FileTagComparison[] = []

  const fields: { field: string; fileValue: string | null; libraryValue: string | null }[] = [
    { field: 'title', fileValue: fileTags.title, libraryValue: track.title || null },
    { field: 'artist', fileValue: fileTags.artist, libraryValue: track.artist || null },
    { field: 'album', fileValue: fileTags.album, libraryValue: track.album || null },
    { field: 'genre', fileValue: fileTags.genre, libraryValue: track.genre || null },
    { field: 'year', fileValue: fileTags.year != null ? String(fileTags.year) : null, libraryValue: track.year != null ? String(track.year) : null },
    { field: 'composer', fileValue: fileTags.composer, libraryValue: track.composer || null },
    { field: 'label', fileValue: fileTags.label, libraryValue: track.label || null },
    { field: 'comment', fileValue: fileTags.comment, libraryValue: track.comment || null },
  ]

  for (const { field, fileValue, libraryValue } of fields) {
    const normalizedFile = fileValue?.trim().toLowerCase() ?? ''
    const normalizedLib = libraryValue?.trim().toLowerCase() ?? ''

    comparisons.push({
      field,
      fileValue: fileValue?.trim() || null,
      libraryValue: libraryValue?.trim() || null,
      match: normalizedFile === normalizedLib,
    })
  }

  return comparisons
}
