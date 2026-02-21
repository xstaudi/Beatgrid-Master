---
name: code-review-expert
description: Code Review Best Practices, Qualitäts-Checklisten, Security-Checks. Verwenden bei /review Command und PR-Reviews.
allowed-tools: Read, Grep, Glob, WebSearch
---

# Code Review Expert

## Quick Reference

| Kategorie | Prüfpunkte |
|-----------|------------|
| **Architektur** | Layer-Trennung, keine Circular Dependencies, Single Responsibility |
| **Security** | Input-Validation, keine Secrets, Auth-Checks, XSS/SQL-Injection |
| **Performance** | N+1 Queries, unnötige Re-Renders, Memory Leaks |
| **Code-Qualität** | TypeScript strict, keine `any`, keine unused Imports |
| **Tests** | Edge Cases, Error Handling, Mocking korrekt |

---

## Review-Prozess

### 1. Architektur-Check
- [ ] Controller dünn (nur Request/Response)
- [ ] Business-Logik im Service
- [ ] Keine DB-Aufrufe in Controllern
- [ ] Imports folgen Layer-Grenzen

### 2. Security-Check
- [ ] User-Input validiert (Zod)
- [ ] Auth/AuthZ korrekt implementiert
- [ ] Keine Secrets im Code
- [ ] SQL/NoSQL-Injection verhindert
- [ ] XSS-Schutz bei User-Content

### 3. Performance-Check
- [ ] Keine N+1 Queries
- [ ] Pagination bei Listen
- [ ] Keine unnötigen Re-Renders (React)
- [ ] Lazy Loading wo sinnvoll

### 4. Code-Qualität
- [ ] TypeScript strict (keine `any` ohne Kommentar)
- [ ] Keine unused Imports/Variablen
- [ ] Konsistente Naming-Konventionen
- [ ] Max 250 Zeilen pro Datei
- [ ] Dokumentation bei komplexer Logik

### 5. Test-Coverage
- [ ] Happy Path getestet
- [ ] Edge Cases abgedeckt
- [ ] Error Handling verifiziert
- [ ] Mocks korrekt (keine Implementation-Details)

### 6. Struktur-Check

**Frontend (Feature-Struktur):**
- [ ] `index.ts` im Feature-Root vorhanden
- [ ] `components/index.ts` vorhanden
- [ ] Keine Deep Imports (nur Barrel Imports)
- [ ] API-Client in `services/[feature].api.ts`
- [ ] Hooks wrappen React Query

**Backend (Modul-Struktur):**
- [ ] `controller.ts` vorhanden (dünn!)
- [ ] `service.ts` vorhanden (einziger DB-Zugriff)
- [ ] `routes.ts` vorhanden
- [ ] `dtos.ts` mit Zod Schemas vorhanden
- [ ] `types.ts` vorhanden
- [ ] Bei >500 LOC: Sub-Services Pattern geprüft

**Naming-Konventionen:**
- [ ] Dateien folgen Naming-Standard (siehe @docs/entwicklung/naming-conventions.md)
- [ ] Components: PascalCase.tsx
- [ ] Hooks: use[Name].ts
- [ ] Services: kebab-case.api.ts

---

## Severity-Levels

| Level | Beschreibung | Aktion |
|-------|--------------|--------|
| 🔴 **Critical** | Security-Lücke, Datenverlust, Crash | Blockiert Merge |
| 🟠 **Important** | Bug, Performance-Problem, Architektur-Verletzung | Sollte gefixt werden |
| 🟡 **Suggestion** | Code-Stil, Minor Improvements | Optional |
| 🟢 **Nitpick** | Formatting, Naming-Präferenzen | Ignorierbar |

---

## Projekt-spezifische Regeln

### Backend (Express + Drizzle)
- Services sind einziger DB-Zugriff
- DTOs für Input-Validation (Zod)
- Explicit Query Shapes (keine `select *`)

### Frontend (React + TanStack Query)
- API-Clients in `services/*.api.ts`
- Hooks wrappen React Query
- Keine Direct API-Calls in Komponenten

---

## Output Format

```markdown
## Code Review: [Scope]

**Typ:** Backend | Frontend | Full-Stack
**Scope:** [Datei/Feature/PR]

### Summary
[1-2 Sätze]

**Merge-Empfehlung:** ✅ Approve | ⚠️ Approve with Changes | ❌ Request Changes

### Critical
- [ ] [Issue] - [Location] - [Fix: Konkrete Aktion]

### Important
- [ ] [Issue] - [Location] - [Fix: Konkrete Aktion]

### Minor
- [ ] [Issue] - [Location] - [Suggestion]

### Positives
- [Was gut ist]
```

---

## Common Issues

### Backend
```typescript
// ❌ Logic im Controller
router.get('/', async (req, res) => {
  const filtered = data.filter(...);
});

// ✅ Logic im Service
router.get('/', async (req, res) => {
  const data = await Service.getFiltered();
});
```

### Frontend
```tsx
// ❌ Fehlende UI States
if (data) return <List data={data} />;

// ✅ Alle UI States
if (isLoading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
return <List data={data} />;
```

---

## Wann aktiv

Code Review, PR-Review, `/review` Command, Qualitäts-Prüfung vor Merge.
