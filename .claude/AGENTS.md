# Agents Übersicht

Zentrale Übersicht aller verfügbaren Agents für strukturierte Arbeit mit Claude.

**Siehe auch:** [COMMANDS.md](COMMANDS.md) | [SKILLS.md](SKILLS.md) | [workflows.md](workflows.md)

---

## Agent-Tabelle

| Agent                      | Wofür                                                   | Wann nutzen                                               | Grenzen                                         | Typische Commands       | Benötigte Skills                                       |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| **backend-architect**      | API-Design, DB-Schema, Service-Layer, Security-Patterns | API/DB-Änderungen, Schema-Design, Performance-Optimierung | Keine UI/UX, keine Bug-Analyse                  | `/db`, `/security`      | Database Drizzle Expert, Security Expert, Supabase MCP |
| **frontend-developer**     | React-Komponenten, State-Management, Performance, A11y  | UI-Änderungen, Komponenten-Implementierung, React Query   | Keine Design-Entscheidungen, keine Backend-APIs | `/test`, `/a11y`        | TypeScript React Expert, Accessibility Expert          |
| **code-reviewer**          | Code-Qualität, Security, Architektur-Compliance         | Nach Implementation, vor Merge, PR-Review                 | Keine Implementierung, nur Review               | `/review`               | Code Review Expert                                     |
| **debugger**               | Root-Cause-Analyse, Fehlerbehebung, Verifikation        | Tests fehlschlagen, unerwartetes Verhalten, Bug-Analyse   | Keine Feature-Entwicklung, nur Fixes            | `/debug`                | TypeScript React Expert, Security Expert               |
| **ui-ux-designer**         | Design-Entscheidungen, Wireframes, A11y, User Flows     | Design-Änderungen, UX-Review, Accessibility-Checks        | Keine Implementierung, nur Design-Spezifikation | `/a11y`                 | UI-UX Design Expert, Accessibility Expert              |
| **issue-creator**          | GitHub Issue-Erstellung im Gold Standard                | Neue Features, Bugs, Wartung dokumentieren                | Keine Implementierung                           | `/issue`                | GitHub Issue Expert                                    |
| **issue-orchestrator**     | Issue-Workflow-Orchestrierung                           | Komplexe Issue-Serien, Multi-Agent-Koordination           | Wird von `/work` verwendet                      | `/work`                 | GitHub Issue Expert                                    |
| **issue-batch-improver**   | Batch-Verbesserung von GitHub Issues                    | Viele Issues auf einmal verbessern                        | Keine Implementierung                           | `/improve-issues-batch` | GitHub Issue Expert                                    |
| **issue-quality-reviewer** | Issue-Qualitätsprüfung                                  | Issues auf Gold Standard prüfen                           | Keine Implementierung                           | `/review-issue`         | GitHub Issue Expert                                    |
| **parallel-dispatcher**    | Parallele Agent-Dispatch                                | Mehrere Tasks parallel bearbeiten                         | Komplex, nur für spezielle Fälle                | `/parallel-dispatch`    | Dispatching Parallel Agents                            |
| **subagent-driven-dev**    | Subagent-gesteuerte Entwicklung                         | Komplexe Features mit mehreren Sub-Agents                 | Wird von `/work` verwendet                      | `/work`                 | Subagent-Driven Development                            |
| **motion-story-architect** | Story-Struktur, Hook, Szenen-Timeline, Text-Copy        | Marketing-Videos, Video-Konzepte                          | Keine Animation-Specs, kein Code                | `/motion`               | Remotion Skill                                         |
| **motion-designer**        | Animation-Specs, Easing, Micro-Animations, Beat-Sync    | Video-Animationen, Motion Design                          | Kein Code, keine Story                          | `/motion`               | Remotion Skill                                         |
| **motion-developer**       | Remotion Code, Compositions, Zod-Schemas                | Video-Implementation                                      | Keine Story, kein Design                        | `/motion`               | Remotion Skill                                         |
| **performance-analyzer**   | N+1 Queries, Cache, API Latenz, DB Indexes              | Performance-Probleme analysieren                          | Nur Read-Only Analyse, keine Fixes              | -                       | Supabase MCP (Diagnostics)                             |
| **bundle-analyzer**        | Frontend Bundle-Größe, Code-Splitting, Chunk-Analyse  | Nach Frontend-Änderungen, vor Release                    | Nur Read-Only Analyse, kein Backend             | -                       | -                                                      |

---

## Kritische Agents (von CLAUDE.md referenziert)

Diese Agents sind **STABILITÄTSKRITISCH** und werden häufig verwendet:

- `backend-architect` - Backend-Architektur-Entscheidungen
- `frontend-developer` - Frontend-Entwicklung
- `code-reviewer` - Code-Review für Pull Requests
- `debugger` - Debugging-Unterstützung
- `ui-ux-designer` - UI/UX-Design-Entscheidungen

---

## Agent-Abgrenzungen

### backend-architect vs code-reviewer

- **backend-architect**: Implementiert API/DB-Änderungen
- **code-reviewer**: Prüft Implementierung auf Qualität/Security

### frontend-developer vs ui-ux-designer

- **frontend-developer**: Implementiert UI-Komponenten
- **ui-ux-designer**: Spezifiziert Design/Wireframes

### debugger vs code-reviewer

- **debugger**: Analysiert und fixiert Bugs
- **code-reviewer**: Prüft Code-Qualität (auch bei Fixes)

### Motion-Agents (Abgrenzung)

- **motion-story-architect**: WAS gezeigt wird + WANN (Story, Timeline)
- **motion-designer**: WIE animiert wird (Springs, Transitions)
- **motion-developer**: CODE implementieren (Remotion)

---

## Verknüpfungen

**Agents werden verwendet von:**

- `/work` Command → delegiert an `backend-architect`, `frontend-developer`, `debugger`, `code-reviewer`
- `/review` Command → nutzt `code-reviewer` Agent
- `/debug` Command → nutzt `debugger` Agent
- `/issue` Command → nutzt `issue-creator` Agent
- `/motion` Command → delegiert an `motion-story-architect`, `motion-designer`, `motion-developer`, `code-reviewer`

**Agents nutzen Skills:**

- `backend-architect` → Database Drizzle Expert, Security Expert, Supabase MCP
- `frontend-developer` → TypeScript React Expert, Accessibility Expert
- `code-reviewer` → Code Review Expert
- `debugger` → TypeScript React Expert, Security Expert
- `ui-ux-designer` → UI-UX Design Expert, Accessibility Expert
- `motion-story-architect` → Remotion Skill
- `motion-designer` → Remotion Skill
- `motion-developer` → Remotion Skill

**Agent Teams Templates:**

- Full-Stack Feature → [.claude/prompts/teams/full-stack-feature.md](prompts/teams/full-stack-feature.md)
- Parallel Review → [.claude/prompts/teams/parallel-review.md](prompts/teams/parallel-review.md)
- Cross-Modul Refactoring → [.claude/prompts/teams/cross-module-refactoring.md](prompts/teams/cross-module-refactoring.md)

---

## Agent Teams Kompositionen

Echte parallele Claude-Instanzen für Szenarien mit Parallelisierungs-Vorteil.

**Voraussetzung:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` (aktiviert in `.claude/settings.json`)

### Team-Tabelle

| Team                        | Agents                                                | Use Case                                   | Template                                                                 |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| **Full-Stack Feature**      | backend-architect + frontend-developer                | Backend + Frontend parallel implementieren | [full-stack-feature.md](prompts/teams/full-stack-feature.md)             |
| **Parallel Review**         | 3x code-reviewer (Security, Performance, Architektur) | Gründliches Multi-Perspektiven-Review     | [parallel-review.md](prompts/teams/parallel-review.md)                   |
| **Cross-Modul Refactoring** | N x backend-architect                                 | Gleiches Pattern über viele Module        | [cross-module-refactoring.md](prompts/teams/cross-module-refactoring.md) |

### Model-Strategie (durchgesetzt via Settings + Manual Switching)

**Main Session (Team Lead):** `opus` (manuell via `/model opus`)
**Subagent-Default:** `CLAUDE_CODE_SUBAGENT_MODEL: "sonnet"` (automatisch)
**Haiku für Read-Only:** `model: "haiku"` beim Task-Spawn

**WICHTIG:** `opusplan` (automatischer Wechsel) ist buggy → manuelles Switching empfohlen!
**Guide:** Siehe `.claude/docs/model-switching.md`

| Rolle                   | Model  | Agents                                                                                                                | Begründung                                                   |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Team Lead**           | Opus   | Main Session (du), Agent Teams Orchestrierung                                                                         | Architektur, Koordination, Contract-Design, Integration      |
| **Orchestrator/Planer** | Opus   | issue-orchestrator, parallel-dispatcher, subagent-driven-dev, motion-story-architect, motion-designer, ui-ux-designer | Architektur, Koordination, Design-Entscheidungen             |
| **Backend/Security**    | Opus   | backend-architect                                                                                                     | DB-Schema, Security-Patterns, API-Design (Business-Kritisch) |
| **Implementation**      | Sonnet | frontend-developer, debugger, code-reviewer, motion-developer, issue-creator, issue-batch-improver                    | Fokussierte Tasks, 5x günstiger                              |
| **Read-Only Analyse**   | Haiku  | performance-analyzer, bundle-analyzer, issue-quality-reviewer                                                         | Nur lesen/analysieren, 15x günstiger                         |

**Faustregel:** Opus plant + Backend, Sonnet implementiert Frontend/Fixes, Haiku analysiert.

**Agent Teams Workflow:**
1. **Vor Team-Start:** `/model opus` - Lead bleibt auf Opus
2. **Teammates spawnen:** Automatisch Sonnet via `CLAUDE_CODE_SUBAGENT_MODEL`
3. **Read-Only-Agents:** Explizit `model: "haiku"` beim Task-Spawn

### Task-Management Workflow (KRITISCH!)

**Problem:** Agents gehen oft auf idle ohne ihre Tasks als `completed` zu markieren → blockiert andere Agents!

**3-Säulen-Enforcement-Modell:**

| Säule                     | Mechanismus                                      | Wirkung                         | Status           |
| ------------------------- | ------------------------------------------------ | ------------------------------- | ---------------- |
| **1. TeammateIdle Hook**  | Automatisch beim Idle-Versuch                    | Blockiert Idle wenn Tasks offen | ✅ Implementiert |
| **2. Agent-Definitionen** | Task-Management Sektion in `.claude/agents/*.md` | Instruktiv (keine Garantie)     | ✅ Implementiert |
| **3. Spawn-Prompts**      | KRITISCH-Block am Prompt-Anfang                  | Erhöhte Sichtbarkeit            | ✅ Implementiert |

**Workflow (für jeden Agent):**

```
1. Task holen: TaskGet({ taskId: "X" })
2. Als in_progress markieren: TaskUpdate({ taskId: "X", status: "in_progress" })
3. Arbeit erledigen (Implementation, Review, etc.)
4. PFLICHT: Als completed markieren: TaskUpdate({ taskId: "X", status: "completed" })
5. Nächsten Task suchen: TaskList()
6. Bei shutdown_request: SendMessage({ type: "shutdown_response", request_id: "...", approve: true })
```

**Task-Sizing Best Practice:**

- **Optimal:** 5-6 Tasks pro Teammate, je ~15-30 Min
- **Zu groß:** >1h Tasks → Agent vergisst completion oder blockiert zu lange
- **Zu klein:** <10 Min Tasks → Overhead überwiegt Nutzen

**Warum kritisch:**

- Andere Agents warten auf Task-Completion via `blockedBy`
- Ohne `completed` sieht der Team Lead nicht, dass der Agent fertig ist
- Team-Blockade: Alle warten auf einen Agent der idle ist aber nicht `completed` gesetzt hat

### Agent Teams vs Subagents vs Parallel Dispatcher

| Merkmal               | Agent Teams                          | Subagents (Task Tool)         | Parallel Dispatcher        |
| --------------------- | ------------------------------------ | ----------------------------- | -------------------------- |
| **Instanzen**         | Echte parallele Claude-Instanzen     | Leichtgewichtige Sub-Prozesse | Mehrere Task-Tool-Aufrufe  |
| **Shared State**      | Shared Codebase, File Ownership      | Isoliert, Ergebnis zurück     | Isoliert, Ergebnis zurück  |
| **Use Case**          | Full-Stack, Reviews, Refactoring     | Recherche, einzelne Tasks     | Unabhängige Bug-Fixes      |
| **Kosten**            | ~3-4x (Lead Opus + Sonnet Teammates) | Geringer (kleinerer Scope)    | Mittel                     |
| **Min. Task-Größe**   | ~30 Min pro Agent                    | Beliebig                      | Beliebig                   |
| **Quality Gate**      | TaskCompleted Hook                   | Kein Hook                     | Kein Hook                  |

### Known Limitations

Agent Teams sind aktuell nicht 100% production-ready. Diese Einschränkungen sind bekannt:

| Limitation                   | Impact                                   | Workaround                                           |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| **Task-Status-Lag**          | Task-Updates brauchen ~2-5s bis sichtbar | Kurz warten nach TaskUpdate, dann TaskList           |
| **Keine Session-Resumption** | Bei Crash gehen offene Tasks verloren    | Tasks klein halten (<30 Min), bei Crash neu zuweisen |
| **Langsamer Shutdown**       | Shutdown-Response braucht ~30s           | Geduldig warten, nicht mehrfach senden               |
| **Idle != Fertig**           | Agent idle heißt nicht "Task fertig"     | Normal - erst reagieren wenn Task nicht completed    |

**TeammateIdle Hook minimiert diese Probleme**, kann aber nicht alle Edge-Cases abfangen.

### Delegate Mode

**Problem:** Team Lead implementiert selbst statt nur zu koordinieren → ineffizient.

**Lösung:** Shift+Tab während Agent Team aktiv → Lead fokussiert auf Orchestrierung:

- Task-Erstellung und -Zuweisung
- Status-Monitoring (TaskList)
- Integration und Verification
- **Keine** direkte Code-Implementation

**Wann verwenden:** Immer bei Agent Teams mit 2+ Teammates.

---

## Externe Referenzen pro Agent

**Häufigste externe Referenzen, die Agents typischerweise verwenden:**

### backend-architect

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Stack, Architektur-Prinzipien
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - System-Architektur, Tech Stack
- [docs/technik/api-reference.md](../../docs/technik/api-reference.md) - API-Standards, Endpunkte
- [docs/technik/database-schema.md](../../docs/technik/database-schema.md) - DB-Schema, Relations
- [docs/technik/security.md](../../docs/technik/security.md) - Security-Patterns, Auth-Flows
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, TypeScript-Regeln
- [docs/entwicklung/module-structure.md](../../docs/entwicklung/module-structure.md) - Backend Modul-Standard
- [.claude/rules/backend.md](rules/backend.md) - Backend-spezifische Rules
- [.claude/rules/database.md](rules/database.md) - Database-spezifische Rules
- [.claude/context/tech-stack.md](context/tech-stack.md) - Tech Stack Quick-Reference
- [.claude/context/module-structure.md](context/module-structure.md) - Modul-Struktur Quick-Reference
- [.claude/context/naming-conventions.md](context/naming-conventions.md) - Naming Quick-Reference
- [.claude/context/glossary.md](context/glossary.md) - Domain-Begriffe

### frontend-developer

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Stack, Architektur-Prinzipien
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Frontend-Architektur, Tech Stack
- [docs/produkt/app-layout.md](../../docs/produkt/app-layout.md) - Routes, Komponenten, Navigation
- [docs/entwicklung/styling-rules.md](../../docs/entwicklung/styling-rules.md) - Tailwind, Design-System, A11y
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, React-Patterns
- [docs/entwicklung/feature-structure.md](../../docs/entwicklung/feature-structure.md) - Frontend Feature-Standard
- [docs/entwicklung/ui-components/README.md](../../docs/entwicklung/ui-components/README.md) - UI-Komponenten-Doku
- [.claude/rules/frontend.md](rules/frontend.md) - Frontend-spezifische Rules
- [.claude/context/tech-stack.md](context/tech-stack.md) - Tech Stack Quick-Reference
- [.claude/context/feature-structure.md](context/feature-structure.md) - Feature-Struktur Quick-Reference
- [.claude/context/naming-conventions.md](context/naming-conventions.md) - Naming Quick-Reference
- [.claude/context/design-principles.md](context/design-principles.md) - Design-Principles Quick-Reference
- [.claude/context/glossary.md](context/glossary.md) - Domain-Begriffe

### code-reviewer

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Architektur-Prinzipien
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, Review-Kriterien
- [docs/entwicklung/feature-structure.md](../../docs/entwicklung/feature-structure.md) - Frontend Feature-Standard
- [docs/entwicklung/module-structure.md](../../docs/entwicklung/module-structure.md) - Backend Modul-Standard
- [docs/entwicklung/naming-conventions.md](../../docs/entwicklung/naming-conventions.md) - Naming-Konventionen
- [docs/technik/security.md](../../docs/technik/security.md) - Security-Checkliste
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Architektur-Compliance
- [.claude/rules/backend.md](rules/backend.md) - Backend-Rules
- [.claude/rules/frontend.md](rules/frontend.md) - Frontend-Rules
- [.claude/context/feature-structure.md](context/feature-structure.md) - Feature-Struktur Quick-Reference
- [.claude/context/module-structure.md](context/module-structure.md) - Modul-Struktur Quick-Reference
- [.claude/context/naming-conventions.md](context/naming-conventions.md) - Naming Quick-Reference
- [.claude/context/glossary.md](context/glossary.md) - Domain-Begriffe

### debugger

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Stack
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - System-Architektur, Fehlerbehandlung
- [docs/technik/security.md](../../docs/technik/security.md) - Security-Patterns, Vulnerabilities
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, Debugging-Patterns
- [.claude/context/tech-stack.md](context/tech-stack.md) - Tech Stack Quick-Reference
- [.claude/context/glossary.md](context/glossary.md) - Domain-Begriffe

### ui-ux-designer

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Design-Prinzipien
- [docs/entwicklung/styling-rules.md](../../docs/entwicklung/styling-rules.md) - Design-System, Tailwind, A11y
- [docs/produkt/workflows.md](../../docs/produkt/workflows.md) - User-Journeys, User-Flows
- [docs/produkt/app-layout.md](../../docs/produkt/app-layout.md) - UI-Struktur, Navigation
- [.claude/context/design-principles.md](context/design-principles.md) - Design-Principles Quick-Reference
- [.claude/context/glossary.md](context/glossary.md) - Domain-Begriffe

### issue-creator, issue-orchestrator, issue-batch-improver, issue-quality-reviewer

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Issue-Standards
- [.claude/prompts/issue-gold-standard-template.md](prompts/issue-gold-standard-template.md) - Issue-Template
- [docs/planung/arbeitsplan.md](../../docs/planung/arbeitsplan.md) - Projekt-Phasen, Priorisierung
- [docs/produkt/product.md](../../docs/produkt/product.md) - Feature-Kontext, Vision

### parallel-dispatcher, subagent-driven-dev

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Agent-System
- [AGENTS.md](AGENTS.md) - Agent-Übersicht, Verantwortlichkeiten
- [COMMANDS.md](COMMANDS.md) - Command-Übersicht, Workflows
- [workflows.md](workflows.md) - Workflow-Diagramme

### motion-story-architect

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Brand-Standards
- [.claude/prompts/motion/master-prompt.md](prompts/motion/master-prompt.md) - Video-Architektur
- [.claude/prompts/motion/storytelling-hook.md](prompts/motion/storytelling-hook.md) - Hook-Strategien
- [.claude/prompts/motion/social-media-performance.md](prompts/motion/social-media-performance.md) - Plattform-Optimierung

### motion-designer

- [video/src/design-tokens.ts](../../video/src/design-tokens.ts) - Spring-Configs, Farben
- [.claude/prompts/motion/cinematic-motion.md](prompts/motion/cinematic-motion.md) - Animation-Qualität
- [.claude/prompts/motion/beat-sync.md](prompts/motion/beat-sync.md) - BPM-Synchronisation
- [.claude/skills/remotion/rules/animations.md](skills/remotion/rules/animations.md) - Remotion Animations

### motion-developer

- [video/src/design-tokens.ts](../../video/src/design-tokens.ts) - SSOT für Farben, Typography
- [.claude/prompts/motion/code-quality.md](prompts/motion/code-quality.md) - Remotion Performance
- [.claude/prompts/motion/data-driven-videos.md](prompts/motion/data-driven-videos.md) - Dynamische Props
- [.claude/skills/remotion/SKILL.md](skills/remotion/SKILL.md) - Alle Remotion Rules

### performance-analyzer

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Stack
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - System-Architektur, DB-Architektur
- [docs/technik/database-schema.md](../../docs/technik/database-schema.md) - DB-Schema, Indexes
- [docs/technik/api-reference.md](../../docs/technik/api-reference.md) - API-Endpunkte, Latenz-Patterns

---

**Siehe auch:** [workflows.md](workflows.md) für typische Agent-Workflows
