import type { DjSoftware } from '@/types/track'
import type { FixOperation, MutationResult } from '@/types/fix'
import * as rb from './rekordbox-mutations'
import * as tk from './traktor-mutations'

function buildTrackIndex(
  doc: Document,
  source: DjSoftware,
): Map<string, Element> {
  const index = new Map<string, Element>()

  if (source === 'rekordbox') {
    const tracks = doc.querySelectorAll('COLLECTION > TRACK')
    for (const el of tracks) {
      const id = el.getAttribute('TrackID')
      if (id) index.set(`rb-${id}`, el)
    }
  } else {
    const entries = doc.querySelectorAll('COLLECTION > ENTRY')
    for (const el of entries) {
      const audioId = el.getAttribute('AUDIO_ID')
      const title = el.getAttribute('TITLE')
      const key = audioId || title
      if (key) index.set(`tr-${key}`, el)
    }
  }

  return index
}

function applyOperation(
  doc: Document,
  el: Element,
  op: FixOperation,
  source: DjSoftware,
): void {
  if (source === 'rekordbox') {
    switch (op.kind) {
      case 'bpm':
        if (op.detectedBpm != null) rb.applyBpmFix(el, op.detectedBpm)
        break
      case 'key':
        if (op.detectedKey) rb.applyKeyFix(el, op.detectedKey)
        break
      case 'beatgrid':
        if (op.newDownbeatSec != null) rb.applyBeatgridFix(el, op.newDownbeatSec)
        break
      case 'duplicate-remove':
        rb.removeTrack(el, doc)
        break
    }
  } else {
    switch (op.kind) {
      case 'bpm':
        if (op.detectedBpm != null) tk.applyBpmFix(el, op.detectedBpm)
        break
      case 'key':
        if (op.detectedKey) tk.applyKeyFix(el, doc, op.detectedKey)
        break
      case 'beatgrid':
        if (op.newDownbeatSec != null) tk.applyBeatgridFix(el, op.newDownbeatSec)
        break
      case 'duplicate-remove':
        tk.removeEntry(el, doc)
        break
    }
  }
}

export function applyFixes(
  originalXml: string,
  operations: FixOperation[],
  source: DjSoftware,
): MutationResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(originalXml, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error(`XML parsing failed: ${parseError.textContent}`)
  }

  const trackIndex = buildTrackIndex(doc, source)

  const skippedTrackIds: string[] = []
  const removedTrackIds: string[] = []
  let appliedCount = 0

  for (const op of operations) {
    const el = trackIndex.get(op.trackId)
    if (!el) {
      skippedTrackIds.push(op.trackId)
      continue
    }

    applyOperation(doc, el, op, source)
    appliedCount++

    if (op.kind === 'duplicate-remove') {
      removedTrackIds.push(op.trackId)
      trackIndex.delete(op.trackId)
    }
  }

  const serializer = new XMLSerializer()
  let xmlContent = serializer.serializeToString(doc)

  // Ensure proper XML declaration
  if (!xmlContent.startsWith('<?xml')) {
    const standalone = source === 'traktor' ? ' standalone="no"' : ''
    xmlContent = `<?xml version="1.0" encoding="UTF-8"${standalone}?>\n${xmlContent}`
  }

  return { xmlContent, appliedCount, skippedTrackIds, removedTrackIds }
}
