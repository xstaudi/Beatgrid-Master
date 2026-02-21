import type { DjSoftware } from '@/types/track'
import type { DirectoryAdapter, LibraryAdapter, ParseResult } from './types'
import { RekordboxAdapter } from './rekordbox'
import { TraktorAdapter } from './traktor'
import { RekordboxUsbAdapter } from './rekordbox-usb'

export type { DirectoryAdapter, DirectoryImportResult, LibraryAdapter, ParseResult, ParseWarning } from './types'

export function detectSoftware(xml: string): DjSoftware {
  // Check first 500 chars for identifying markers
  const head = xml.slice(0, 500)

  if (head.includes('DJ_PLAYLISTS') || head.includes('rekordbox')) {
    return 'rekordbox'
  }

  if (head.includes('<NML') || head.includes('Traktor')) {
    return 'traktor'
  }

  throw new Error('Unrecognized DJ software format. Expected Rekordbox XML or Traktor NML.')
}

export function createAdapter(software: DjSoftware): LibraryAdapter {
  switch (software) {
    case 'rekordbox':
      return new RekordboxAdapter()
    case 'traktor':
      return new TraktorAdapter()
    case 'rekordbox-usb':
      throw new Error('Use createDirectoryAdapter() for USB import')
  }
}

export function createDirectoryAdapter(software: DjSoftware): DirectoryAdapter {
  switch (software) {
    case 'rekordbox-usb':
      return new RekordboxUsbAdapter()
    default:
      throw new Error(`No directory adapter for ${software}`)
  }
}

export function parseLibraryXml(xml: string): ParseResult {
  const software = detectSoftware(xml)
  const adapter = createAdapter(software)
  return adapter.parse(xml)
}
