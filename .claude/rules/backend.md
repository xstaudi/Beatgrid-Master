---
paths:
  - backend/**/*.ts
  - backend/**/*.js
---

# Backend Rules (Express + Drizzle)

## Architektur-Schichten

### Layer-Verantwortung (präzise)

**Routes:** Nur Endpoint-Registrierung + Middleware, keine Logik
```typescript
router.post(
  '/events/:id/publish',
  requireAuth,
  requirePermission('events.publish'),
  EventsController.publish // Controller-Funktion
);
```

**Controller:** DTO parse + Service call + Response mapping
```typescript
export const EventsController = {
  async publish(req: Request, res: Response) {
    // 1. DTO parse (Input-Validierung)
    const input = publishEventDto.parse({
      params: req.params,
      body: req.body,
    });
    
    // 2. Service call
    const result = await EventsService.publish(
      input.params.id,
      req.user.id
    );
    
    // 3. Response mapping
    return res.status(200).json(result);
  },
};
```

**Service:** Business-Logik + DB + Transaktionen, kein Express req/res
```typescript
export class EventsService {
  static async publish(eventId: string, userId: string) {
    // Business-Logik + DB
    // Wirft typed errors (NotFoundError, ForbiddenError, etc.)
  }
}
```

**DTO:** Zod Schemas + Type Inference
```typescript
export const publishEventDto = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ scheduledAt: z.date().optional() }),
});
export type PublishEventInput = z.infer<typeof publishEventDto>;
```

## Verboten

- ❌ **Kein direkter DB-Zugriff** aus Controllern oder Routes
  ```typescript
  // ❌ Verboten: DB in Route
  router.post('/x', async (req, res) => db.insert(...));
  ```
- ❌ **Keine Business-Logik** in Routes
- ❌ **Keine `any` ohne Kommentar** → Standard: `unknown` in catch-blöcken
- ❌ **Keine `res.status(...).json(...)` in Services** → Services werfen Errors, Controller/Middleware mappt

## Service-Pattern

```typescript
export class XService {
  // Static ist erlaubt, aber nicht zwingend (für Testing/DI später anpassbar)
  static async get(id: string) {
    return await db.select().from(table).where(eq(table.id, id));
  }
}
```

## Validierung (komplett)

**Input-Validierung (Pflicht):**
- **params, query, body** immer per Zod validieren
- `strict()` für Body (keine unbekannten Felder)
- `stripUnknown()` optional für Query-Params

**Output-Validierung (Optional):**
- **Public APIs / kritische Endpoints:** Zod Output-Schema
- **Interne APIs:** Type-only Output mit klarer Mapping-Funktion (DB → API DTO)

**Beispiel:**
```typescript
// Input
const input = createEventDto.strict().parse(req.body);

// Output (optional, nur für kritische Endpoints)
const output = eventResponseSchema.parse(result);
```

**Regel:** Keine silent fails, immer Zod parse/safeParse am Boundary

## Error Handling (Standard)

**Services werfen typed errors:**
```typescript
// Services werfen:
throw new NotFoundError('Event not found');
throw new ForbiddenError('Insufficient permissions');
throw new ValidationError('Invalid input', details);
```

**Controller fängt nicht** (übergibt an zentrale Error-Middleware):
```typescript
// Controller: KEIN try/catch (außer bei speziellen Fällen)
export const EventsController = {
  async publish(req: Request, res: Response) {
    const result = await EventsService.publish(...);
    return res.json(result); // Error wird automatisch gemappt
  },
};
```

**Zentrale Error-Middleware mappt → einheitlicher Error-Shape:**
```typescript
{
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | ...,
  message: string,
  details?: unknown,
  requestId: string
}
```

**Regel:** Eine Error-Middleware ist die einzige Stelle für Statuscodes (kein `res.status()` in Services)

## DB/Drizzle Regeln

**Drizzle nur in Services:**
- ❌ Keine `db.` Imports außerhalb `backend/src/services/**`

**Transaktionen (Pflicht bei):**
- 2+ Writes, die zusammengehören
- Write + Side-effect (Queue/Notifications) → Outbox/Queue-Pattern
- Multi-Step-Operationen mit Rollback-Bedarf

**Keine "partial updates" ohne definierte Update-DTOs:**
```typescript
// ❌ Vage Update
await db.update(table).set(req.body);

// ✅ Definiertes Update-DTO
const update = updateEventDto.parse(req.body);
await db.update(table).set(update);
```

**N+1 Queries vermeiden:**
- Bei Listen: Relations (`with:`) oder Joins nutzen
- Nicht: Loop mit einzelnen Queries

**Beispiel: Transaktion**
```typescript
await db.transaction(async (tx) => {
  const [event] = await tx.insert(events).values(...).returning();
  await tx.insert(notifications).values(...);
  await queueService.enqueue('event.published', event.id);
});
```

## Observability (Minimum)

**RequestId pro Request:**
- Middleware setzt `requestId` (UUID)
- In allen Logs verfügbar

**Strukturierte Logs (Minimum):**
- `route`, `method`, `userId?`, `durationMs`, `errorCode?`
- Keine Passwörter/Tokens im Log

**Beispiel:**
```typescript
logger.info({
  route: '/api/events',
  method: 'POST',
  userId: req.user?.id,
  durationMs: Date.now() - startTime,
});
```

## Dateien

**File Size Regel (Soft Limit):**
- < 250 Zeilen pro Datei (Soft Limit)
- **Escape Hatch:** Bei Bedarf nach Domains splitten:
  - `XService` (Read)
  - `XCommandService` (Write/Transaktionen)
  - `XQueryService` (komplexe Reads)

**Beispiel:**
```typescript
// Zu groß? → Splitten:
// EventsService.ts → EventsCommandService.ts + EventsQueryService.ts
```

## Type Safety

**Standard: `unknown` statt `any`:**
- `unknown` in catch-blöcken
- `any` nur bei externen Libraries + Kommentar warum nicht typisierbar

**Beispiel:**
```typescript
// ❌ any
catch (error: any) { ... }

// ✅ unknown
catch (error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message);
  }
}
```

---

## Do/Don't Beispiele

### ✅ Route (nur Wiring)
```typescript
router.post(
  '/events/:id/publish',
  requireAuth,
  requirePermission('events.publish'),
  EventsController.publish
);
```

### ✅ Controller (DTO + Service + Response)
```typescript
const input = publishEventDto.parse({ params: req.params, body: req.body });
const result = await EventsService.publish(input.params.id, req.user.id);
return res.status(200).json(result);
```

### ❌ Don't: DB in Route
```typescript
router.post('/x', async (req, res) => db.insert(...)); // verboten
```

---

## Quality Gate Checkliste

**PR-Checkliste:**
- [ ] DTO parse vorhanden? (params, query, body)
- [ ] Service wirft typed errors? (kein `res.status()` in Service)
- [ ] Multi-write => Transaktion?
- [ ] Keine N+1 Queries? (Relations/Joins genutzt?)
- [ ] RequestId in Logs?
- [ ] Keine `any` ohne Kommentar? (`unknown` statt `any`)

---

---

## Module Organization (Pflicht!)

**Standard:** @docs/entwicklung/module-structure.md

### Pflicht-Struktur

```
modules/[module]/
├── controller.ts         # HTTP Handler (dünn!)
├── service.ts            # Business Logic + DB-Zugriff
├── routes.ts             # Express Routes
├── dtos.ts               # Zod Validation Schemas
└── types.ts              # TypeScript Types
```

### Sub-Services Pattern (>500 LOC)

Wenn Haupt-Service zu groß wird:

```
modules/[module]/
├── services/
│   ├── index.ts              # Re-exports
│   ├── [module]-crud.service.ts
│   ├── [module]-query.service.ts
│   └── [module]-admin.service.ts
├── controller.ts
└── ...
```

**Indikatoren für Splitting:**
- Service >500 LOC
- Klar abgrenzbare Domains (CRUD vs Query vs Admin)
- Wiederverwendbare Logik über mehrere Controller

### Responsibility Matrix

| Layer | Verantwortung | Beispiel |
|-------|---------------|----------|
| **routes.ts** | HTTP-Routing, Auth-Middleware | `router.get('/events/:id', requireAuth, controller.getById)` |
| **controller.ts** | Input-Parsing, Response | `const input = dto.parse(req.body); res.json(result);` |
| **service.ts** | Business-Logik, DB-Zugriff | `return db.query.events.findFirst({ where: ... })` |
| **dtos.ts** | Zod Input-Validation | `export const CreateEventDto = z.object({ ... })` |

### Checkliste: Neues Modul

- [ ] `routes.ts` mit Express Router
- [ ] `controller.ts` mit Request/Response Handler
- [ ] `service.ts` mit Business-Logik
- [ ] `dtos.ts` mit Zod Schemas
- [ ] `types.ts` mit TypeScript Types
- [ ] Routes in `backend/src/routes/index.ts` registriert
- [ ] Keine DB-Zugriffe im Controller

---

## Referenz

Vollständige API-Dokumentation: @docs/technik/api-reference.md
DB-Schema Details: @docs/technik/database-schema.md
Security-Regeln: @docs/technik/security.md
**Modul-Struktur:** @docs/entwicklung/module-structure.md
**Naming-Konventionen:** @docs/entwicklung/naming-conventions.md
**Error Contract:** (zu dokumentieren)
**Logging/Observability:** (zu dokumentieren oder in security.md Abschnitt)
