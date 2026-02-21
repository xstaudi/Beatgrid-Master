export { compareKey, checkKeyLibrary } from './services/key-comparison'
export {
  musicalToCamelot,
  musicalToOpenKey,
  camelotToMusical,
  normalizeKey,
  getRelativeKey,
  getCompatibleKeys,
  detectKeyNotation,
  keyToNotation,
} from './services/key-notation'
export type { KeyInfo } from './services/key-notation'
export { KeySummaryCard } from './components/KeySummaryCard'
export { KEY_MATCH_LABELS, KEY_NOTATION_OPTIONS } from './constants'
export type { KeyNotation } from './constants'
