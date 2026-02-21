---
name: security-expert
description: Security Best Practices. Verwenden bei Authentication, Authorization, Input Validation, Rate Limiting, JWT, Passwort-Handling, OWASP, XSS, CSRF, SQL Injection.
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch
---

# Security Expert

## Quick Reference

**Auth:** bcrypt cost ≥12, JWT Expiration (15min/7d), Rate Limiting (IP + Identifier)
**AuthZ:** Default = deny, Server-side Checks (Role + Ownership)
**Input:** Server-side Validation (Zod), Parameterized Queries
**Headers:** HSTS, X-Frame-Options, CSP

**Projekt-Kontext:** security.md

---

## Wann verpflichtend

**Pflicht bei:**
- ✅ Auth-Flows (Login, Signup, Password Reset)
- ✅ Admin-Endpoints
- ✅ Public-Facing APIs
- ✅ Anything touching PII

---

## Authentication

**Passwort-Hashing (Pflicht):**
```typescript
const hash = await bcrypt.hash(password, 12); // cost ≥12
const valid = await bcrypt.compare(password, hash);
```

**JWT Best Practices:**
```typescript
// Access Token: 15min, Memory
{ expiresIn: '15m', algorithm: 'HS256' }

// Refresh Token: 7d, httpOnly Cookie
{ expiresIn: '7d', algorithm: 'HS256' }
```

**Refresh Token Storage (Pflicht):**
- Server-seitig gespeichert (DB/Redis)
- Hashen wie Passwörter (bcrypt)
- Rotation erzwingen (neues Token bei Refresh)
- Reuse Detection → Session Kill

**Session/Cookie Flags:**
```typescript
{ httpOnly: true, secure: true, sameSite: 'strict' }
```

---

## Authorization

**Prinzip:** Default = deny, explizite Checks

```typescript
// Role + Ownership prüfen
if (user.role !== 'ADMIN' && resource.ownerId !== user.id) {
  throw new ForbiddenError();
}
```

**Regeln (Pflicht):**
- Server-seitig: Role + Ownership prüfen
- Default = deny
- Permission-Checks VOR Business-Logik
- Keine Business-Logik im Frontend vertrauen

---

## Rate Limiting

**Strategie (Pflicht):** User + IP kombinieren

| Endpoint | Limit | Strategie |
|----------|-------|-----------|
| Login | 5/15min | IP + Identifier |
| Signup | 3/h | IP + Email |
| Password Reset | 3/h | Email |
| API | 100/min | UserID, Fallback IP |
| Admin | 50/min | UserID + Role |

**Warum:** IP-only bei Proxies unzuverlässig, UserID-only bei Enumeration schwach.

---

## Input Validation

- Server-side IMMER (Zod)
- Parameterized Queries (ORMs)
- Keine User-Inputs in: eval(), SQL strings, File paths

---

## HTTP Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

**CSP:**
```
Content-Security-Policy:
  default-src 'self';
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.theweekend.at;
  script-src 'self';
```

---

## Password Reset Flow

1. User gibt Email → Token generieren (crypto.randomBytes)
2. Token HASHEN in DB (expires: 1h)
3. Email mit UNHASHED Token
4. Vergleich: hash(input) === stored
5. Passwort setzen, alle Sessions invalidieren

---

## Logging (Pflicht)

**Niemals loggen:**
- ❌ Passwörter, Tokens, Secrets
- ❌ PII ohne Anonymisierung

**Empfehlung:**
- Logger-Redaction
- Security Events (Login-Failures, Auth-Failures)

---

## Red Flags

- `eval()`, `new Function()`, `dangerouslySetInnerHTML`
- Hardcoded Secrets
- `any` bei Auth-Daten
- Fehlende Rate Limits
- Tokens ohne Expiration
- Passwort im Log
- Fehlende Authorization-Checks

---

## Wann aktiv

Auth, Passwort, Token, Rate Limiting, Input Validation, API Security.
