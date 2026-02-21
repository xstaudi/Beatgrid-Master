# Model-Switching Guide

**Problem:** Das `opusplan` Model-Alias (automatischer Wechsel Opus → Sonnet) ist buggy und unzuverlässig.

**Lösung:** Manuelles Switching über CLI-Commands.

---

## Quick Reference

| Szenario | Command | Model | Begründung |
|----------|---------|-------|------------|
| **Plan-Phase** | `/model opus` | Opus 4.6 | Komplexe Architektur, Multi-System, DB-Schema |
| **Execution-Phase** | `/model sonnet` | Sonnet 4.5 | Code-Implementation, 5x günstiger |
| **Analyse/Review** | `/model haiku` | Haiku 4.5 | Read-Only, 15x günstiger |

---

## Workflow

### 1. Plan-Phase (Opus)

```bash
/model opus
```

**Wann verwenden:**
- `/plan #XXX` - Implementierungsplan erstellen
- `/feature` Phase 0-1 - Architektur-Entscheidungen
- `/work #XXX` Plan-Phase - Issue-Analyse + Scope-Definition
- DB-Schema-Design - Komplexe Relations
- Security-Patterns - Auth-Flows, Permissions
- Multi-System-Integration - Event Bus, Queue-Orchestrierung

**Kosten:** ~3 Cent/1K Output-Tokens

---

### 2. Execution-Phase (Sonnet)

```bash
/model sonnet
```

**Wann verwenden:**
- `/work #XXX` Implementation - Code schreiben
- `/feature` Phase 2-4 - Feature-Development
- UI-Komponenten - React, shadcn/ui
- Bug-Fixes - Root-Cause bekannt
- CRUD-Operationen - Standard API-Endpunkte
- Refactoring - Pattern bekannt
- Tests schreiben - Unit/Integration

**Kosten:** ~0.6 Cent/1K Output-Tokens (5x günstiger als Opus)

---

### 3. Analyse-Phase (Haiku)

```bash
/model haiku
```

**Wann verwenden:**
- `/review` - Code-Review (Read-Only)
- Bundle-Analyse - Performance-Checks
- Docs-Audit - Dokumentations-Qualität
- Issue-Scanning - GitHub Issues durchsuchen
- Grep/Search-Tasks - Codebase-Suche

**Kosten:** ~0.2 Cent/1K Output-Tokens (15x günstiger als Opus)

---

## Best Practices

### ✅ DO

- **Immer zu Opus wechseln** vor Plan-Phase (`/plan`, `/feature`, `/work` Anfang)
- **Immer zu Sonnet wechseln** vor Implementation (`/work` GO-Phase, Code schreiben)
- **Immer zu Haiku wechseln** für Read-Only-Tasks (Review, Analyse)
- **Model-Check** vor jedem Command (Status-Line zeigt aktuelles Model)

### ❌ DON'T

- **Kein Opus für Simple Tasks** (UI-Komponenten, Bug-Fixes, Tests)
- **Kein Sonnet für Architektur** (DB-Schema, Multi-System, Security)
- **Kein Haiku für Code-Änderungen** (nur für Read-Only!)

---

## Status-Line Integration

Die Status-Line zeigt das aktuelle Model:

```
[Opus 4.6] 🚀 Warp 3 | Fuel 85% | 450ly | ✨⭐🌟 | The Weekend
[Sonnet 4.5] 🛸 Warp 5 | Fuel 42% | 890ly | ✨⭐🌟 | The Weekend
[Haiku 4.5] 🆘 Warp 1 | Fuel 12% | 120ly | ✨⭐🌟 | The Weekend
```

**Model immer vor Command prüfen!**

---

## Agent Teams Model-Strategie

Bei Agent Teams (`/work --team`, `/feature --team`):

| Rolle | Model | Wie setzen? |
|-------|-------|-------------|
| **Team Lead (Main Session)** | Opus | `/model opus` VOR Team-Start |
| **Teammates** | Sonnet | Automatisch via `CLAUDE_CODE_SUBAGENT_MODEL: "sonnet"` |
| **Read-Only-Agents** | Haiku | `model: "haiku"` beim Task-Spawn |

**Workflow:**
1. **Vor Team-Start:** `/model opus` ausführen
2. **Team spawnen:** `/work #XXX --team` oder `/feature --team`
3. **Lead bleibt Opus**, Teammates automatisch Sonnet
4. **Nach Team-Ende:** Model bleibt auf Opus (für nächsten Workflow)

**Konfiguriert via:**
- `.claude/settings.local.json` → `"model": "opus"` (Main Session Default)
- `.claude/settings.local.json` → `"CLAUDE_CODE_SUBAGENT_MODEL": "sonnet"` (Teammates)

**WICHTIG:** Lead **IMMER** auf Opus setzen vor Agent Teams!

---

## Automatisierung (Optional)

### Alias-Setup (Bash/Zsh)

```bash
# ~/.bashrc oder ~/.zshrc
alias opus='echo "/model opus" | claude'
alias sonnet='echo "/model sonnet" | claude'
alias haiku='echo "/model haiku" | claude'
```

**Nutzung:**
```bash
opus    # Wechselt zu Opus
sonnet  # Wechselt zu Sonnet
haiku   # Wechselt zu Haiku
```

---

## GitHub Issues

**Bekannte Bugs:**
- [#6108](https://github.com/anthropics/claude-code/issues/6108) - Opus Plan Mode: Automatic Model Switching Failure
- [#8358](https://github.com/anthropics/claude-code/issues/8358) - Bring back "opusplan", why did you remove it in v2.0.0?
- [#5990](https://github.com/anthropics/claude-code/issues/5990) - `opusplan` mode falls back to wrong Sonnet version
- [#12834](https://github.com/anthropics/claude-code/issues/12834) - `opusplan` uses Opus 4.1 instead of 4.5

**Status:** `opusplan` ist bekannt, aber unzuverlässig → manuelles Switching empfohlen.

---

## TLDR

1. **Plan:** `/model opus` (teuer, aber präzise)
2. **Code:** `/model sonnet` (günstig, fokussiert)
3. **Review:** `/model haiku` (sehr günstig, Read-Only)

**Aktuelles Model:** Status-Line oben rechts (z.B. `[Opus 4.6]`)

---

**Version:** 1.0 | **Updated:** 2026-02-11
