declare module 'taglib-wasm' {
  interface TagResult {
    title?: string
    artist?: string
    album?: string
    genre?: string
    year?: number
    comment?: string
    [key: string]: unknown
  }

  export function readTags(data: Uint8Array): TagResult
  export function writeTags(data: Uint8Array, tags: Record<string, string | number>): Uint8Array
}
