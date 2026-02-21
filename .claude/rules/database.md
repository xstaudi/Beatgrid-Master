---
paths:
  - backend/src/db/**/*.ts
  - backend/scripts/**/*.ts
---

# Database Rules (Drizzle ORM + PostgreSQL)

## Workflow-Entscheidung: Push vs Migrate

**Prereq für db:push:**
`db:push` ist nur erlaubt, wenn der lokale Setup-Stand `npm run db:push` non-interaktiv und stabil unterstützt.

**Sonst:** "Manual migration script" / `db:sync` (siehe DEVELOPMENT.md)

| Situation | Workflow | Command |
|-----------|----------|---------|
| Lokale Entwicklung, schnelle Iteration | **Push** (nur wenn non-interaktiv) | `npm run db:push` |
| Vor dem Commit, Production-ready | **Migrate** | `npm run db:generate` + `npm run db:migrate` |

### Goldene Regel (präzisiert)

**Eine DB-Instanz gehört genau zu einem Workflow:**
- **Dev-DB:** Entweder Push-only oder Migrate-only (nicht mischen!)
- **Staging/Prod:** Immer Migrate-only

**Niemals `db:push` auf einer DB ausführen, auf der auch `db:migrate` läuft!**

**Environment Safety:**
- Staging/Prod: `DATABASE_POOLER_URL` darf **nicht** für `db:migrate` verwendet werden
- `db:push` nur auf local dev DB

**Optional: Eindeutiges Naming-Pattern:**
```env
DATABASE_URL_DEV_PUSH=...
DATABASE_URL_DEV_MIGRATE=...
DATABASE_URL_STAGING=...
DATABASE_URL_PROD=...
```

## Development Workflow (Lokal)

```bash
# 1. Schema ändern
# backend/src/db/schema/events.ts

# 2. Direkt zur lokalen DB pushen
cd backend && npm run db:push

# 3. Testen und wiederholen
```

## Production Workflow (Staging/Prod)

```bash
# 1. Schema ändern
# backend/src/db/schema/events.ts

# 2. Migration-File generieren
cd backend && npm run db:generate

# 3. Migration-File reviewen
cat backend/src/db/migrations/00XX_*.sql

# 4. Migration ausfuehren
npm run db:migrate

# 5. Committen
git add backend/src/db/
```

### Production Migration Safety (Pflicht)

**Zero-Downtime Regeln:**

1. **Additive-first Strategie:**
   ```
   Spalte hinzufügen (nullable oder mit Default) 
   → deploy 
   → backfill 
   → NOT NULL setzen
   ```

2. **Keine Breaking Changes in einem Schritt:**
   - ❌ Kein `DROP COLUMN` ohne Deprecation-Phase
   - ❌ Keine `ALTER TYPE` ohne Plan (Enums sind heikel)
   - ✅ Indexes in Prod immer `CONCURRENTLY` (wenn möglich)
   - ✅ Große Backfills in Batches (kein Full Table Lock)

3. **Beispiel-Strategie:**
   ```sql
   -- Phase 1: Add nullable column
   ALTER TABLE events ADD COLUMN new_field text;
   
   -- Phase 2: Deploy & Backfill (in Batches)
   UPDATE events SET new_field = 'default' WHERE new_field IS NULL LIMIT 1000;
   
   -- Phase 3: Set NOT NULL (später)
   ALTER TABLE events ALTER COLUMN new_field SET NOT NULL;
   ```

**Backup/Restore Mindeststandard:**

- Vor Prod-Migrate: Sicherstellen, dass ein aktuelles Backup existiert
  - Bei Supabase: PITR/Backups Status prüfen
- Bei riskanten Migrationen: Snapshot/Backup-Job/Manual Export

**Rollback-Policy:**

Drizzle SQL-Migrations sind oft nicht automatisch rückrollbar.

**Jede Migration muss entweder:**
- a) **Reversible** sein (Down-Script vorhanden), oder
- b) Eine klare **"Rollback via forward-fix"** Strategie haben
  - Beispiel: Feature-Flag + neue Migration (add column wieder entfernen)

**Beispiel: Reversible Migration**
```sql
-- Up
ALTER TABLE events ADD COLUMN status text;

-- Down (optional, aber empfohlen für kritische Changes)
ALTER TABLE events DROP COLUMN status;
```

## npm Scripts

```bash
# Development (lokal)
npm run db:push          # Schema direkt pushen (schnelle Iteration)
npm run db:push:force    # Mit --force (Datenverlust möglich!)
npm run db:studio        # Drizzle Studio oeffnen

# Production
npm run db:generate      # Migration-File generieren
npm run db:migrate       # Migrations ausfuehren
npm run db:migrate:check # Status prüfen

# Recovery (bei Problemen)
npm run db:journal:rebuild  # Journal aus SQL-Files neu aufbauen
npm run db:journal:sync     # DB-Tabelle synchronisieren
```

## Supabase Connection Pooler (#781)

**Zwei Connection-Typen:**
| Typ | Env-Variable | Verwendung |
|-----|--------------|------------|
| Direct | `DATABASE_URL` | Migrationen, drizzle-kit, long-running transactions |
| Pooler | `DATABASE_POOLER_URL` | App-Queries (Runtime) |

**Transaction Mode Pooler:**
- Supabase Pooler kann je nach Konfiguration (Transaction/Session) variieren
- **Wichtig:** Transaction Mode Pooler unterstützt keine Prepared Statements!
- **App-Queries:** Pooler ok, `prepare: false` (wenn Pooler aktiv)
- **Migrations:** Immer Direct (niemals Pooler!)
- **Long-running transactions** (z. B. batch jobs): Ggf. direct connection verwenden

**Max Connections / Client Lifecycle:**

**App:**
- Sinnvolle `max` (Pooler übernimmt viel)
- Process shutdown: Cleanup automatisch via Pool

**Migrations:**
- `max: 1` ist gut (eine Migration zur Zeit)
- Process shutdown: `await client.end({ timeout: 5 })` im Script

**Konfiguration in `src/db/index.ts`:**
```typescript
// App nutzt Pooler (falls konfiguriert)
const connectionUrl = env.DATABASE_POOLER_URL || env.DATABASE_URL;
const isPoolerConnection = !!env.DATABASE_POOLER_URL;

const client = postgres(connectionUrl, {
  prepare: !isPoolerConnection, // WICHTIG! Pooler = false
});

// Migrationen nutzen IMMER direkte Connection
export function createMigrationClient() {
  return postgres(env.DATABASE_URL, { 
    max: 1,           // Eine Migration zur Zeit
    prepare: true,    // Direct connection
  });
}
```

**Script Hygiene (backend/scripts):**

Jede Script-Datei muss:
- Explizit `createMigrationClient()` nutzen
- Am Ende `await client.end({ timeout: 5 })` (oder equivalent)

**Beispiel:**
```typescript
import { createMigrationClient } from '../src/db';

async function migrate() {
  const client = createMigrationClient();
  try {
    // Migration logic
  } finally {
    await client.end({ timeout: 5 });
  }
}
```

## Bei Migration-Problemen

**Ursache (meist):**
- Push hat DB-Schema verändert ohne Journal-Record
- Migration-Ordner/Journal driftet (Dateien gelöscht/verschoben)

**Safe-Check vor Repair:**

```bash
# 1. Status prüfen (Migration-Folder vs DB-Tabelle vergleichen)
npm run db:migrate:check

# 2. Erst dann rebuild/sync
npm run db:journal:rebuild
npm run db:journal:sync

# 3. Erneut prüfen
npm run db:migrate:check
```

**Wenn versehentlich gemischt (Push + Migrate):**

1. **Diagnose:**
   ```bash
   npm run db:migrate:check
   # Prüft: Migration-Files vs DB-Tabelle `__drizzle_migrations`
   ```

2. **Recovery:**
   ```bash
   # Journal neu aufbauen (aus SQL-Files)
   npm run db:journal:rebuild
   
   # DB-Tabelle synchronisieren
   npm run db:journal:sync
   
   # Status erneut prüfen
   npm run db:migrate:check
   ```

3. **Wenn nötig:** Cleanup & Reset (nur auf Dev-DB!)
   ```bash
   # VORSICHT: Nur auf lokaler Dev-DB!
   # Migration-Tabelle leeren und neu aufbauen
   ```

## Konventionen

**DB-Ebene (SQL/Columns):**
- Tabellennamen: snake_case, Plural (z.B. `users`, `event_bookings`)
- Spalten: snake_case (z.B. `created_at`, `user_id`)
- Foreign Keys: `[table]_id` Pattern
- IDs: CUID2 (`createId()`)

**TypeScript-Ebene (Properties):**
- **TS Property:** camelCase (z.B. `createdAt`, `updatedAt`)
- **DB Column:** snake_case via `timestamp('created_at')` etc.

**Beispiel:**
```typescript
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  // TS Property: createdAt (camelCase)
  // DB Column: created_at (snake_case)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Regel:** Drizzle mappt automatisch camelCase → snake_case via Column-Name

## Referenz

**Schema-Dokumentation (aufgeteilt):**
- Übersicht: @docs/technik/database-schema.md
- Users & Auth: @docs/technik/database-schema/users-auth.md
- Events & Bookings: @docs/technik/database-schema/events-bookings.md
- Social & Messages: @docs/technik/database-schema/social-messaging.md
- System-Tabellen: @docs/technik/database-schema/system-tables.md

**Workflow-Dokumentation:**
- @docs/entwicklung/DEVELOPMENT.md#database-schema-changes

**Naming-Konventionen:** @docs/entwicklung/naming-conventions.md

---

## Supabase MCP Integration

**Kontext:** `drizzle-kit generate/push` hat wiederkehrende Probleme (MODULE_NOT_FOUND, interaktive Prompts, ESM-Konflikte). Supabase MCP dient als Fallback-Migrations-Tool und primäres Diagnostics-Tool.

**Drizzle bleibt Source of Truth** für Schema-Definition (TypeScript Types, Relations).

### Wann welches Tool?

| Situation | Primaer | Fallback |
|-----------|---------|----------|
| Schema ändern (Types) | `backend/src/db/schema/*.ts` | - |
| Migration generieren | `npm run db:generate` | - |
| Migration ausführen | `npm run db:migrate` | `mcp__supabase__apply_migration` |
| Tabellen prüfen | `npm run db:studio` | `mcp__supabase__list_tables` |
| Schema-Drift diagnostizieren | `npm run db:migrate:check` | `mcp__supabase__list_tables` + `execute_sql` |
| Performance/Security Check | - | `mcp__supabase__get_advisors` |
| Logs prüfen | - | `mcp__supabase__get_logs` |

### Hybrid-Workflow (Empfohlen)

```
1. Schema in backend/src/db/schema/*.ts ändern (Drizzle = SSOT)
2. TRY: npm run db:generate + db:migrate
3. FALLBACK bei Fehler: mcp__supabase__apply_migration (SQL direkt)
4. VERIFY: mcp__supabase__list_tables (Tabelle/Spalte vorhanden?)
5. CHECK: mcp__supabase__get_advisors (RLS, Indexes, Security)
```

### MCP Best Practices

**DO:**
- Idempotente SQL verwenden (`IF NOT EXISTS`, `IF EXISTS`)
- Migration-Name beschreibend wählen (`add_status_to_events`)
- Nach MCP-Migration Drizzle-Schema synchron halten
- `get_advisors` nach Schema-Änderungen ausführen

**DON'T:**
- MCP als primäres Tool nutzen (Drizzle bleibt SSOT)
- Destructive SQL ohne Backup (`DROP TABLE`, `TRUNCATE`)
- MCP auf Production ohne Review

### Idempotenz-Pattern (MCP Migrations)

```sql
-- Spalte hinzufügen (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'status'
  ) THEN
    ALTER TABLE events ADD COLUMN status text DEFAULT 'draft';
  END IF;
END $$;

-- Index hinzufügen (idempotent)
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
```

### Recovery mit MCP

Wenn Drizzle-Migration fehlschlaegt:
1. Fehler analysieren (`get_logs`)
2. SQL manuell anpassen (idempotent!)
3. Via `apply_migration` ausführen
4. Drizzle Journal synchronisieren (`db:journal:rebuild`)
5. Verify mit `list_tables`

---

## Mini-Qualitätsgate

**PR-Checkliste (wenn Schema-Change):**
- [ ] Migration SQL file vorhanden? (oder begründete Ausnahme)
- [ ] Hinweis "Push-only" nur für lokale Iteration, nicht gemerged ohne migrate
- [ ] Zero-Downtime geprüft? (Additive-first, CONCURRENTLY, Batches)
- [ ] Backup vorhanden? (bei riskanten Migrationen)
- [ ] Rollback-Strategie dokumentiert? (Down-Script oder forward-fix)
