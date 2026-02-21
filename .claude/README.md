# Claude Code Erweiterungen - Übersicht

Quick-Reference für Skills, Commands, Agents, Rules, Plugins.

**Version:** 1.0.0 | **Stand:** 2026-02-21

---

## Struktur

| Typ      | Speicherort          | Beispiele                                                          |
| -------- | -------------------- | ------------------------------------------------------------------ |
| Skills   | `.claude/skills/`    | Security Expert, Database Expert, GitHub Issue Expert              |
| Commands | `.claude/commands/`  | /work, /test, /commit, /review, /issue, /audit-docs, /scan-issues  |
| Agents   | `.claude/agents/`    | backend-architect, frontend-developer, debugger                    |
| Rules    | `.claude/rules/`     | Path-basierte Regeln (backend.md, frontend.md, database.md)        |
| Context  | `.claude/context/`   | design-principles.md, tech-stack.md, glossary.md                   |
| Plugins  | `~/.claude/plugins/` | code-simplifier, feature-dev, code-review, commit-commands, github |

---

## Details

Für vollständige Informationen siehe:

- [AGENTS.md](AGENTS.md) - Alle Agents mit Verantwortlichkeiten, Grenzen, Verknüpfungen
- [COMMANDS.md](COMMANDS.md) - Alle Commands mit Input/Output, Agent-Verknüpfungen, Skills
- [SKILLS.md](SKILLS.md) - Alle Skills mit Aktivierung, Verwendung in Commands/Agents
- [WORKFLOWS.md](WORKFLOWS.md) - Standard-Workflows, Entscheidungsmatrix, Entry Points

---

## Plugins (aktiviert)

| Plugin              | Scope   | Beschreibung                                                                                               |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| **code-simplifier** | user    | On-demand Code-Vereinfachung (nach langen Sessions / vor PRs). Bewahrt Funktionalität, verbessert Klarheit |
| **feature-dev**     | project | Geführte Feature-Entwicklung mit Codebase-Analyse und Architektur-Fokus                                    |
| **code-review**     | project | Code-Review für Pull Requests                                                                              |
| **commit-commands** | project | Git Commit-Befehle (/commit, /commit-push-pr, /clean_gone)                                                 |
| **github**          | system  | GitHub MCP Server für Issues, PRs, Repositories                                                            |

---

**Verwendung:** Bei Unklarheit welcher Agent/Command/Skill → zuerst diese Übersicht konsultieren, dann Detail-Docs.
