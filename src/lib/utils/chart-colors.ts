let rootStyle: CSSStyleDeclaration | null = null

function getRootStyle(): CSSStyleDeclaration {
  if (typeof document === 'undefined') {
    throw new Error('chart-colors: Cannot access CSS variables on the server')
  }
  if (!rootStyle) {
    rootStyle = getComputedStyle(document.documentElement)
  }
  return rootStyle
}

export function getCssVar(name: string): string {
  return getRootStyle().getPropertyValue(name).trim()
}

export function getChartColor(index: number): string {
  return `hsl(${getCssVar(`--chart-${index}`)})`
}

export function getSeverityColor(severity: 'ok' | 'warning' | 'error'): string {
  switch (severity) {
    case 'ok': return getChartColor(2)
    case 'warning': return getChartColor(5)
    case 'error': return `hsl(${getCssVar('--destructive')})`
  }
}
