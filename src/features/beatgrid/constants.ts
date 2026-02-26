export const BEATGRID_TOLERANCE_OK_MS = 10
export const BEATGRID_TOLERANCE_WARNING_MS = 50
export const MIN_BEATS_FOR_ANALYSIS = 10
export const GRID_VALIDATION_ERROR_RATIO = 0.3

// BPM-adaptive Toleranzen: skalieren mit Beat-Intervall
// DJ-Standard: <10ms OK, >20ms hoerbar beim Beatmatching
export function adaptiveTolerancesMs(bpm: number): { okMs: number; warningMs: number } {
  const intervalMs = 60000 / bpm
  return {
    okMs: Math.max(8, intervalMs * 0.015),       // 1.5% des Beat-Intervalls, min 8ms
    warningMs: Math.max(20, intervalMs * 0.035),  // 3.5% des Beat-Intervalls, min 20ms
  }
}

// Bin-Breite fuer Phase-Histogramm (ms)
// 5ms Bins + 3-Bin-Smoothing = effektive ±5ms Glaettung
export const PHASE_BIN_WIDTH_MS = 5

// Dynamic-Segment Konstanten fuer variable-BPM Beatgrid
export const DYNAMIC_SEGMENT_MERGE_THRESHOLD_PCT = 2.0  // < 2% BPM-Diff -> gleiche Sektion
export const DYNAMIC_SEGMENT_MIN_COUNT = 2             // Min 2 raw Segmente pro Gruppe
