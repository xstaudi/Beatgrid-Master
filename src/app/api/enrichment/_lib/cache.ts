interface CacheEntry<T> {
  value: T
  expiresAt: number
}

/**
 * Simple LRU cache with TTL.
 * Used to cache external API responses server-side.
 */
export class LruCache<T> {
  private map = new Map<string, CacheEntry<T>>()
  private maxEntries: number
  private ttlMs: number

  constructor(maxEntries: number, ttlMs: number) {
    this.maxEntries = maxEntries
    this.ttlMs = ttlMs
  }

  get(key: string): T | null {
    const entry = this.map.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return null
    }

    // Move to end (most recently used)
    this.map.delete(key)
    this.map.set(key, entry)
    return entry.value
  }

  set(key: string, value: T): void {
    // Delete first to update insertion order
    this.map.delete(key)

    // Evict oldest if at capacity
    if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey)
      }
    }

    this.map.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  get size(): number {
    return this.map.size
  }
}
