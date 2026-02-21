export const BEATGRID_TOLERANCE_OK_MS = 10
export const BEATGRID_TOLERANCE_WARNING_MS = 50
export const MIN_BEATS_FOR_ANALYSIS = 10
export const VARIABLE_BPM_SKIP_THRESHOLD_PCT = 5.0
export const GRID_VALIDATION_ERROR_RATIO = 0.3

// BPM-adaptive Toleranzen: skalieren mit Beat-Intervall
export function adaptiveTolerancesMs(bpm: number): { okMs: number; warningMs: number } {
  const intervalMs = 60000 / bpm
  return {
    okMs: Math.max(10, intervalMs * 0.015),      // 1.5% des Beat-Intervalls
    warningMs: Math.max(35, intervalMs * 0.04),   // 4% des Beat-Intervalls, min 35ms (Beat-Detektor-Jitter)
  }
}

// Bin-Breite fuer Phase-Histogramm (ms)
export const PHASE_BIN_WIDTH_MS = 15

// Dynamic-Segment Konstanten fuer variable-BPM Beatgrid
export const DYNAMIC_SEGMENT_MERGE_THRESHOLD_PCT = 2.0  // < 2% BPM-Diff -> gleiche Sektion
export const DYNAMIC_SEGMENT_MIN_COUNT = 2             // Min 2 raw Segmente pro Gruppe
