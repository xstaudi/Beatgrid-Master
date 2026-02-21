/**
 * Token-bucket rate limiter.
 * Each external API gets its own bucket with configurable tokens/second.
 */
interface TokenBucket {
  tokens: number
  maxTokens: number
  refillRate: number // tokens per second
  lastRefill: number // timestamp ms
}

const buckets = new Map<string, TokenBucket>()

export function createBucket(name: string, tokensPerSecond: number, bucketSize: number): void {
  buckets.set(name, {
    tokens: bucketSize,
    maxTokens: bucketSize,
    refillRate: tokensPerSecond,
    lastRefill: Date.now(),
  })
}

/**
 * Try to consume a token. Returns true if allowed, false if rate-limited.
 * Automatically refills based on elapsed time.
 */
export function tryConsume(name: string): boolean {
  const bucket = buckets.get(name)
  if (!bucket) return true // No bucket = no limit

  const now = Date.now()
  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsed * bucket.refillRate)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }

  return false
}

/**
 * Wait until a token is available, then consume it.
 * Returns the wait time in ms.
 */
export async function waitForToken(name: string): Promise<number> {
  const startTime = Date.now()

  while (!tryConsume(name)) {
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Safety: max 30s wait
    if (Date.now() - startTime > 30_000) {
      throw new Error(`Rate limit timeout for ${name}`)
    }
  }

  return Date.now() - startTime
}

// Initialize default buckets
createBucket('acoustid', 3, 3)
createBucket('musicbrainz', 1, 1)
createBucket('discogs', 1, 1)
