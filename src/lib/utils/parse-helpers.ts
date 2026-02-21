export function safeParseFloat(val: string | null | undefined): number | null {
  if (val == null || val === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

export function safeParseInt(val: string | null | undefined): number | null {
  if (val == null || val === '') return null
  const num = parseInt(val, 10)
  return isNaN(num) ? null : num
}

export function decodeRekordboxPath(location: string): string {
  // Remove file://localhost/ prefix and decode URI components
  const withoutPrefix = location.replace(/^file:\/\/localhost\//, '/')
  return decodeURIComponent(withoutPrefix)
}

export function buildTraktorPath(dir: string, file: string, volume: string): string {
  // Traktor uses /:dir/:dir/:file format with : as path separator
  // Replace /: with / to get normal path separators
  const dirPath = dir.replace(/\/:/g, '/')
  return `${volume}${dirPath}${file}`
}

export function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? ''
}

export function child(el: Element, selector: string): Element | null {
  return el.querySelector(selector)
}

export function normalizeRating(raw: number, max: number = 255): number {
  if (raw <= 0) return 0
  return Math.round((raw / max) * 5)
}
