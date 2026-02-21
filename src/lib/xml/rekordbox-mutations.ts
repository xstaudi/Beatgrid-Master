export function applyBpmFix(el: Element, bpm: number): void {
  el.setAttribute('AverageBpm', bpm.toFixed(2))
  const firstTempo = el.querySelector('TEMPO')
  if (firstTempo) {
    firstTempo.setAttribute('Bpm', bpm.toFixed(2))
  }
}

export function applyKeyFix(el: Element, key: string): void {
  el.setAttribute('Tonality', key)
}

export function applyBeatgridFix(el: Element, downbeatSec: number): void {
  const firstTempo = el.querySelector('TEMPO')
  if (firstTempo) {
    firstTempo.setAttribute('Inizio', downbeatSec.toFixed(3))
  }
}

export function removeTrack(el: Element, doc: Document): void {
  el.parentNode?.removeChild(el)
  const collection = doc.querySelector('COLLECTION')
  if (collection) {
    const current = parseInt(collection.getAttribute('Entries') ?? '0', 10)
    if (current > 0) {
      collection.setAttribute('Entries', String(current - 1))
    }
  }
}
