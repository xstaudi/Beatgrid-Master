# Issue-Workflow starten

Startet den Issue-Orchestrator für strukturierte Issue-Abarbeitung.

---

## Quick Start

**Willst du nur wissen, was als Nächstes zu tun ist?**
→ `/work`

**Willst du ein bestimmtes Issue bearbeiten?**
→ `/work #123`

**Willst du nur priorisieren, ohne Umsetzung?**
→ `/work scan`

---

## Usage

```
/work                    # Scannt Issues, priorisiert nach Arbeitsplan
/work #123               # Arbeitet direkt an Issue #123
/work #123 --team        # Issue mit Agent Teams (parallel) bearbeiten
/work scan               # Nur Scan + Priorisierung, keine Umsetzung
/work phase              # Zeigt aktuelle Phase aus Arbeitsplan
/work next               # Naechstes Issue aus aktueller Phase
```

## Model-Switching

🔒 **Regel: Ohne korrektes Model kein Start**

**VOR dem Start eines Issues IMMER das model-Label prüfen!**

```bash
# Model-Label aus Issue auslesen
gh issue view <nummer> --json labels --jq '.labels[].name | select(startswith("model:"))'
```

### Entscheidungslogik

ℹ️ **Model-Auswahl:**

| Label            | Aktion                                |
| ---------------- | ------------------------------------- |
| `model:sonnet`   | User auffordern zu Sonnet zu wechseln |
| `model:opus`     | Mit Opus fortfahren (Standard)        |
| Kein model-Label | Mit Opus fortfahren (Default)         |

### Bei model:sonnet Issue

⚠️ **Wechsel zu Sonnet empfohlen:**

```markdown
## Model-Hinweis

Dieses Issue hat das Label `model:sonnet`.

Bitte wechsle zu Claude Sonnet für dieses Issue:

- Einfachere Tasks sind mit Sonnet kosteneffizienter
- Sonnet ist schneller bei UI-Komponenten, Bug-Fixes, Styling

**Aktion:** `/model sonnet` oder neuen Chat mit Sonnet starten

Soll ich trotzdem mit Opus fortfahren? (nicht empfohlen)
```

### Bei model:opus oder keinem Label

✅ **Mit Opus fortfahren** - kein Hinweis nötig.

## Arbeitsplan-Integration

🔒 **Regel: Vor jeder Issue-Arbeit Arbeitsplan laden!**

**Vor jeder Issue-Arbeit:** Arbeitsplan laden und beruecksichtigen!

```bash
# Arbeitsplan lesen
cat docs/planung/arbeitsplan.md
```

### Phasen-Reihenfolge beachten

ℹ️ **Reihenfolge aus Arbeitsplan:**
Der Arbeitsplan definiert die Implementierungsreihenfolge:

1. **Phase 1: Blocker** - Security, Launch-kritisch (ZUERST!)
2. **Phase 2-5: MVP** - Nach Domain priorisiert
3. **Phase 6-7: Beta** - Stabilisierung
4. **Phase 8: Launch** - Polish

🔒 **Regel:** Issues aus frueheren Phasen haben IMMER Vorrang!

### Kontext aus docs/planung/

ℹ️ **Verfügbare Planungs-Dokumente:**

```
docs/planung/
├── arbeitsplan.md      # Phasen, Reihenfolge, Filter-Befehle
└── [weitere Plaene]    # Spezifische Planungen
```

---

## Workflow - Übersicht

```
/work → Scan → Plan → Freigabe → Implement → Test → Docs → Close
```

**Details:** Siehe vollständiges Workflow-Diagramm unten.

---

## Was dieser Command macht

### Ohne Parameter (`/work`)

ℹ️ **Automatische Priorisierung:**

1. **Laedt Arbeitsplan** aus docs/planung/arbeitsplan.md
2. **Identifiziert aktuelle Phase** (erste Phase mit offenen Issues)
3. **Scannt** relevante GitHub Issues für diese Phase
4. **Priorisiert** nach Arbeitsplan-Reihenfolge
5. **Schlaegt vor** welches Issue als nächstes bearbeitet werden soll
6. **Erstellt Plan** für das vorgeschlagene Issue
7. **Wartet auf Freigabe** bevor Umsetzung startet

### Mit Issue-Nummer (`/work #123`)

ℹ️ **Direkte Issue-Bearbeitung:**

1. **Prueft model-Label** - Bei `model:sonnet` User zum Wechsel auffordern
2. **Prueft** ob Issue zur aktuellen Phase gehört (Warnung wenn nicht)
3. **Laedt** Issue #123 direkt
4. **Erstellt Plan** mit Scope, Änderungen, Risiken, Testplan
5. **Wartet auf Freigabe**
6. **Delegiert** an spezialisierte Agents
7. **Fuehrt Tests** durch
8. **Schliesst Issue** mit Dokumentation

---

## Workflow-Phasen (Detail)

```
/work
  │
  ▼
┌─────────────────────────────────────┐
│ 0. CONTEXT-BUDGET PRUEFEN           │
│    - Fuehre /context aus            │
│    - >80%: Warnung ausgeben         │
│    - >90%: Abbruch empfehlen        │
│    - >95%: Automatischer Stop       │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 1. ARBEITSPLAN LADEN                │
│    - docs/planung/arbeitsplan.md    │
│    - Aktuelle Phase identifizieren  │
│    - Filter-Befehle aus Plan nutzen │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 1.5 MODEL-CHECK (bei /work #XXX)    │
│    - model-Label aus Issue lesen    │
│    - model:sonnet → User auffordern │
│    - model:opus/kein → fortfahren   │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 2. SCAN                             │
│    - Issues der aktuellen Phase     │
│    - Filter aus Arbeitsplan nutzen  │
│    - Duplikate erkennen             │
│    - Abhaengigkeiten mappen         │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 3. PRIORISIERUNG                    │
│    - Arbeitsplan-Reihenfolge first  │
│    - Dann Score (0-100)             │
│    - Blocker immer zuerst           │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 4. PLAN (Freigabe erforderlich!)    │
│    - Issue-Beschreibung (Was/Warum) │
│    - Vor- und Nachteile des Ansatzes│
│    - Ziel/Outcome                   │
│    - Scope (drin/nicht drin)        │
│    - Betroffene Dateien             │
│    - Risiken + Mitigation           │
│    - Testplan (inkl. Chrome-Test)   │
│    - Betroffene Docs auflisten      │
│    - Context-Check nach Agent-Spawn │
└─────────────────────────────────────┘
  │
  ▼
⚠️ ENTSCHEIDUNGSPUNKT: Plan freigeben?
  │
  ▼ [User: "ja" / "OK, mach"]
┌─────────────────────────────────────┐
│ 4.5 AGENT TEAMS CHECK (optional)    │
│    - Full-Stack Issue (BE+FE)?     │
│    - User hat --team Flag gesetzt? │
│    - Ja → Agent Teams Workflow     │
│    - Nein → Standard-Implementation│
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 5. IMPLEMENTATION                   │
│    a) Standard: Delegiert an Agents │
│       - Backend/Frontend/etc.       │
│       - Code-Review automatisch     │
│       - Nach jedem Agent: Ctx-Check │
│    b) Agent Teams: Parallel Spawnen │
│       - Contract definieren         │
│       - File Ownership zuweisen     │
│       - Agents parallel starten     │
│       - Integration nach Abschluss  │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 6. TEST (PFLICHT!)                  │
│    - Build/Lint/TypeCheck           │
│    - Playwright E2E-Test via /e2e   │
│      (automatisch + Screenshots)    │
│    - Fallback: Chrome via MCP       │
│      (bei Playwright-Fehlern)       │
│    - Testfaelle aus Plan abarbeiten │
│    - Screenshots bei Fehlern        │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 7. DOKUMENTATION (PFLICHT!)         │
│    - docs/technik/architecture.md   │
│    - docs/technik/api-reference.md  │
│    - docs/technik/security.md       │
│    - docs/technik/database-schema.md│
│    - ../CHANGELOG.md (Root)         │
│    - Nur betroffene Docs updaten    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 8. ABSCHLUSS                        │
│    - KEIN Commit, KEIN Push!        │
│    - KEIN `gh issue close`!         │
│    - User informieren: `/done #XX`  │
│      für Commit+Push+Close nutzen  │
│    - Naechstes Issue vorschlagen    │
└─────────────────────────────────────┘
  │
  ▼
⚠️ ENTSCHEIDUNGSPUNKT: Nächstes Issue aus Phase bearbeiten?
  │
  ▼ [User: "ja" → zurück zu Schritt 1]
```

---

## Arbeitsplan-Befehle

ℹ️ **Fertige Filter-Befehle:**
Der Arbeitsplan enthält fertige Filter-Befehle:

```bash
# Phase 1: Blocker
gh issue list --label "status:blocker" --state open

# Phase 2: MVP theweekend
gh issue list --milestone "MVP" --label "domain:theweekend" --state open

# Phase 3: MVP Shared
gh issue list --milestone "MVP" --label "domain:shared" --state open
```

**Diese Befehle direkt aus dem Arbeitsplan nutzen!**

---

## Delegierte Agents

ℹ️ **Verfügbare Agent-Rollen:**

| Agent                | Wann                | Aufgabe                        |
| -------------------- | ------------------- | ------------------------------ |
| `backend-architect`  | API/DB-Änderungen  | Service, Controller, Migration |
| `frontend-developer` | UI-Änderungen      | Komponenten, Hooks, Styling    |
| `debugger`           | Tests fehlschlagen  | Root Cause, Fix                |
| `code-reviewer`      | Nach Implementation | Qualitäts-Check               |

### Agent Teams Modus (--team)

Bei `--team` Flag oder wenn das Issue als Full-Stack erkannt wird (Labels `bereich:backend` + `bereich:frontend`):

**Schritt 4.5 im Workflow:**

1. API-Contract (Types/DTOs) definieren
2. File-Ownership-Map erstellen (Backend-Agent vs Frontend-Agent)
3. Template aus `.claude/prompts/teams/` laden:
   - Full-Stack → `full-stack-feature.md`
   - Review-fokussiert → `parallel-review.md`
   - Refactoring → `cross-module-refactoring.md`
4. Agents parallel spawnen
5. Nach Abschluss: Integration + Build Check + Code Review

**Vorschlag-Logik:**

```
Wenn Issue Labels enthalten:
  bereich:backend UND bereich:frontend → "Agent Teams empfohlen (Full-Stack)"
  bereich:backend (3+ Module betroffen) → "Agent Teams empfohlen (Cross-Modul)"
Sonst:
  Standard-Implementation (sequenziell)
```

⚠️ **Agent Teams ist optional** - User entscheidet ob parallel oder sequenziell.

---

## Stop-the-Line

⛔ **Der Orchestrator stoppt automatisch bei:**

Der Orchestrator stoppt automatisch bei:

- Issue gehört nicht zur aktuellen Phase (Warnung)
- Unklaren Akzeptanzkriterien
- Security/Permission-Fragen
- Riskanten DB-Änderungen
- Breaking Changes
- Scope Creep

---

## Beispiel-Session

```
> /work #245

Prüfe model-Label für Issue #245...
Label gefunden: model:sonnet

## Model-Hinweis

Dieses Issue hat das Label `model:sonnet`.

Bitte wechsle zu Claude Sonnet für dieses Issue:
- Einfachere Tasks sind mit Sonnet kosteneffizienter
- Sonnet ist schneller bei UI-Komponenten, Bug-Fixes, Styling

**Aktion:** `/model sonnet` oder neuen Chat mit Sonnet starten

Soll ich trotzdem mit Opus fortfahren? (nicht empfohlen)

> [User wechselt zu Sonnet]
```

```
> /work #600

Prüfe model-Label für Issue #600...
Label gefunden: model:opus

Mit Opus fortfahren (korrektes Model für komplexes Issue).

Lade Arbeitsplan aus docs/planung/arbeitsplan.md...

## Aktuelle Phase: Phase 1 - Blocker

## Plan für Issue #600: Login Rate Limiting

### Beschreibung
Login-Endpoint hat kein Rate Limiting. Brute-Force-Angriffe sind
ungebremst möglich. OWASP empfiehlt max 5 Versuche pro Minute.

### Vor- und Nachteile
| | Pro | Contra |
|---|-----|--------|
| Express-Rate-Limit | Einfach, bewaehrt, keine Deps | Nur In-Memory, kein Cluster |
| Redis-basiert | Cluster-faehig, persistent | Redis-Dependency noetig |
→ **Empfehlung:** Express-Rate-Limit (reicht für aktuellen Scale)

### Umsetzung
- Ziel: Rate Limiting für Login implementieren
- Scope: Backend auth/routes.ts
- Risiko: Keine Breaking Changes
- Testplan: Login-Rate-Limit-Test

⚠️ ENTSCHEIDUNGSPUNKT: Plan freigeben?
> ja

⚠️ ENTSCHEIDUNGSPUNKT: Implementierung starten?
> mach
```

```
> /work

Lade Arbeitsplan aus docs/planung/arbeitsplan.md...

## Aktuelle Phase: Phase 1 - Blocker
6 Issues in dieser Phase

Scanne Issues mit: gh issue list --label "status:blocker" --state open

## Phase 1 Issues
| # | Titel | Model | Status |
|---|-------|-------|--------|
| 600 | Security: Login Rate Limiting | opus | Open |
| 604 | Security: Secure Password Reset | opus | Open |
| 245 | UI: Filter Component | sonnet | Open |

## Empfehlung: Issue #600 (erstes opus-Issue in Phase)

Begründung: Security-Blocker mit model:opus haben hoechste Prioritaet

Soll ich einen Plan für #600 erstellen?
> ja

## Plan für Issue #600
...
⚠️ ENTSCHEIDUNGSPUNKT: Plan freigeben?
> ja

⚠️ ENTSCHEIDUNGSPUNKT: Implementierung starten?
> mach

[Implementiert...]
[Testet...]
[Docs aktualisiert...]

✅ Implementation für #600 abgeschlossen!

Naechster Schritt: `/done #600` ausfuehren für Commit + Push + Issue Close.

Oder: Naechstes Issue aus Phase bearbeiten? (#604)

```

```
> /work #700 --team

Prüfe model-Label für Issue #700...
Label: model:opus, bereich:backend, bereich:frontend

## Agent Teams empfohlen (Full-Stack)

Issue #700 betrifft Backend UND Frontend.
Agent Teams ermöglicht parallele Implementierung.

### API-Contract
- POST /api/tickets/purchase → { ticketId, status }
- GET /api/tickets/:id → { ticket, event, user }

### File Ownership
- Agent 1 (Backend): backend/src/modules/ticketing/**
- Agent 2 (Frontend): frontend/src/features/ticketing/**

⚠️ Agent Teams starten?
> ja

[Agent 1: Backend-Implementierung...]
[Agent 2: Frontend-Implementierung...]
[Integration + Build Check...]
[Code Review...]
[Docs aktualisiert...]

✅ Implementation für #700 abgeschlossen!

Naechster Schritt: `/done #700` ausfuehren für Commit + Push + Issue Close.
```

---

## Regeln

🔒 **Pflichtregeln:**

- **KEIN Commit/Push/Close in /work!** - Nur `/done` darf committen, pushen und Issues schliessen
- **Context-Budget Check** - Bei Start + nach jedem Agent-Spawn prüfen (>80% = Warnung, >90% = Abbruch empfehlen)
- **Model-Check** - Bei `model:sonnet` User zum Wechsel auffordern
- **Arbeitsplan ist fuehrend** - Phasen-Reihenfolge einhalten
- **E2E-Test** - Playwright E2E-Test via /e2e vor Abschluss (Fallback: Chrome via MCP)
- **Dokumentation** - Betroffene Docs aktualisieren

✅ **Best Practices:**

- Immer Plan-Freigabe vor Umsetzung
- Kein Scope Creep (neue Features -> neues Issue)
- Issue erst nach erfolgreichem Test + Doku schliessen
- Nach Issue-Abschluss: Nächstes aus DERSELBEN Phase vorschlagen
- Bei Full-Stack Issues: Agent Teams vorschlagen (--team Flag)
- Bei Agent Teams: Immer Contract + File Ownership VOR Spawn definieren

---

## E2E-Test Ablauf

🔒 **Pflicht:** E2E-Test vor jedem Issue-Abschluss

### Primär: Playwright E2E via /e2e

Der Standard-Weg ist der Playwright E2E-Test via `/e2e`:

```
/e2e                    # Vollständiger E2E-Test
/e2e /dashboard         # Spezifische Route testen
/e2e --debug            # Mit Debug-Modus
```

**Vorteile:**

- Automatisch ausführbar (ohne manuelle Interaktion)
- Screenshots bei Fehlern
- Konsistente Test-Logs
- Parallele Test-Ausführung möglich

### Fallback: Chrome via MCP

Bei Playwright-Fehlern oder wenn Browser-Kontext wichtig ist:

```
1. tabs_context_mcp      → Tab-Kontext holen
2. tabs_create_mcp       → Neuen Tab erstellen
3. navigate              → Zu localhost:5173 navigieren
4. read_page / find      → Elemente finden
5. form_input / computer → Interagieren
6. computer screenshot   → Bei Fehlern dokumentieren
```

### Testplan im Plan definieren

🔒 **Pflicht:** Der Plan MUSS einen konkreten Testplan enthalten:

| Test       | Schritte           | Erwartetes Ergebnis |
| ---------- | ------------------ | ------------------- |
| Happy Path | Schritt 1, 2, 3... | Erfolg              |
| Edge Case  | Schritt 1, 2...    | Fehlermeldung X     |
| Error Case | Schritt 1...       | Validierung greift  |

---

## Dokumentations-Checkliste

🔒 **Pflicht:** Nach JEDER Implementation diese Docs prüfen:

| Änderung an...   | Doc aktualisieren                                                                      |
| ----------------- | -------------------------------------------------------------------------------------- |
| API Endpoint      | `docs/technik/api-reference.md` (Navigator) oder `api-reference/*.md` (spezifisch)     |
| DB Schema/Tabelle | `docs/technik/database-schema.md` (Navigator) oder `database-schema/*.md` (spezifisch) |
| Security-Feature  | `docs/technik/security.md`                                                             |
| Architektur       | `docs/technik/architecture.md` (Navigator) oder `architecture/*.md` (spezifisch)       |

**CHANGELOG.md - NUR bei:**

- Major Features (neue Funktionalität)
- Breaking Changes
- Security Fixes

**CHANGELOG Format (KURZ!):**

```markdown
## [Unreleased]

### Added

- Multi-Day Festival Support (#770, #771)

### Security

- Password Reset OWASP-konform (#604)
```

**NICHT in CHANGELOG:** Kleine Bugfixes, Refactorings, Style-Änderungen → nur in Git History

---

## Glossar

| Begriff          | Bedeutung                                                                           |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Phase**        | Abschnitt im Arbeitsplan (Blocker, MVP, Beta, ...)                                  |
| **Plan**         | Umsetzungsplan für ein Issue (Scope, Änderungen, Risiken, Testplan)               |
| **Freigabe**     | Explizites OK des Users nach Plan-Erstellung                                        |
| **Agent**        | Spezialisierte Rolle für Teilaufgaben (backend-architect, frontend-developer, ...) |
| **Orchestrator** | Haupt-Steuerungseinheit des /work Commands                                          |
| **Vor-/Nachteile** | Abwaegung verschiedener Ansaetze mit Empfehlung im Plan                             |
