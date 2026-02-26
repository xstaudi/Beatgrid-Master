/**
 * Mel-Filterbank fuer Onset-Strength-Envelope.
 * Triangular Filters, mel-spaced.
 */

export function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700)
}

export function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1)
}

/**
 * Erstellt eine Mel-Filterbank.
 * Ergebnis: Array von numFilters Float64Arrays, jedes mit fftSize/2+1 Gewichten.
 *
 * Einmal pro (sampleRate, fftSize) berechnen, dann wiederverwenden.
 */
export function createMelFilterbank(
  numFilters = 40,
  fftSize = 2048,
  sampleRate = 22050,
  fMin = 20,
  fMax = 8000,
): Float64Array[] {
  const numBins = (fftSize >> 1) + 1
  const melMin = hzToMel(fMin)
  const melMax = hzToMel(fMax)

  // numFilters + 2 gleichmaessig verteilte Mel-Punkte (inkl. Raender)
  const melPoints = new Float64Array(numFilters + 2)
  const melStep = (melMax - melMin) / (numFilters + 1)
  for (let i = 0; i < numFilters + 2; i++) {
    melPoints[i] = melMin + i * melStep
  }

  // Mel-Punkte in FFT-Bin-Indizes konvertieren
  const binIndices = new Float64Array(numFilters + 2)
  for (let i = 0; i < numFilters + 2; i++) {
    const hz = melToHz(melPoints[i])
    binIndices[i] = (hz * fftSize) / sampleRate
  }

  // Triangular Filter erstellen
  const filters: Float64Array[] = []
  for (let m = 0; m < numFilters; m++) {
    const filter = new Float64Array(numBins)
    const left = binIndices[m]
    const center = binIndices[m + 1]
    const right = binIndices[m + 2]

    for (let k = 0; k < numBins; k++) {
      if (k >= left && k <= center && center > left) {
        filter[k] = (k - left) / (center - left)
      } else if (k > center && k <= right && right > center) {
        filter[k] = (right - k) / (right - center)
      }
    }
    filters.push(filter)
  }

  return filters
}
