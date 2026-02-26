/**
 * Device Memory Detection fuer Demucs RAM-Warnung.
 */

export interface DeviceMemoryInfo {
  estimatedRamGb: number
  tier: 'low' | 'medium' | 'high'
  canRunDemucs: boolean
  warningMessage: string | null
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    jsHeapSizeLimit: number
    totalJSHeapSize: number
    usedJSHeapSize: number
  }
}

const GB = 1024 * 1024 * 1024

/** Feature-Flag: Demucs Stem-Separation via ONNX Runtime */
export const DEMUCS_FEATURE_ENABLED = true

/**
 * Erkennt den verfuegbaren Arbeitsspeicher des Geraets.
 * navigator.deviceMemory (Chromium) → performance.memory Heuristik → Default 8 GB.
 */
export function detectDeviceMemory(): DeviceMemoryInfo {
  let estimatedRamGb = 8 // Default-Annahme

  // Primaere Quelle: navigator.deviceMemory (Chromium)
  const nav = typeof navigator !== 'undefined' ? navigator as NavigatorWithMemory : null
  if (nav?.deviceMemory) {
    estimatedRamGb = nav.deviceMemory
  } else if (typeof performance !== 'undefined') {
    // Fallback: jsHeapSizeLimit als Heuristik (~25% des physischen RAM)
    const perf = performance as PerformanceWithMemory
    if (perf.memory?.jsHeapSizeLimit) {
      estimatedRamGb = Math.round((perf.memory.jsHeapSizeLimit / GB) * 4)
    }
  }

  const tier = estimatedRamGb < 6 ? 'low' : estimatedRamGb < 12 ? 'medium' : 'high'
  const canRunDemucs = DEMUCS_FEATURE_ENABLED && estimatedRamGb >= 4

  const warningMessage = !canRunDemucs
    ? `Dein System hat nur ~${estimatedRamGb} GB RAM. Erweiterte Beat-Analyse benoetigt mindestens 4 GB.`
    : null

  return { estimatedRamGb, tier, canRunDemucs, warningMessage }
}
