---
name: database-expert
description: Database und ORM Best Practices. Verwenden bei Schema-Design, Migrations, Queries, Relations, Joins, Indexes, Performance, PostgreSQL, Drizzle, Prisma.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Database Expert

## Quick Reference

**Schema:** FK + timestamps + constraints (uniqueIndex, check)
**Queries:** Explicit shapes (kein `select *`) + pagination mit stabilen Sort Keys
**Performance:** Avoid N+1 + EXPLAIN ANALYZE bei langsamen Queries
**Migrations:** `db:push` lokal, `db:generate + migrate` Production

---

## Schema Essentials

```typescript
// Tabelle + Relations + Types
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, { fields: [items.userId], references: [users.id] }),
}));

export type Item = typeof items.$inferSelect;
```

**Referential Actions:**
- Join Tables → `CASCADE`
- Core Tables → `RESTRICT`
- Optional → `SET NULL`

**Constraints:**
```typescript
uniqueIndex('items_user_item_idx').on(items.userId, items.itemId);
```

---

## Query Patterns

**Explicit Shapes (Pflicht):**
```typescript
// ❌ Vage
const all = await db.select().from(items);

// ✅ Explizit
const all = await db.select({
  id: items.id,
  name: items.name,
}).from(items);
```

**Relations:**
```typescript
await db.query.items.findFirst({
  where: eq(items.id, id),
  with: { user: { columns: { id: true, username: true } } },
});
```

**Joins:**
```typescript
await db.select({
  item: { id: items.id, name: items.name },
  user: { username: users.username },
}).from(items).innerJoin(users, eq(items.userId, users.id));
```

---

## Mutations

**Locking (Pflicht bei Counters/Limits):**
```typescript
// Atomares Update mit Guard
const result = await db.update(events)
  .set({ capacityRemaining: sql`${events.capacityRemaining} - 1` })
  .where(and(
    eq(events.id, eventId),
    gt(events.capacityRemaining, 0) // Guard!
  ))
  .returning();

if (result.length === 0) throw new Error('Capacity exhausted');
```

**Transactions:**
```typescript
await db.transaction(async (tx) => {
  const [item] = await tx.insert(items).values({...}).returning();
  await tx.insert(itemTags).values({ itemId: item.id, tagId });
});
```

---

## Performance

**N+1 vermeiden:**
```typescript
// ❌ N+1
for (const item of items) {
  item.user = await db.select().from(users).where(eq(users.id, item.userId));
}

// ✅ Single Query
await db.query.items.findMany({ with: { user: true } });
```

**Pagination (Cursor mit stabilen Sort Keys):**
```typescript
// Sortiere nach (created_at DESC, id DESC)
.where(or(
  lt(items.createdAt, cursorDate),
  and(eq(items.createdAt, cursorDate), lt(items.id, cursorId))
))
.orderBy(desc(items.createdAt), desc(items.id))
.limit(20)
```

**Indexes:**
```sql
-- FK, WHERE, ORDER BY
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_status ON items(status);

-- Composite (Filter + Sort)
CREATE INDEX idx_items_status_created ON items(status, created_at DESC);

-- CONCURRENTLY in Production (kein Lock)
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

**EXPLAIN ANALYZE (bei langsamen Queries):**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM items WHERE status = 'active' LIMIT 20;
```

---

## Migration Workflow

### Wann welches Tool?

| Tool | Wann | Vorteil |
|------|------|---------|
| `db:generate + db:migrate` | Standard-Workflow | Journal + SQL synchron |
| `mcp__supabase__apply_migration` | Drizzle schlaegt fehl | Direkte SQL-Ausführung |
| `mcp__supabase__list_tables` | Verifikation | Schneller Check ohne Studio |
| `mcp__supabase__get_advisors` | Nach Schema-Änderung | RLS + Index-Empfehlungen |

### Development (lokal)
```bash
npm run db:push      # Schema direkt syncen, schnelle Iteration
npm run db:studio    # Prüfen ob alles da ist
```

### Production/Staging
```bash
npm run db:generate  # Migration-File + Journal erstellen
npm run db:validate  # Prüfen ob Journal synchron
npm run db:migrate   # Migrationen ausfuehren
# Bei Fehler: mcp__supabase__apply_migration als Fallback
# Verify: mcp__supabase__list_tables
```

**Checkliste (Production):**
- [ ] Run on staging first
- [ ] Idempotent (Safe Guards)
- [ ] Index CONCURRENTLY in Production
- [ ] Rollback plan
- [ ] `mcp__supabase__get_advisors` nach Migration prüfen

### Cloudflare Workers (zukünftig)
- Hyperdrive für Connection-Pooling
- `max: 5` Connections (Workers-Limit)
- `ctx.waitUntil(sql.end())` für Cleanup

---

## Wann aktiv

Schema, Migrations, Queries, Relations, Indexes, DB Performance.
