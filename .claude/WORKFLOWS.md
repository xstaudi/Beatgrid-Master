# Workflows Übersicht

Zentrale Übersicht typischer Workflows und Entscheidungsmatrix für Agents/Commands/Skills.

**Siehe auch:** [AGENTS.md](AGENTS.md) | [COMMANDS.md](COMMANDS.md) | [SKILLS.md](SKILLS.md)

---

## Standard-Workflows

### 1. Feature-Entwicklung

#### Plan-First Approach (Empfohlen)

```
/plan #XXX
  ↓
  Plan prüfen (Scope, Dateien, Risiken, Testplan)
  ↓
  [User: Plan freigeben oder Anpassungen anfordern]
  ↓
/work #XXX (mit genehmigtem Plan starten)
```

#### Standard-Approach

```
/issue "Feature-Titel"
  ↓
  [GitHub Issue Expert aktiviert]
  ↓
/work #XXX
  ↓
  [Model-Check: model:opus oder model:sonnet?]
  ↓
  [Arbeitsplan laden: docs/planung/arbeitsplan.md]
  ↓
  Plan erstellen (Scope, Risiken, Testplan)
  ↓
  [User: "GO"]
  ↓
  Implementation:
    - Backend-Änderungen → backend-architect Agent
    - Frontend-Änderungen → frontend-developer Agent
  ↓
/test
  ↓
/review
  ↓
  [code-reviewer Agent aktiviert]
  ↓
  [Bei Critical/Important: Fixes einarbeiten]
  ↓
/commit #XXX (Closes #XXX)
  ↓
  Docs aktualisieren (architecture.md, api-reference.md, etc.)
  ↓
  Issue schließen
```

**Agents:** backend-architect, frontend-developer, code-reviewer  
**Commands:** /issue, /work, /test, /review, /commit  
**Skills:** GitHub Issue Expert, Code Review Expert, Database Drizzle Expert (bei DB-Änderungen), Security Expert (bei Auth-Änderungen)

---

### 2. Bug-Fix

```
/issue bug "Bug-Beschreibung"
  ↓
  [GitHub Issue Expert aktiviert]
  ↓
/debug
  ↓
  [debugger Agent aktiviert]
  ↓
  Root-Cause-Analyse
  ↓
  Fix implementieren
  ↓
/test
  ↓
/review
  ↓
  [code-reviewer Agent aktiviert]
  ↓
/commit #XXX (Closes #XXX)
  ↓
  Issue schließen
```

**Agents:** debugger, code-reviewer  
**Commands:** /issue, /debug, /test, /review, /commit  
**Skills:** GitHub Issue Expert, TypeScript React Expert, Security Expert (bei Security-Bugs), Code Review Expert

---

### 3. Schema-Änderung

```
/db status
  ↓
  Schema-Datei ändern (backend/src/db/schema/*.ts)
  ↓
  [Database Drizzle Expert aktiviert]
  ↓
  TRY: /db migrate (Drizzle primary)
  ↓
  FALLBACK bei Fehler: /db mcp:apply (SQL via Supabase MCP)
  ↓
  /db mcp:tables (Verify: Tabelle/Spalte vorhanden?)
  ↓
  /db mcp:advisors (Check: RLS, Indexes, Security)
  ↓
/test
  ↓
/review
  ↓
/commit
  ↓
  database-schema.md aktualisieren
```

**Agents:** backend-architect (bei Schema-Design)
**Commands:** /db, /test, /review, /commit
**Skills:** Database Drizzle Expert
**MCP-Tools:** `list_tables`, `apply_migration`, `get_advisors`, `get_logs`

---

### 4. Security-Audit

```
/security [path]
  ↓
  [Security Expert aktiviert]
  ↓
  OWASP Top 10 Checks
  ↓
  Findings dokumentieren
  ↓
  [Bei Critical/High: Issue erstellen]
  ↓
  /issue security "Security-Fix"
  ↓
  Fix implementieren
  ↓
  /security [path] (Retest)
```

**Agents:** backend-architect (bei Fixes)
**Commands:** /security, /issue, /work
**Skills:** Security Expert

---

### 5. Weekly Review (GTD)

```
Freitag Nachmittag: /review-week
  ↓
  Geschlossene Issues dieser Woche laden
  ↓
  Velocity-Metriken berechnen
    - Issues geschlossen (vs. Vorwoche)
    - Commits erstellt (vs. Vorwoche)
    - Trend-Indikator (⬆️ ➡️ ⬇️)
  ↓
  Blocker-Analyse
    - status:blocked Issues
    - In Review >24h
    - Critical Issues >7d offen
  ↓
  Top 5 für nächste Woche festlegen
    - Aus aktueller Phase (Arbeitsplan)
    - Quick Wins bevorzugen (Momentum)
  ↓
  Inbox-Check
    - Unassigned Issues
    - Issues ohne Pflicht-Labels
    - Offene Draft PRs
  ↓
  Action Items definieren
  ↓
Montag: /work #1 (erstes Issue aus Top 5)
```

**Agents:** -
**Commands:** /review-week, /work
**Skills:** GitHub Issue Expert

**Best Practice:** Freitag nachmittags durchfuehren, um die Woche abzuschliessen und Montag vorbereitet zu starten.

---

### 6. Motion Video Workflow

```
/motion
  ↓
┌───────────────────────────────────┐
│ 0. CONTEXT-BUDGET PRUEFEN         │
│    >80% = Warnung                 │
│    >90% = Abbruch empfehlen       │
└───────────────────────────────────┘
  ↓
┌───────────────────────────────────┐
│ 1. INPUT-WIZARD (8 Fragen)        │
│    → MotionBrief erstellen        │
└───────────────────────────────────┘
  ↓
┌───────────────────────────────────┐
│ 2. STORY-KONZEPT                  │
│    Agent: motion-story-architect  │
│    Output: Szenen-Timeline, Hook  │
└───────────────────────────────────┘
  ↓
⚠️ FREIGABE: Story ok?
  ↓
┌───────────────────────────────────┐
│ 3. MOTION DESIGN                  │
│    Agent: motion-designer         │
│    Output: Animation-Specs        │
└───────────────────────────────────┘
  ↓
⚠️ FREIGABE: Motion Design ok?
  ↓
┌───────────────────────────────────┐
│ 4. IMPLEMENTATION                 │
│    Agent: motion-developer        │
│    Output: Composition.tsx        │
└───────────────────────────────────┘
  ↓
┌───────────────────────────────────┐
│ 5. PERFORMANCE CHECK              │
│    Social Media Optimization      │
└───────────────────────────────────┘
  ↓
┌───────────────────────────────────┐
│ 6. BEAT SYNC (optional)           │
│    Nur wenn Audio vorhanden       │
└───────────────────────────────────┘
  ↓
┌───────────────────────────────────┐
│ 7. CODE REVIEW + RENDER           │
│    Agent: code-reviewer           │
│    npm run render                 │
└───────────────────────────────────┘
  ↓
✅ Video fertig in video/out/
```

**Agents:** motion-story-architect, motion-designer, motion-developer, code-reviewer
**Commands:** /motion
**Skills:** Remotion Skill

**Quick-Modus:** `/motion quick` - Nur 4 Kernfragen, Rest mit Defaults

---

### 7. Agent Teams (Parallele Claude-Instanzen)

```
Haupt-Agent:
  │
  ▼
┌─────────────────────────────────────┐
│ 1. CONTRACT DEFINIEREN              │
│    - Shared Types/DTOs erstellen    │
│    - API-Endpunkte spezifizieren    │
│    - File-Ownership-Map erstellen   │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 2. FILE OWNERSHIP ZUWEISEN          │
│    - Agent 1: backend/module/**     │
│    - Agent 2: frontend/feature/**   │
│    - Shared: nur Haupt-Agent        │
└─────────────────────────────────────┘
  │
  ▼
⚠️ FREIGABE: Ownership + Contract ok?
  │
  ▼
┌─────────────────────────────────────┐
│ 3. PARALLEL SPAWNEN                 │
│    Agent 1 ──────┐                  │
│    Agent 2 ──────┤ (gleichzeitig)   │
│    Agent N ──────┘                  │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 4. INTEGRATION (Haupt-Agent)        │
│    - API-Contract Verify            │
│    - Build Check                    │
│    - Konsistenz prüfen             │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 5. TEST + REVIEW                    │
│    - TaskCompleted Hook (ESLint)    │
│    - /test (Build, TypeCheck)       │
│    - /review (Code Review)          │
└─────────────────────────────────────┘
  │
  ▼
✅ Feature fertig
```

**Agents:** Abhaengig vom Use Case (siehe Templates)
**Templates:** `.claude/prompts/teams/`

- `full-stack-feature.md` - Backend + Frontend parallel
- `parallel-review.md` - 3 Review-Perspektiven parallel
- `cross-module-refactoring.md` - Pattern über N Module

**Voraussetzung:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` in `.claude/settings.json`

**Abgrenzung zu /work:** Agent Teams ersetzt NICHT `/work`. Es ist ein zusätzliches Werkzeug für Szenarien mit echtem Parallelisierungs-Vorteil. `/work` bleibt für sequenzielle Issue-Abarbeitung.

---

## Entscheidungsmatrix

### Task-Typ → Agent → Command → Skill

| Task-Typ                        | Agent                                                     | Command      | Skill                                                                             | Follow-up                        |
| ------------------------------- | --------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------- | -------------------------------- |
| **Neues Feature**               | backend-architect, frontend-developer                     | /work        | GitHub Issue Expert, Database Drizzle Expert (bei DB), Security Expert (bei Auth) | /test, /review, /commit          |
| **Bug-Fix**                     | debugger                                                  | /debug       | TypeScript React Expert, Security Expert (bei Security-Bugs)                      | /test, /review, /commit          |
| **Code-Review**                 | code-reviewer                                             | /review      | Code Review Expert                                                                | Fixes einarbeiten                |
| **Schema-Änderung**             | backend-architect                                         | /db          | Database Drizzle Expert + Supabase MCP                                            | /test, /review, /commit          |
| **Security-Audit**              | -                                                         | /security    | Security Expert                                                                   | /issue bei Critical/High         |
| **A11y-Check**                  | ui-ux-designer                                            | /a11y        | Accessibility Expert                                                              | Fixes einarbeiten                |
| **Issue erstellen**             | issue-creator                                             | /issue       | GitHub Issue Expert                                                               | /work #XXX                       |
| **Design-Spezifikation**        | ui-ux-designer                                            | -            | UI-UX Design Expert                                                               | frontend-developer implementiert |
| **Wochen-Rueckblick**           | -                                                         | /review-week | GitHub Issue Expert                                                               | /work für Top 5                 |
| **Marketing-Video**             | motion-story-architect, motion-designer, motion-developer | /motion      | Remotion Skill                                                                    | Video in video/out/              |
| **Parallel Full-Stack Feature** | backend-architect + frontend-developer                    | Agent Teams  | GitHub Issue Expert                                                               | /test, /review, /commit          |
| **Paralleles Code-Review**      | 3x code-reviewer                                          | Agent Teams  | Code Review Expert                                                                | Fixes einarbeiten                |
| **Cross-Modul Refactoring**     | N x backend-architect                                     | Agent Teams  | -                                                                                 | /test, /review, /commit          |

---

## Entry Points (30-Sekunden Einstieg)

**Wenn du X machst, nutze Y:**

| Du willst...                    | Starte mit...               | Dann...                              |
| ------------------------------- | --------------------------- | ------------------------------------ |
| **Ein Feature entwickeln**      | `/issue "Titel"`            | `/work #XXX`                         |
| **Einen Bug fixen**             | `/issue bug "Beschreibung"` | `/debug`                             |
| **Code reviewen**               | `/review`                   | Fixes einarbeiten                    |
| **Schema ändern**               | `/db status`                | Schema ändern → `/db migrate`        |
| **Security prüfen**             | `/security [path]`          | Bei Critical/High: `/issue security` |
| **A11y prüfen**                 | `/a11y`                     | Fixes einarbeiten                    |
| **Tests ausführen**             | `/test`                     | Bei Fehlern: `/debug`                |
| **Commit erstellen**            | `/commit #XXX`              | Nach `/test` und `/review`           |
| **Woche reviewen**              | `/review-week`              | `/work` für Top 5                   |
| **Marketing-Video erstellen**   | `/motion`                   | Video in `video/out/`                |
| **Marketing-Video (schnell)**   | `/motion quick`             | Video mit Defaults                   |
| **Parallel Feature entwickeln** | API-Contract definieren     | Agent Teams spawnen                  |
| **Parallel Code reviewen**      | Scope definieren            | 3 Reviewer-Perspektiven              |
| **Cross-Modul Refactoring**     | Pattern an 1 Modul testen   | Agents parallel spawnen              |

---

## Model-Entscheidung

**Wann welches Model?**

| Task-Komplexität                                                      | Model          | Begründung                          |
| --------------------------------------------------------------------- | -------------- | ----------------------------------- |
| **Multi-System, DB-Schemas, Security, Real-time, Algorithmen, Epics** | `model:opus`   | Komplexe Architektur-Entscheidungen |
| **UI-Komponenten, Bug-Fixes, Styling, Docs, Refactoring, CRUD**       | `model:sonnet` | Einfache Tasks, kosteneffizienter   |

**Regel:** `/work` prüft automatisch `model:` Label im Issue und warnt bei `model:sonnet` in Opus-Chat.

---

## Rules-Integration

**Path-basierte Rules werden automatisch geladen:**

| Pfad-Pattern             | Rule                        | Aktiviert bei                |
| ------------------------ | --------------------------- | ---------------------------- |
| `backend/**/*.ts`        | `.claude/rules/backend.md`  | Backend-Dateien bearbeiten   |
| `frontend/**/*.tsx`      | `.claude/rules/frontend.md` | Frontend-Dateien bearbeiten  |
| `backend/src/db/**/*.ts` | `.claude/rules/database.md` | DB-Schema-Dateien bearbeiten |
| `**/*.test.ts`           | `.claude/rules/testing.md`  | Test-Dateien bearbeiten      |

**Keine manuelle Aktivierung nötig** - Rules werden automatisch basierend auf Datei-Pfaden geladen.

---

## Workflow-Best Practices

### ✅ DO

- Immer Plan-Freigabe vor Umsetzung (`/work` erstellt Plan, wartet auf "GO")
- Model-Check vor Issue-Arbeit (bei `model:sonnet` zu Sonnet wechseln)
- Arbeitsplan berücksichtigen (Phasen-Reihenfolge einhalten)
- Chrome-Test vor Issue-Abschluss (E2E-Test im Browser)
- Dokumentation aktualisieren (betroffene Docs nach Implementation)
- Weekly Review freitags (`/review-week` für strukturierten Rueckblick)

### ❌ DON'T

- Kein Scope Creep (neue Features → neues Issue)
- Keine Implementierung ohne Plan-Freigabe
- Kein Commit ohne Test + Review
- Keine Breaking Changes ohne Dokumentation
- Keine Security-Fixes ohne `/security` Audit

---

**Siehe auch:** [AGENTS.md](AGENTS.md) für Agent-Details | [COMMANDS.md](COMMANDS.md) für Command-Details | [SKILLS.md](SKILLS.md) für Skill-Details
