# Code Review durchfuehren

Systematisch Code-Qualität, Sicherheit, Architektur-Konformitaet und **UI/UX** prüfen.

**⚠️ Review-Policy:** Bewertungskriterien, Severity-Definition und Merge-Regeln siehe `code-reviewer.md` Agent.

**Output:** Code Review Report mit priorisierten Findings und Merge-Empfehlung

## Default Workflow

```
/work #123
  -> Plan + Umsetzung

/review [path]
  -> Code Review durchfuehren

[Bei Critical/Important]
  -> Fixe einarbeiten, erneut prüfen
```

## Quick Start

1. `/review` → Letzte Änderungen prüfen
2. `/review [path]` → Spezifisches Feature/Modul
3. `/review pr` → PR-Diff vor Merge

## Usage

```
/review                # Zuletzt geänderte Dateien (Quick Review)
/review [path]         # Spezifische Datei(en) oder Feature-Pfad
/review pr             # Aktueller PR-Diff (Pre-Merge Review)
```

**Wann welches Kommando:**
- `/review` → Nach lokalen Änderungen, schneller Check
- `/review [path]` → Fokus auf bestimmtes Feature/Modul
- `/review pr` → Vor Merge, vollständiger Pre-Merge Review

## Review-Perspektiven (10 Kategorien)

**Vollständige Checklisten:** Siehe `code-reviewer.md` Agent

| # | Kategorie | Scope | Severity bei Verstoß |
|---|-----------|-------|---------------------|
| 1 | **Architektur** | Layer-Grenzen, Dependencies | Important |
| 2 | **TypeScript** | Typsicherheit, Zod-Schemas | Important |
| 3 | **Security** | Auth, Injection, IDOR | Critical |
| 4 | **Performance** | N+1, Re-Renders, Indexes | Important |
| 5 | **Error Handling** | Try/Catch, User-Feedback | Important |
| 6 | **Clean Code** | Dateigröße, Naming, DRY | Minor |
| 7 | **Documentation** | architecture.md, CHANGELOG | Important |
| 8 | **Accessibility** | WCAG 2.1 AA, Keyboard, ARIA | Important/Critical |
| 9 | **UI/UX & Design System** | Tokens, States, Responsive | Important |
| 10 | **Visual Changes** | Screenshots, Dark Mode | Minor |
| 11 | **Struktur-Konformität** | Feature/Modul-Struktur, Naming | Important |

**Frontend-Änderungen:** Kategorien 8-11 sind Pflicht!
**Backend-Änderungen:** Kategorie 11 ist Pflicht!

## Output Format

```markdown
## Code Review: [Scope]

**Datum:** [Heute]
**Reviewer:** [Name]
**Scope:** [Datei/Feature/PR]
**Typ:** Backend | Frontend | Full-Stack

### Summary
[1-2 Saetze Gesamteinschaetzung]

**Merge-Empfehlung:** ✅ Approve | ⚠️ Approve with Changes | ❌ Request Changes

---

### Critical (Blocker)
- [ ] [Issue] - [Location] - [Fix]

### Important (Sollte fixen)
- [ ] [Issue] - [Location]

### Minor (Optional)
- [ ] [Suggestion]

---

### Backend (wenn relevant)
- [ ] Layer-Grenzen eingehalten
- [ ] Auth/Permissions korrekt
- [ ] Input-Validation (Zod)
- [ ] Error-Handling vollständig

### Frontend (wenn relevant)

**UI States:**
- [ ] Loading State vorhanden (Skeleton)
- [ ] Error State vorhanden (Actionable)
- [ ] Empty State vorhanden (CTA)
- [ ] Success Feedback (Toast/Redirect)

**Design System (styling-rules.md):**
- [ ] Design Tokens verwendet (keine hardcoded Farben)
- [ ] Keine verbotenen Patterns (rounded corners, etc.)
- [ ] shadcn/ui Komponenten bevorzugt

**Responsive:**
- [ ] Mobile getestet (< 640px)
- [ ] Tablet getestet (768px)
- [ ] Desktop getestet (1024px+)

**Accessibility:**
- [ ] Keyboard-Navigation funktioniert
- [ ] Focus-States sichtbar
- [ ] ARIA-Labels korrekt
- [ ] Kontrast ausreichend

**Form UX (wenn Forms vorhanden):**
- [ ] Validation-Timing korrekt
- [ ] Error-Messages klar
- [ ] Submit-States korrekt

---

### Struktur-Konformität (Pflicht bei neuen Features/Modulen)

**Frontend Feature-Struktur:**
- [ ] `index.ts` im Feature-Root vorhanden
- [ ] `components/index.ts` vorhanden
- [ ] Keine Deep Imports (nur Barrel Imports)
- [ ] API-Client in `services/[feature].api.ts`

**Backend Modul-Struktur:**
- [ ] `controller.ts` vorhanden (dünn!)
- [ ] `service.ts` vorhanden (einziger DB-Zugriff)
- [ ] `routes.ts` vorhanden
- [ ] `dtos.ts` mit Zod Schemas vorhanden
- [ ] `types.ts` vorhanden

**Naming-Konventionen:**
- [ ] Dateien folgen Naming-Standard

### Docs Check (Pflicht)
- [ ] Docs aktualisiert? (architecture.md, api-reference.md)
- [ ] CHANGELOG bei Major Features?

### Visual Changes (bei UI-Änderungen)
- [ ] Screenshots beigefuegt?
- [ ] Dark Mode geprüft?

### Positives
- ...
```

## Severity & Merge-Entscheidung

**Severity-Definition & Merge-Regeln:** Siehe `code-reviewer.md` Agent

| Level | Aktion | Merge-Status |
|-------|--------|--------------|
| Critical | Blocker | ❌ Request Changes |
| Important | Sollte fixen | ⚠️ Approve with Changes |
| Minor | Optional | ✅ Approve |

**Stop-the-Line (automatisch Request Changes):**
- Security-Issue (SQL Injection, XSS, IDOR)
- Fehlende Keyboard-Navigation (A11y Critical)
- Datenverlust-Risiko
- Breaking Change ohne Dokumentation

## Definition of Done (DoD) - Review ist abgeschlossen

Ein Review gilt als abgeschlossen, wenn:

### Alle Perspektiven geprüft
- [x] **Backend:** Architektur, Security, Performance, Error Handling
- [x] **Frontend:** UI States, Design System, Responsive, A11y
- [x] **Full-Stack:** Beide Bereiche + API-Contract

### Findings dokumentiert
- [x] Alle Critical/Important Issues im Report
- [x] Konkrete Fix-Vorschläge (nicht nur "refactor")
- [x] Location angegeben (Datei:Zeile)

### Merge-Empfehlung getroffen
- [x] Basierend auf Severity-Modell
- [x] Explizit dokumentiert (Approve / Approve with Changes / Request Changes)

### UI/UX geprüft (bei Frontend-Änderungen)
- [x] Alle 4 UI States vorhanden
- [x] Design System Konsistenz
- [x] Responsive getestet
- [x] A11y Basis-Checks

**Dann:** Review-Status setzen (approved/changes requested)

## Quick Review Checkliste (60 Sekunden)

Für schnelle PR-Übersicht:

### Backend
- [ ] Auth-Middleware gesetzt?
- [ ] Input validiert (Zod)?
- [ ] Layer-Grenzen eingehalten?
- [ ] Error-Handling vorhanden?

### Frontend
- [ ] Loading/Error/Empty States?
- [ ] Design Tokens (keine Hex-Werte)?
- [ ] Keyboard-Navigation?
- [ ] Mobile getestet?

### Allgemein
- [ ] Tests vorhanden/angepasst?
- [ ] Docs aktualisiert?
- [ ] Keine Secrets im Code?

## Hinweise

- **Review-Policy:** Alle Bewertungskriterien, Severity-Definition und Merge-Regeln siehe `code-reviewer.md` Agent
- **Merge-Empfehlung explizit:** Immer klar dokumentieren
- **Review-Output im Issue/PR:** Output-Format als Kommentar posten für Nachvollziehbarkeit
- **Screenshots bei UI-Änderungen:** Before/After empfohlen
- **Design System:** styling-rules.md ist Source of Truth für Farben/Tokens

## Referenzen

- **Review-Policy:** `.claude/agents/code-reviewer.md`
- **Review-Skill:** `.claude/skills/Code Review Expert.md`
- **Design System:** `docs/entwicklung/styling-rules.md`
- **Engineering Rules:** `docs/entwicklung/engineering-rules.md`
- **Frontend Patterns:** `.claude/agents/frontend-developer.md`
- **A11y Details:** `.claude/agents/ui-ux-designer.md`
- **Dokumentations-Index:** `context.md`
- **Feature-Struktur (Frontend):** `docs/entwicklung/feature-structure.md`
- **Modul-Struktur (Backend):** `docs/entwicklung/module-structure.md`
- **Naming-Konventionen:** `docs/entwicklung/naming-conventions.md`
