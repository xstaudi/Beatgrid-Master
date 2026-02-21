# Commands Übersicht

Zentrale Übersicht aller verfügbaren Commands für strukturierte Arbeit mit Claude.

**Siehe auch:** [AGENTS.md](AGENTS.md) | [SKILLS.md](SKILLS.md) | [workflows.md](workflows.md)

---

## Command-Tabelle

| Command                   | Zweck                                   | Input/Output                                                                                  | Ruft Agents?                                                                 | Nutzt Skills?                            | Context-Check                   | Follow-up                     |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------- | ----------------------------- |
| **/work**                 | Issue-Workflow-Orchestrator             | Issue-Nummer oder Scan → Plan → Implement → Test → Docs. Mit `--team`: Agent Teams (parallel) | Ja: backend-architect, frontend-developer, debugger, code-reviewer           | GitHub Issue Expert                      | ✅ Step 0 + nach Agent-Spawn    | `/test`, `/review`, `/commit` |
| **/issue**                | GitHub Issue-Erstellung (Gold Standard) | Titel/Thema → Issue mit Labels                                                                | Ja: issue-creator                                                            | GitHub Issue Expert                      | -                               | `/work #XXX`                  |
| **/review**               | Code-Review durchführen                 | Datei/Path oder PR → Review-Report                                                            | Ja: code-reviewer                                                            | Code Review Expert                       | -                               | Fixes einarbeiten             |
| **/commit**               | Git Commit erstellen                    | Staged Changes → Commit-Message                                                               | Nein                                                                         | Nein                                     | -                               | `/work` nächster Schritt      |
| **/done**                 | Issue abschließen                       | Issue-Nr → Commit + Push + Close + Docs                                                       | Nein                                                                         | Nein                                     | -                               | Nächstes Issue                |
| **/db**                   | Datenbank-Operationen + MCP-Diagnostics | Schema-Änderungen → Migration/Status + mcp:tables/advisors/apply/logs                         | Nein                                                                         | Database Drizzle Expert + Supabase MCP   | -                               | `/work` nach Schema-Änderung  |
| **/test**                 | Test-Suite ausführen                    | Code → Test-Protokoll                                                                         | Nein                                                                         | Nein                                     | -                               | `/review` bei Fehlern         |
| **/debug**                | Debugging-Unterstützung                 | Fehler/Stack-Trace → Root-Cause + Fix                                                         | Ja: debugger                                                                 | TypeScript React Expert, Security Expert | -                               | `/test` nach Fix              |
| **/feature**              | Feature-Entwicklung (End-to-End)        | Issue/Titel → Plan → Implement → Test. Mit `--team`: Agent Teams (parallel)                   | Ja: backend-architect, frontend-developer                                    | GitHub Issue Expert                      | ✅ Phase 0 + nach Phase 1       | `/test`, `/review`            |
| **/figma**                | Figma-zu-Code Migration (MCP)           | Figma-URL → Auto-Fetch via MCP → Plan + Implement                                             | Ja: backend-architect, frontend-developer                                    | GitHub Issue Expert                      | ✅ Phase 0                      | `/test`, `/review`, `/done`   |
| **/security**             | Security-Audit                          | Path/Modul → Security-Report                                                                  | Nein                                                                         | Security Expert                          | -                               | Issue bei Critical/High       |
| **/a11y**                 | Accessibility-Checks                    | Komponente/Route → A11y-Report                                                                | Nein                                                                         | Accessibility Expert                     | -                               | Fixes einarbeiten             |
| **/research**             | Recherche & Kontext-Sammlung            | Thema → Recherche-Report                                                                      | Nein                                                                         | Architecture Research                    | ✅ Step 2.5 (vor Codebase-Scan) | `/issue` bei neuem Feature    |
| **/audit-docs**           | Dokumentations-Audit                    | Scope → Doc-Report                                                                            | Nein                                                                         | Nein                                     | -                               | Docs aktualisieren            |
| **/cleanup**              | Dead Code Detection & Cleanup           | Path/Scope → Cleanup-Report                                                                   | Nein                                                                         | Nein                                     | -                               | ESLint --fix                  |
| **/scan-issues**          | GitHub Issues scannen                   | Filter → Issue-Report                                                                         | Nein                                                                         | GitHub Issue Expert                      | -                               | `/work` für Issues            |
| **/review-issue**         | Issue-Qualität prüfen                   | Issue-Nummer → Qualitäts-Report                                                               | Ja: issue-quality-reviewer                                                   | GitHub Issue Expert                      | -                               | Issue verbessern              |
| **/improve-issues-batch** | Batch-Issue-Verbesserung                | Filter → Verbesserte Issues                                                                   | Ja: issue-batch-improver                                                     | GitHub Issue Expert                      | -                               | `/work` für Issues            |
| **/parallel-dispatch**    | Parallele Agent-Dispatch                | Tasks → Parallele Bearbeitung                                                                 | Ja: verschiedene Agents                                                      | Dispatching Parallel Agents              | -                               | Ergebnisse zusammenführen     |
| **/review-week**          | Wochen-Rueckblick (GTD)                 | Filter → Weekly Review Report                                                                 | Nein                                                                         | GitHub Issue Expert                      | -                               | `/work` für nächste Woche   |
| **/motion**               | Marketing-Video Workflow                | Input-Wizard → Story → Motion Design → Code → Render                                          | Ja: motion-story-architect, motion-designer, motion-developer, code-reviewer | Remotion Skill                           | ✅ Phase 0                      | Video in `video/out/`         |
| **/plan**                 | Standalone Implementierungsplan         | Issue-Nr/Thema → Strukturierter Plan OHNE Implementation                                      | Nein                                                                         | Nein                                     | -                               | `/work` zur Umsetzung         |
| **/mucke**                | Musik-Discovery (Electronic Music)      | Genre/Query → Multi-Phasen-Recherche → Track-Tabelle                                          | Nein                                                                         | Nein                                     | -                               | Tracks verwenden              |
| **/e2e**                  | E2E Test-Workflow (Playwright)          | Flow-Name/Route → Test-Template → Implementation Guide → Execution                            | Nein                                                                         | E2E Testing Expert                       | -                               | `/test` zur Ausführung        |

---

## Kritische Commands (von CLAUDE.md referenziert)

Diese Commands sind **STABILITÄTSKRITISCH** und werden häufig verwendet:

- `/work` - Issue-Workflow-Orchestrator
- `/issue` - GitHub Issue-Erstellung
- `/plan` - Standalone Implementierungsplan
- `/review` - Code-Review
- `/commit` - Git Commit
- `/done` - Issue abschließen (Commit + Push + Close + Docs)
- `/db` - Datenbank-Operationen
- `/feature` - Feature-Entwicklung
- `/figma` - Figma-zu-Code Migration
- `/security` - Security-Audit
- `/cleanup` - Dead Code Detection & Cleanup
- `/test` - Test-Suite
- `/e2e` - E2E Test-Workflow (Playwright)
- `/motion` - Marketing-Video Workflow (Remotion)
- `/mucke` - Musik-Discovery (Electronic Music)

---

## Command-Workflows

### Standard Feature-Workflow

```
/issue "Feature-Titel"
  → /work #XXX
    → /test
      → /review
        → /done #XXX
```

### Standard Bug-Fix-Workflow

```
/issue bug "Bug-Beschreibung"
  → /debug
    → /test
      → /review
        → /done #XXX
```

### Schema-Änderung-Workflow

```
/db status
  → Schema ändern
    → /db migrate
      → /test
        → /review
          → /commit
```

### Figma-Migration-Workflow (MCP-basiert)

```
/figma <Figma-URL>
  → MCP holt automatisch (Code, Screenshot, Tokens, Mappings)
    → Token-Mapping + Analyse
      → Issue erstellen
        → Plan (Freigabe!)
          → Implementierung
            → /test
              → /review
                → /done #XXX
```

### Weekly Review Workflow (GTD)

```
Freitag: /review-week
  → Geschlossene Issues prüfen
    → Velocity-Trend analysieren
      → Blocker identifizieren
        → Top 5 für nächste Woche festlegen
          → Montag: /work #1 (aus Top 5)
```

### Motion Video Workflow

```
/motion
  → Input-Wizard (8 Fragen)
    → Story-Konzept (motion-story-architect)
      → [Freigabe: Story ok?]
        → Motion Design (motion-designer)
          → [Freigabe: Motion ok?]
            → Implementation (motion-developer)
              → Performance Check
                → Code Review + Render
                  → Video in video/out/
```

### Agent Teams Workflow (Parallel)

```
/work #XXX --team
  → Contract + File Ownership definieren
    → [Freigabe: Ownership ok?]
      → Agents parallel spawnen
        → Integration + Build Check
          → /test
            → /review
              → /done #XXX
```

### E2E Test Workflow

```
/e2e <flow-name>
  → Kontext sammeln (Routes, Components, State)
    → Test-Template generieren (Playwright)
      → Assertions + Error-Handling
        → Implementation Guide
          → [Freigabe: Test-Plan ok?]
            → Test erstellen (frontend/e2e/)
              → Test ausführen
                → Report + Next Steps
```

---

## Verknüpfungen

**Commands rufen Agents auf:**

- `/work` → backend-architect, frontend-developer, debugger, code-reviewer (mit `--team`: Agent Teams parallel)
- `/review` → code-reviewer
- `/debug` → debugger
- `/issue` → issue-creator
- `/figma` → backend-architect, frontend-developer, code-reviewer
- `/motion` → motion-story-architect, motion-designer, motion-developer, code-reviewer
- `/review-issue` → issue-quality-reviewer
- `/improve-issues-batch` → issue-batch-improver

**Commands nutzen Skills:**

- `/work` → GitHub Issue Expert
- `/issue` → GitHub Issue Expert
- `/figma` → GitHub Issue Expert
- `/review` → Code Review Expert
- `/db` → Database Drizzle Expert
- `/security` → Security Expert
- `/a11y` → Accessibility Expert
- `/research` → Architecture Research
- `/motion` → Remotion Skill

**Commands nutzen Rules:**

- Alle Commands respektieren automatisch `.claude/rules/*.md` basierend auf Datei-Pfaden
- `backend/**/*.ts` → `.claude/rules/backend.md`
- `frontend/**/*.tsx` → `.claude/rules/frontend.md`
- `backend/src/db/**/*.ts` → `.claude/rules/database.md`
- `**/*.test.ts` → `.claude/rules/testing.md`

---

## Externe Referenzen pro Command

**Häufigste externe Referenzen, die Commands typischerweise verwenden:**

### /work

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Workflow-Standards
- [docs/planung/arbeitsplan.md](../../docs/planung/arbeitsplan.md) - Projekt-Phasen, Priorisierung
- [AGENTS.md](AGENTS.md) - Agent-Auswahl, Verantwortlichkeiten, Team-Kompositionen
- [workflows.md](workflows.md) - Workflow-Diagramme (inkl. Agent Teams)
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Architektur-Kontext
- [docs/produkt/workflows.md](../../docs/produkt/workflows.md) - User-Journeys
- [.claude/prompts/teams/](prompts/teams/) - Agent Teams Templates (bei `--team` Flag)

### /issue

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Issue-Standards
- [.claude/prompts/issue-gold-standard-template.md](prompts/issue-gold-standard-template.md) - Issue-Template
- [docs/planung/arbeitsplan.md](../../docs/planung/arbeitsplan.md) - Projekt-Phasen, Milestones
- [docs/produkt/product.md](../../docs/produkt/product.md) - Feature-Kontext

### /review

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Code-Standards
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, Review-Kriterien
- [docs/technik/security.md](../../docs/technik/security.md) - Security-Checkliste
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Architektur-Compliance

### /db

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, DB-Standards
- [docs/technik/database-schema.md](../../docs/technik/database-schema.md) - DB-Schema, Relations
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Datenmodell, DB-Architektur
- [.claude/rules/database.md](rules/database.md) - Database-spezifische Rules

### /security

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Security-Standards
- [docs/technik/security.md](../../docs/technik/security.md) - Security-Konzept, OWASP, Auth-Flows
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Security-Architektur

### /a11y

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, A11y-Standards
- [docs/entwicklung/styling-rules.md](../../docs/entwicklung/styling-rules.md) - A11y-Patterns, WCAG
- [docs/produkt/app-layout.md](../../docs/produkt/app-layout.md) - UI-Struktur, Navigation

### /feature

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Feature-Standards
- [docs/produkt/product.md](../../docs/produkt/product.md) - Feature-Kontext, Vision
- [docs/produkt/workflows.md](../../docs/produkt/workflows.md) - User-Journeys
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Architektur-Kontext
- [AGENTS.md](AGENTS.md) - Agent-Auswahl

### /figma

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Design-Standards
- [docs/entwicklung/styling-rules.md](../../docs/entwicklung/styling-rules.md) - Design Tokens (Source of Truth)
- [docs/produkt/app-layout.md](../../docs/produkt/app-layout.md) - Routes/Screens
- [docs/technik/architecture/design-system.md](../../docs/technik/architecture/design-system.md) - Token Mapping
- [AGENTS.md](AGENTS.md) - Agent-Auswahl
- **MCP-Tools:** `get_design_context`, `get_screenshot`, `get_variable_defs`, `get_code_connect_map`

### /research

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Architektur-Prinzipien
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - System-Architektur
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards

### /audit-docs

- [docs/README.md](../../docs/README.md) - Dokumentations-Struktur
- [docs/entwicklung/contributing.md](../../docs/entwicklung/contributing.md) - Dokumentations-Standards
- [docs/entwicklung/doc-refactor-notes.md](../../docs/entwicklung/doc-refactor-notes.md) - Refactor-Notizen

### /cleanup

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Code-Standards
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - ESLint Rules, TypeScript-Standards
- [docs/technik/architecture.md](../../docs/technik/architecture.md) - Architektur-Kontext

### /test, /debug, /commit

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Workflow-Standards
- [docs/entwicklung/engineering-rules.md](../../docs/entwicklung/engineering-rules.md) - Code-Standards, Testing
- [.claude/rules/testing.md](rules/testing.md) - Testing-spezifische Rules
- [.claude/prompts/changelog-template.md](prompts/changelog-template.md) - CHANGELOG-Format und Regeln (für /commit)

### /done

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Commit-Standards
- [docs/planung/arbeitsplan.md](../../docs/planung/arbeitsplan.md) - Planungsdocs aktualisieren
- [.claude/prompts/changelog-template.md](prompts/changelog-template.md) - CHANGELOG-Format und Regeln

### /scan-issues, /review-issue, /improve-issues-batch

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Issue-Standards
- [.claude/prompts/issue-gold-standard-template.md](prompts/issue-gold-standard-template.md) - Issue-Template
- [.claude/prompts/review-issue-prompt.md](prompts/review-issue-prompt.md) - Review-Prompt für manuelle Issue-Prüfung
- [docs/planung/arbeitsplan.md](../../docs/planung/arbeitsplan.md) - Projekt-Phasen

### /review-week

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Workflow-Standards
- [docs/planung/arbeitsplan.md](../../docs/planung/arbeitsplan.md) - Aktuelle Phase, Priorisierung, Issue-Gruppierung

### /parallel-dispatch

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Agent-System
- [AGENTS.md](AGENTS.md) - Agent-Übersicht
- [COMMANDS.md](COMMANDS.md) - Command-Übersicht
- [workflows.md](workflows.md) - Workflow-Diagramme

### /motion

- [CLAUDE.md](../../CLAUDE.md) - Projekt-Kontext, Brand-Standards
- [video/src/design-tokens.ts](../../video/src/design-tokens.ts) - Farben, Typography, Springs
- [.claude/skills/remotion/SKILL.md](skills/remotion/SKILL.md) - Remotion Best Practices
- [docs/entwicklung/styling-rules.md](../../docs/entwicklung/styling-rules.md) - Brand Guidelines
- [.claude/prompts/motion/](prompts/motion/) - 7 Prompt-Templates
- [AGENTS.md](AGENTS.md) - motion-story-architect, motion-designer, motion-developer

---

**Siehe auch:** [workflows.md](workflows.md) für detaillierte Workflow-Diagramme
