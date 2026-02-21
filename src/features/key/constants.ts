export const KEY_MATCH_LABELS = {
  match: 'Key Match',
  mismatch: 'Key Mismatch',
  relative: 'Relative Key',
  'no-library-key': 'No Library Key',
  'no-detection': 'No Detection',
} as const

export const KEY_NOTATION_OPTIONS = ['musical', 'camelot', 'openKey'] as const
export type KeyNotation = (typeof KEY_NOTATION_OPTIONS)[number]
