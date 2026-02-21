# Naming-Konventionen

Quick-Reference für Namensgebung im Projekt.

**Detail-Docs:** `docs/entwicklung/naming-conventions.md`

---

## Dateien & Ordner

| Bereich | Pattern | Beispiel |
|---------|---------|----------|
| **Features/Module** | kebab-case | `my-feature/` |
| **Components** | PascalCase | `EventCard.tsx` |
| **Hooks** | camelCase mit `use` | `useEvents.ts` |
| **Services (API)** | kebab-case.api.ts | `events.api.ts` |
| **Utils** | kebab-case | `date-utils.ts` |
| **Types** | types.ts | `types.ts` |

---

## TypeScript

```typescript
// Variablen/Funktionen: camelCase
const eventList = [];
function formatDate(date: Date) {}

// Konstanten: SCREAMING_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Types/Interfaces: PascalCase
type EventStatus = 'draft' | 'published';
interface EventCardProps { ... }

// Zod Schemas: PascalCase + Dto
const CreateEventDto = z.object({ ... });
```

---

## Datenbank

```typescript
// Tabellen: Plural, camelCase (TS) / snake_case (SQL)
export const events = pgTable('events', { ... });
export const eventCollaborators = pgTable('event_collaborators', { ... });

// Spalten: camelCase (TS) / snake_case (SQL)
createdAt: timestamp('created_at')
```

---

## API Endpoints

```
GET    /api/events           # List
GET    /api/events/:id       # Get
POST   /api/events           # Create
PUT    /api/events/:id       # Update
DELETE /api/events/:id       # Delete

# Actions
POST   /api/events/:id/publish
```

---

## Module/Features

- **Entitäten:** Plural (`events`, `users`)
- **Abstrakte:** Singular (`auth`, `dashboard`)
- **Zusammengesetzt:** kebab-case (`dj-calendar`)

---

## Claude Extensions

| Typ | Pattern | Beispiel |
|-----|---------|----------|
| Skills | Title Case + Spaces | `Code Review Expert.md` |
| Commands | kebab-case | `review-issue.md` |
| Agents | kebab-case | `backend-architect.md` |
| Rules | kebab-case | `backend.md` |

---

**Siehe auch:** `feature-structure.md`, `module-structure.md`
