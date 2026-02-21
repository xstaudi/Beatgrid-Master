import type { TempoMarker } from '@/types/track'

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

export function applyBeatgridFix(
  el: Element,
  downbeatSec: number,
  tempoMarkers?: TempoMarker[],
): void {
  if (tempoMarkers && tempoMarkers.length > 0) {
    // Vollständiges Beatgrid schreiben: existierende TEMPO-Elemente entfernen
    const existing = Array.from(el.querySelectorAll('TEMPO'))
    for (const t of existing) t.parentNode?.removeChild(t)

    const doc = el.ownerDocument!
    for (const marker of tempoMarkers) {
      const tempo = doc.createElement('TEMPO')
      tempo.setAttribute('Inizio', marker.position.toFixed(3))
      tempo.setAttribute('Bpm', marker.bpm.toFixed(2))
      tempo.setAttribute('Metro', marker.meter)
      tempo.setAttribute('Battito', String(marker.beat))
      el.appendChild(tempo)
    }
  } else {
    // Legacy: nur Inizio des ersten TEMPO-Elements aktualisieren
    const firstTempo = el.querySelector('TEMPO')
    if (firstTempo) {
      firstTempo.setAttribute('Inizio', downbeatSec.toFixed(3))
    }
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
