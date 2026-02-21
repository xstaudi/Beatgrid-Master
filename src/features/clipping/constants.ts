export const CLIP_THRESHOLD = 0.9900          // -0.09 dBFS (Branchenstandard)
export const CLIP_NEAR_THRESHOLD = 0.9772     // -0.2 dBFS (Soft-Clipping Warnung)
export const MIN_CONSECUTIVE_SAMPLES = 2      // bei 22050Hz = ~90µs
export const WARNING_MAX_REGIONS = 3
export const WARNING_MAX_DURATION_SEC = 0.05  // 50ms

export const CLIPPING_LABELS = {
  clean: 'No Clipping',
  warning: 'Minor Clipping',
  error: 'Significant Clipping',
} as const
