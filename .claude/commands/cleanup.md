# /cleanup - Dead Code Detection & Code Quality Cleanup

Systematisches Cleanup von Dead Code, unbenutzten Imports und Code-Qualitätsproblemen.

---

## Quick Start

| Variante | Beschreibung |
|----------|--------------|
| `/cleanup` | Scan-only (Default) - findet Probleme, ändert nichts |
| `/cleanup fix` | Mit Auto-Fix - behebt auto-fixbare Issues |
| `/cleanup --frontend` | Nur Frontend scannen |
| `/cleanup --backend` | Nur Backend scannen |

---

## Workflow

### Phase 1: Scan

**1.1 ESLint prüfen**
```bash
# Frontend
npm run lint --workspace=frontend 2>&1 | head -100

# Backend
npm run lint --workspace=backend 2>&1 | head -100
```

**1.2 TypeScript Type-Check**
```bash
# Frontend
npm run type-check --workspace=frontend 2>&1 | head -50

# Backend
npm run type-check --workspace=backend 2>&1 | head -50
```

**1.3 TODO/FIXME Inventur**
```bash
# Alle TODOs und FIXMEs finden
grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" frontend/src backend/src | head -30
```

### Phase 2: Analyse

**Gruppiere Findings nach:**

| Kategorie | Beispiele | Auto-Fix? |
|-----------|-----------|-----------|
| **Unused Imports** | `import { X } from 'y'` (X nicht verwendet) | ✅ Ja |
| **Unused Variables** | `const x = 1` (x nicht verwendet) | ⚠️ Prüfen |
| **Type Errors** | `Property 'x' does not exist` | ❌ Manuell |
| **Console Logs** | `console.log()` in Production | ✅ Ja |
| **Any Types** | Ungetypte `any` ohne Kommentar | ❌ Manuell |
| **TODO/FIXME** | Alte/vergessene TODOs | ❌ Manuell |

**Risk Assessment:**
- 🟢 **Safe**: Unused imports, console.log → Auto-Fix OK
- 🟡 **Review**: Unused variables → Könnte Getter/Side-Effect sein
- 🔴 **Manual**: Type errors, any → Braucht Kontext

### Phase 3: Fix (nur bei `/cleanup fix`)

**Vor jedem Fix:**
1. User-Bestätigung einholen für destructive Actions
2. Nur 🟢 Safe Issues automatisch fixen
3. 🟡 Review Issues einzeln bestätigen lassen

**Auto-Fix ausführen:**
```bash
# ESLint Auto-Fix
npm run lint --workspace=frontend -- --fix
npm run lint --workspace=backend -- --fix
```

---

## Output-Format

```markdown
## Cleanup Report

### Scan Summary
| Bereich | Issues | Auto-Fixable | Manual |
|---------|--------|--------------|--------|
| Frontend | 12 | 8 | 4 |
| Backend | 5 | 3 | 2 |

### Unused Imports (8 files)
- `frontend/src/features/events/EventCard.tsx:3` - unused `useState`
- `backend/src/modules/auth/service.ts:5` - unused `logger`
...

### Type Errors (4 issues)
- `frontend/src/features/dashboard/...` - Property 'x' missing
...

### TODOs (3 items)
- `backend/src/modules/events/service.ts:142` - TODO: Add caching
...

### Empfehlung
- [x] 8 Auto-Fix Issues können mit `/cleanup fix` behoben werden
- [ ] 4 Issues brauchen manuelle Review
```

---

## Sicherheitsregeln

### NIEMALS blind löschen:

1. **Getters/Setters** - `const value = obj.getter` könnte Side-Effects haben
2. **Error Handlers** - `catch (error)` unused ist oft OK
3. **Event Listeners** - `onClick={handler}` - handler muss existieren
4. **Exported Functions** - Könnte extern verwendet werden
5. **React Hooks** - `useEffect` ohne Return ist valide

### Stop-the-Line Kriterien:

- Mehr als 20 Type Errors → Erst Type-Check fixen
- Breaking Changes erkannt → User fragen
- Unbekanntes Pattern → Als 🟡 Review markieren

---

## Beispiel-Session

```
User: /cleanup

Claude: Starte Cleanup-Scan...

## Phase 1: Scan

### ESLint Frontend
✅ 3 unused imports gefunden
✅ 1 console.log gefunden

### ESLint Backend
✅ 2 unused imports gefunden

### TypeScript
✅ 0 Type Errors

### TODOs
📋 2 TODOs gefunden

## Cleanup Report

| Bereich | Issues | Auto-Fixable |
|---------|--------|--------------|
| Frontend | 4 | 4 |
| Backend | 2 | 2 |

### Findings

**Unused Imports (5):**
- `EventCard.tsx:3` - unused `useState` 🟢
- `useAuth.ts:1` - unused `useCallback` 🟢
- `service.ts:5` - unused `logger` 🟢
...

**Console Logs (1):**
- `debug.ts:42` - `console.log('test')` 🟢

**TODOs (2):**
- `service.ts:142` - TODO: Add caching 📋
- `hooks.ts:55` - FIXME: Race condition 📋

---

Möchtest du die 6 auto-fixbaren Issues beheben?
→ Antworte mit `/cleanup fix` oder bestätige einzeln.
```

---

## Verwandte Commands

| Command | Beschreibung |
|---------|--------------|
| `/audit-docs` | Dokumentations-Audit |
| `/test` | Tests ausführen |
| `/commit` | Änderungen committen |

---

## Technische Details

### Genutzte ESLint Rules
- `unused-imports/no-unused-imports` (ERROR)
- `no-console` (ERROR)
- `@typescript-eslint/no-explicit-any` (WARN)

### Genutzte TypeScript Flags
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `strict: true`
