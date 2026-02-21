# Skills Übersicht

Zentrale Übersicht aller verfügbaren Skills für spezialisierte Expertise.

**Siehe auch:** [AGENTS.md](AGENTS.md) | [COMMANDS.md](COMMANDS.md) | [workflows.md](workflows.md)

---

## Skill-Tabelle

| Skill                           | Zweck                                                          | Wann automatisch                     | Wann manuell                                 | Nutzt in Commands/Agents                                    |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- | ----------------------------------------------------------- |
| **GitHub Issue Expert**         | Issue-Erstellung, -Review, -Verbesserung im Gold Standard      | Bei `/issue`, `/work`                | Bei Issue-Qualitätsprüfung                   | `/issue`, `/work`, `/review-issue`, `/improve-issues-batch` |
| **Code Review Expert**          | Code-Review Best Practices                                     | Bei `/review`                        | Bei manueller Review-Anfrage                 | `/review`, `code-reviewer` Agent                            |
| **Database Drizzle Expert**     | Drizzle ORM, PostgreSQL, Schema-Design + Supabase MCP Fallback | Bei `/db`, Backend-Schema-Änderungen | Bei komplexen DB-Fragen, MCP-Migrations      | `/db`, `backend-architect` Agent                            |
| **Security Expert**             | Security Best Practices, OWASP                                 | Bei `/security`, Auth-Flows          | Bei Security-Fragen                          | `/security`, `backend-architect`, `debugger` Agents         |
| **TypeScript React Expert**     | TypeScript/React Best Practices                                | Bei Frontend-Änderungen              | Bei Type/Component-Fragen                    | `frontend-developer`, `debugger` Agents                     |
| **Accessibility Expert**        | WCAG 2.1 AA, A11y-Patterns                                     | Bei `/a11y`, UI-Änderungen           | Bei A11y-Fragen                              | `/a11y`, `frontend-developer`, `ui-ux-designer` Agents      |
| **UI-UX Design Expert**         | Design-System, Wireframes, User Flows                          | Bei Design-Änderungen                | Bei UX-Fragen                                | `ui-ux-designer` Agent                                      |
| **Architecture Research**       | Architektur-Recherche, Kontext-Sammlung                        | Bei `/research`                      | Bei Architektur-Fragen                       | `/research`                                                 |
| **Dispatching Parallel Agents** | Parallele Agent-Dispatch                                       | Bei `/parallel-dispatch`             | Bei komplexen Multi-Agent-Tasks              | `/parallel-dispatch`                                        |
| **Subagent-Driven Development** | Subagent-gesteuerte Entwicklung                                | Bei `/work` mit komplexen Features   | Bei Multi-Agent-Koordination                 | `/work`, `subagent-driven-dev` Agent                        |
| **Release Notes Generator**     | Release Notes aus Git History generieren                       | Nie (nur manuell)                    | Bei `/release-notes` oder expliziter Anfrage | -                                                           |
| **E2E Testing Expert**          | Playwright E2E-Tests + Workflows generieren                    | Bei `/e2e`                           | Bei E2E-Test-Anfragen                        | `/e2e` Command, `/test` Command, `frontend-developer` Agent |

### Community Skills (claude-code-templates)

| Skill                          | Zweck                                         | Wann automatisch               | Wann manuell                       | Nutzt in Commands/Agents   |
| ------------------------------ | --------------------------------------------- | ------------------------------ | ---------------------------------- | -------------------------- |
| **senior-backend**             | Backend-Entwicklung (Node/Express/Go/Python)  | Bei Backend-Arbeit             | Bei API-Design, DB-Optimierung     | `backend-architect` Agent  |
| **tailwind-patterns**          | Tailwind CSS v4 Patterns, Design Tokens       | Bei Styling-Änderungen         | Bei CSS/Layout-Fragen              | `frontend-developer` Agent |
| **api-integration-specialist** | Third-Party API Integration (OAuth, Webhooks) | Bei externen APIs              | Bei Stripe/Twilio/etc. Integration | API-Integrationen          |
| **webapp-testing**             | Playwright E2E-Testing                        | Bei `/test`                    | Bei UI-Testing                     | `/test` Command            |
| **systematic-debugging**       | 4-Phasen Debugging-Prozess (Root Cause First) | Bei `/debug`                   | Bei Bugs, Test-Failures            | `debugger` Agent           |
| **senior-architect**           | Architektur-Diagramme, Dependency-Analyse     | Bei Architektur-Entscheidungen | Bei System-Design                  | Architektur-Arbeit         |

---

## Kritische Skills (von CLAUDE.md referenziert)

Diese Skills sind **STABILITÄTSKRITISCH** und werden häufig verwendet:

- **GitHub Issue Expert** - Issue-Erstellung und -Management
- **Code Review Expert** - Code-Qualitätsprüfung
- **Database Drizzle Expert** - Datenbank-Operationen
- **Security Expert** - Security-Audits
- **TypeScript React Expert** - Frontend-Entwicklung

---

## Skill-Aktivierung

### Automatische Aktivierung

Skills werden automatisch aktiviert, wenn:

- Ein Command verwendet wird, der das Skill benötigt (z.B. `/issue` → GitHub Issue Expert)
- Ein Agent verwendet wird, der das Skill benötigt (z.B. `backend-architect` → Database Drizzle Expert)
- Eine Rule-Datei geladen wird, die das Skill referenziert

### Manuelle Aktivierung

Skills können manuell aktiviert werden durch:

- Explizite Erwähnung im Prompt
- Referenz in Agent/Command-Dokumentation
- Direkte Skill-Nutzung bei spezifischen Fragen

---

## Verknüpfungen

**Skills werden verwendet von Commands:**

- `/issue` → GitHub Issue Expert
- `/work` → GitHub Issue Expert
- `/review` → Code Review Expert
- `/db` → Database Drizzle Expert
- `/security` → Security Expert
- `/a11y` → Accessibility Expert
- `/e2e` → E2E Testing Expert
- `/research` → Architecture Research

**Skills werden verwendet von Agents:**

- `backend-architect` → Database Drizzle Expert, Security Expert
- `frontend-developer` → TypeScript React Expert, Accessibility Expert
- `code-reviewer` → Code Review Expert
- `debugger` → TypeScript React Expert, Security Expert
- `ui-ux-designer` → UI-UX Design Expert, Accessibility Expert

---

## Externe Referenzen pro Skill

**Häufigste externe Referenzen, die Skills typischerweise verwenden:**

### GitHub Issue Expert

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Issue-Standards
- [.claude/prompts/issue-gold-standard-template.md](prompts/issue-gold-standard-template.md) - Issue-Template
- [.claude/prompts/review-issue-prompt.md](prompts/review-issue-prompt.md) - Review-Prompt für manuelle Issue-Prüfung
- [docs/planung/arbeitsplan.md](../../docs/planung/arbeitsplan.md) - Projekt-Phasen, Milestones
- [docs/produkt/product.md](../../docs/produkt/product.md) - Feature-Kontext, Vision

### Code Review Expert

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Code-Standards
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, Review-Kriterien
- [docs/technik/security.md](../../docs/technik/security.md) - Security-Checkliste
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Architektur-Compliance
- [.claude/rules/backend.md](rules/backend.md) - Backend-Rules
- [.claude/rules/frontend.md](rules/frontend.md) - Frontend-Rules

### Database Drizzle Expert

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, DB-Standards
- [docs/technik/database-schema.md](../../docs/technik/database-schema.md) - DB-Schema, Relations
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Datenmodell, DB-Architektur
- [.claude/rules/database.md](rules/database.md) - Database-spezifische Rules

### Security Expert

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Security-Standards
- [docs/technik/security.md](../../docs/technik/security.md) - Security-Konzept, OWASP, Auth-Flows
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Security-Architektur
- [docs/technik/api-reference.md](../../docs/technik/api-reference.md) - API-Security-Patterns

### TypeScript React Expert

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Stack
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - TypeScript-Standards, React-Patterns
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Frontend-Architektur
- [docs/produkt/app-layout.md](../../docs/produkt/app-layout.md) - Komponenten-Struktur
- [.claude/rules/frontend.md](rules/frontend.md) - Frontend-Rules

### Accessibility Expert

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, A11y-Standards
- [docs/entwicklung/styling-rules.md](../../docs/entwicklung/styling-rules.md) - A11y-Patterns, WCAG 2.1 AA
- [docs/produkt/app-layout.md](../../docs/produkt/app-layout.md) - UI-Struktur, Navigation
- [docs/entwicklung/ui-components/README.md](../../docs/entwicklung/ui-components/README.md) - A11y-Komponenten

### UI-UX Design Expert

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Design-Prinzipien
- [docs/entwicklung/styling-rules.md](../../docs/entwicklung/styling-rules.md) - Design-System, Tailwind, Varianten
- [docs/produkt/workflows.md](../../docs/produkt/workflows.md) - User-Journeys, User-Flows
- [docs/produkt/app-layout.md](../../docs/produkt/app-layout.md) - UI-Struktur, Navigation
- [.claude/context/design-principles.md](../context/design-principles.md) - Design-Principles (falls vorhanden)

### Architecture Research

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Architektur-Prinzipien
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - System-Architektur, Tech Stack
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, Patterns

### Dispatching Parallel Agents, Subagent-Driven Development

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Agent-System
- [AGENTS.md](AGENTS.md) - Agent-Übersicht, Verantwortlichkeiten
- [COMMANDS.md](COMMANDS.md) - Command-Übersicht, Workflows
- [workflows.md](workflows.md) - Workflow-Diagramme

### Community Skills

**senior-backend**

- Referenzen: `references/api_design_patterns.md`, `references/database_optimization_guide.md`, `references/backend_security_practices.md`
- Scripts: `scripts/api_scaffolder.py`, `scripts/database_migration_tool.py`, `scripts/api_load_tester.py`

**tailwind-patterns**

- Tailwind v4 CSS-first Configuration, Container Queries, Design Tokens
- Keine externen Referenzen (selbstständig)

**api-integration-specialist**

- OAuth 2.0, API Keys, Webhooks, Rate Limiting, Retry Logic
- Keine externen Referenzen (selbstständig)

**webapp-testing**

- Scripts: `scripts/with_server.py` (Server-Lifecycle-Management)
- Examples: `examples/element_discovery.py`, `examples/static_html_automation.py`, `examples/console_logging.py`

**systematic-debugging** ⭐ (Empfohlen für debugger Agent)

- 4-Phasen-Prozess: Root Cause → Pattern Analysis → Hypothesis → Implementation
- "Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"
- Supporting Techniques: `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`

**senior-architect**

- Referenzen: `references/architecture_patterns.md`, `references/system_design_workflows.md`, `references/tech_decision_guide.md`
- Scripts: `scripts/architecture_diagram_generator.py`, `scripts/dependency_analyzer.py`, `scripts/project_architect.py`

---

## Skill-Budget Management

**Problem:** Claude Code hat ein Character-Budget für Skill-Descriptions (Default: 15,000 chars).

**Lösung:** Budget über Environment Variable konfigurieren.

### Budget-Konfiguration

**Environment Variable:** `SLASH_COMMAND_TOOL_CHAR_BUDGET`

| Skill-Count  | Budget           | Begründung                                 |
| ------------ | ---------------- | ------------------------------------------ |
| <10 Skills   | 15,000 (Default) | Ausreichend                                |
| 10-20 Skills | 30,000           | Doppeltes Budget                           |
| >20 Skills   | 50,000           | Skill-Descriptions kürzen + Budget erhöhen |

**Aktuell (17 Skills = 11 eigene + 6 Community):**

- **Budget:** 90,000 chars (konfiguriert)
- **Eigene Skills:** ~41,800 chars
- **Community Skills:** ~27,478 chars (kompaktiert)
- **Gesamt:** ~69,278 chars
- **Status:** ✅ Im Budget (77% Auslastung)

### Konfiguration setzen

**Global (.bashrc oder .zshrc):**

```bash
export SLASH_COMMAND_TOOL_CHAR_BUDGET=30000
```

**Claude Code Settings (falls verfügbar):**
Settings → Environment Variables → `SLASH_COMMAND_TOOL_CHAR_BUDGET=30000`

**Empfehlung:** Global setzen, damit alle Sessions profitieren.

### Monitoring

**Check:** `/context` zeigt Skill-Budget + Usage

**Bei Budget-Warnings:**

1. `/context` ausführen → Skill-Budget sehen
2. Skills kompaktieren (größte zuerst)
3. Budget erhöhen (falls >20 Skills)
4. Ungenutzte Skills deaktivieren

### Skill-Kompaktierung

**Pattern (bei Budget-Warnings):**

**Vorher:**

```markdown
# Skill Name

Ausführliche Beschreibung mit vielen Details...

## Sektion 1

Lange Erklärungen...

## Sektion 2

Viele Beispiele...

## Checklisten

- [ ] Item 1
- [ ] Item 2
      ...
```

**Nachher:**

```markdown
# Skill Name

Quick Reference: Kernkonzepte kompakt

## Essentials

Nur kritische Patterns

## Wann aktiv

Kurze Aktivierungs-Beschreibung
```

**Reduktion:** ~60-70% möglich ohne Funktionalitätsverlust

**Kompaktierte Skills (Issue #871):**

- Database Drizzle Expert: 14.5k → 4.6k (-68%)
- TypeScript React Expert: 9.0k → 4.1k (-55%)
- GitHub Issue Expert: 8.1k → 3.2k (-60%)
- Security Expert: 7.0k → 3.6k (-48%)
- Architecture Research: 6.6k → 3.5k (-48%)

---

## Auto-Invocation Policy

Alle Skills sind **auto-invokable** (kein `disable-model-invocation`). Side-Effects (Edit, Write, Bash) werden durch das Tool-Permission-System kontrolliert - nicht durch Skill-Blockierung.

**Warum kein `disable-model-invocation`:**

- Tool-Permissions regeln bereits was erlaubt ist
- Skills liefern Expertise/Kontext, nicht unkontrollierte Aktionen
- Blockierte Skills verhindern sinnvolle Workflows (z.B. `/debug` braucht TypeScript React Expert)

---

**Siehe auch:** [workflows.md](workflows.md) für Skill-Integration in Workflows
