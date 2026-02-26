export interface MemorySnapshot {
  usedJSHeapSizeMb: number
  totalJSHeapSizeMb: number
  jsHeapSizeLimitMb: number
  usagePercent: number
}

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

const MB = 1024 * 1024

/**
 * Returns a memory snapshot if performance.memory is available (Chrome only).
 */
export function getMemorySnapshot(): MemorySnapshot | null {
  const perf = performance as Performance & { memory?: PerformanceMemory }
  if (!perf.memory) return null

  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perf.memory
  return {
    usedJSHeapSizeMb: usedJSHeapSize / MB,
    totalJSHeapSizeMb: totalJSHeapSize / MB,
    jsHeapSizeLimitMb: jsHeapSizeLimit / MB,
    usagePercent: (usedJSHeapSize / jsHeapSizeLimit) * 100,
  }
}

/**
 * Returns true if memory usage exceeds 80% of the given budget.
 */
export function shouldThrottleWorkers(budgetMb: number, currentUsageMb: number): boolean {
  return currentUsageMb > budgetMb * 0.8
}

/**
 * Formats MB value for display.
 */
export function formatMemory(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`
  return `${mb.toFixed(1)} MB`
}

/**
 * Gibt geschaetzten Device-RAM in GB zurueck.
 * navigator.deviceMemory (Chromium) → Heap-Heuristik → Default 8.
 */
export function getDeviceMemoryGb(): number {
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory) return nav.deviceMemory

  const perf = performance as Performance & { memory?: { jsHeapSizeLimit: number } }
  if (perf.memory?.jsHeapSizeLimit) {
    return Math.round((perf.memory.jsHeapSizeLimit / (1024 * 1024 * 1024)) * 4)
  }

  return 8
}

/**
 * Demucs-spezifisches Throttling: Haertere Grenze als Standard.
 * Demucs braucht ~1-1.5 GB, daher frueheres Throttling.
 */
export function shouldThrottleDemucs(currentUsageMb: number): boolean {
  return shouldThrottleWorkers(1500, currentUsageMb)
}
