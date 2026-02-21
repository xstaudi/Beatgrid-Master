import { TRAKTOR_KEY_REVERSE_MAP } from '@/lib/adapters/traktor'
import { normalizeKey } from '@/features/key/services/key-notation'

export function applyBpmFix(el: Element, bpm: number): void {
  const tempo = el.querySelector('TEMPO')
  if (tempo) {
    tempo.setAttribute('BPM', bpm.toFixed(6))
  }
}

export function applyKeyFix(el: Element, doc: Document, key: string): void {
  const normalized = normalizeKey(key)
  if (!normalized) return

  const numericValue = TRAKTOR_KEY_REVERSE_MAP[normalized]
  if (numericValue == null) return

  let musicalKey = el.querySelector('MUSICAL_KEY')
  if (!musicalKey) {
    musicalKey = doc.createElement('MUSICAL_KEY')
    el.appendChild(musicalKey)
  }
  musicalKey.setAttribute('VALUE', String(numericValue))
}

export function applyBeatgridFix(el: Element, downbeatSec: number): void {
  const cues = el.querySelectorAll('CUE_V2')
  for (const cue of cues) {
    if (cue.getAttribute('TYPE') === '4') {
      cue.setAttribute('START', (downbeatSec * 1000).toFixed(1))
      return
    }
  }
}

export function removeEntry(el: Element, doc: Document): void {
  el.parentNode?.removeChild(el)
  const collection = doc.querySelector('COLLECTION')
  if (collection) {
    const current = parseInt(collection.getAttribute('ENTRIES') ?? '0', 10)
    if (current > 0) {
      collection.setAttribute('ENTRIES', String(current - 1))
    }
  }
}
