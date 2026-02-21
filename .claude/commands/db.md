# Database Workflow

Datenbank-Operationen: Migrations, Schema, Checks.

## WICHTIG: db:push funktioniert NICHT!

`npm run db:push` / `drizzle-kit push` funktioniert in diesem Projekt NICHT zuverlässig (interaktive Prompts, ESM-Konflikte).

**Loesung:** Schema-Änderungen IMMER manuell via SQL-Migration-Script durchfuehren.

Beispiel: `backend/scripts/migrate-login-attempts.ts`

## When to Use / When Not

**Use `/db` when:**
- Schema-Änderungen geplant sind
- Migration-Status unklar ist
- DB-Konsistenz geprüft werden muss
- Schema-Drift vermutet wird

**Do NOT use `/db` when:**
- Nur Daten-Änderungen (INSERT/UPDATE/DELETE) → SQL direkt
- Backups/Restores → separate Tools
- Performance-Tuning → separate Analyse

## Usage
```
/db status             # Schema vs DB Status
/db sync               # Fehlende Spalten (nur ADD COLUMN)
/db migrate            # Migrations ausfuehren
/db studio             # DB Studio oeffnen
/db check              # Konsistenz prüfen

# Supabase MCP (Fallback + Diagnostics)
/db mcp:tables         # Alle Tabellen auflisten (via MCP)
/db mcp:advisors       # Security/Performance-Empfehlungen
/db mcp:apply          # SQL-Migration via MCP ausfuehren
/db mcp:logs           # Datenbank-Logs prüfen
```

## Commands

### /db status
Zeigt Schema vs. Datenbank Diff.

### /db sync
Fuegt fehlende Spalten hinzu (safe, keine DROP).

### /db migrate
Fuehrt neue Migrations aus.

### /db studio
Oeffnet DB GUI (Drizzle Studio o.ae.).

### /db check
Prueft Foreign Keys, Indexes, Enums.

### /db mcp:tables
Listet alle Tabellen via Supabase MCP (`mcp__supabase__list_tables`). Schnelle Verifikation ohne Drizzle Studio.

### /db mcp:advisors
Security/Performance-Report via `mcp__supabase__get_advisors`. Prueft RLS, Indexes, fehlende Constraints.

### /db mcp:apply
Fuehrt SQL-Migration direkt via `mcp__supabase__apply_migration` aus. **Fallback** wenn `db:migrate` fehlschlaegt. SQL muss idempotent sein (`IF NOT EXISTS`).

### /db mcp:logs
Datenbank-Logs prüfen via `mcp__supabase__get_logs`. Hilfreich bei Migration-Fehlern oder Performance-Problemen.

## Schema-Änderung Workflow

**Pflichtreihenfolge (nicht überspringbar):**

1. Schema-Datei ändern (`backend/src/db/schema/*.ts`)
2. TRY: Migration generieren (`npm run db:generate`)
3. Migration prüfen (SQL reviewen)
4. TRY: Migration ausführen (`npm run db:migrate`)
5. FALLBACK bei Fehler: `/db mcp:apply` (SQL direkt via MCP)
6. Verifizieren: `/db mcp:tables` + `/db mcp:advisors`

## Safe Changes

```sql
-- Spalte mit Default
ALTER TABLE x ADD COLUMN y DEFAULT ...;

-- Index (concurrent)
CREATE INDEX CONCURRENTLY ...;
```

## Breaking Changes (Vorsicht!)

```sql
-- Spalte löschen
ALTER TABLE x DROP COLUMN y;

-- Umbenennen
ALTER TABLE x RENAME COLUMN ...;
```

## Troubleshooting

### "Column does not exist"
```
/db sync
```

### Migration Failed
```
/db status
# Manuell korrigieren
```

### Schema Drift
1. `/db status` - Diff sehen
2. `/db sync` - Safe fix
3. Migration wenn komplex

## Definition of Done

Eine Schema-Änderung ist abgeschlossen, wenn:

- ✅ Migration generiert und manuell geprüft
- ✅ Migration erfolgreich ausgeführt (`/db migrate` oder `/db mcp:apply`)
- ✅ Konsistenz-Check bestanden (`/db check`)
- ✅ Tabellen/Spalten verifiziert (`/db mcp:tables`)
- ✅ Security/Performance geprüft (`/db mcp:advisors`)
- ✅ Schema-Drift behoben (`/db status` zeigt keine Diffs)
- ✅ Code angepasst und funktionsfähig
- ✅ Breaking Changes dokumentiert (falls vorhanden)
