export const CLIP_THRESHOLD = 0.9999
export const MIN_CONSECUTIVE_SAMPLES = 3
export const WARNING_MAX_REGIONS = 5
export const WARNING_MAX_DURATION_SEC = 0.1

export const CLIPPING_LABELS = {
  clean: 'No Clipping',
  warning: 'Minor Clipping',
  error: 'Significant Clipping',
} as const
