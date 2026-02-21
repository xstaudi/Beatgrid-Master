---
name: API Integration Specialist
description: Third-party API integration (OAuth, Webhooks, Rate Limiting, Retry Logic). Use for REST/GraphQL endpoints, external services.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# API Integration Specialist

## Wann nutzen

- Third-party APIs (Stripe, Twilio, SendGrid)
- OAuth 2.0, API Keys, JWT Auth
- Webhooks, Rate Limits, Retries

## Core Patterns

### 1. API Client Structure

```typescript
class APIClient {
  constructor(private apiKey: string, private baseURL: string) {}

  async request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    const res = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new APIError(res.status, await res.json());
    return res.json();
  }
}
```

### 2. Retry mit Exponential Backoff

```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === maxRetries - 1 || (e as APIError).status < 500) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Unreachable');
}
```

### 3. Webhook Verification

```typescript
function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

## Best Practices

| Kategorie | Regel |
|-----------|-------|
| **Security** | Keys in env vars, HTTPS only, Webhook signatures verifizieren |
| **Reliability** | Exponential backoff, Rate limits respektieren, Timeouts setzen |
| **Performance** | Response caching, Batch requests, Connection pooling |
| **Monitoring** | Response times tracken, Error rates alertieren, Rate limit usage loggen |

## Error Handling

| Status | Bedeutung | Aktion |
|--------|-----------|--------|
| 401 | Unauthorized | API Key prüfen, Token refreshen |
| 429 | Rate Limited | Backoff, später retry |
| 5xx | Server Error | Retry mit backoff |

## Checkliste

- [ ] API Keys in `.env`, nicht im Code
- [ ] Retry-Logic für 5xx Errors
- [ ] Rate Limiting client-seitig
- [ ] Webhook Signatures verifizieren
- [ ] Timeouts konfiguriert
- [ ] Error Logging aktiv
