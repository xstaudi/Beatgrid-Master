// eslint-disable-next-line @typescript-eslint/no-explicit-any
let aubioModule: any = null
let loadingPromise: Promise<void> | null = null

export async function getAubio(): Promise<{ Tempo: new (bufSize: number, hopSize: number, sampleRate: number) => AubioTempo }> {
  if (aubioModule) return aubioModule

  if (!loadingPromise) {
    loadingPromise = (async () => {
      const mod = await import('aubiojs')
      const instance = await mod.default()
      aubioModule = instance
    })()
  }

  await loadingPromise
  return aubioModule
}

export function releaseAubio(): void {
  aubioModule = null
  loadingPromise = null
}

export function isAubioLoaded(): boolean {
  return aubioModule != null
}

export interface AubioTempo {
  do(input: Float32Array): number
  getBpm(): number
  getConfidence(): number
}
