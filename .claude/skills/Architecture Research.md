---
name: architecture-research
description: Architektur-Research und Feature-Planung. Verwenden bei Best Practices Research, Feature-Gebieten, Architektur-Review, Issue-Roadmaps.
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Bash
---

# Architecture Research

## Quick Reference

**Workflow:** Thema definieren → Web-Research → Projekt-Status → Issue-Analyse → 🔒 User-OK → Issues erstellen → Docs update

**Quality Gate:** PFLICHT vor Issue-Erstellung (User-Bestätigung erforderlich)

---

## Wann aktiv

Strategische Architektur, Feature-Gebiete, Roadmaps, System-Design, Tech-Debt-Analyse.

**NICHT für:** Bugfixes, triviale Refactorings, einzelne Komponenten.

---

## Workflow

```
1. Thema definieren
2. Nicht-Ziele & Constraints
3. Web-Research (Best Practices)
4. Projekt-Status (Reality Check)
5. Bestehende Issues prüfen
6. 🔒 Quality Gate: User-OK (PFLICHT!)
7. Issues erstellen/aktualisieren
8. Docs update (Trade-offs)
```

---

## Web-Research

**Quellengewichtung:**
1. Offizielle Docs
2. Large-Scale Engineering Blogs
3. Medium (nur mit Referenzen)

**Suchstrategie:**
- `<thema> best practices <jahr>`
- `<thema> architecture patterns`

**Immer angeben:** Jahr + Kontext (z.B. "2024, React 18, Vite")

---

## Projekt-Analyse (Reality Check)

**Prüfen:**
- ✅ Was ist produktiv genutzt?
- ⚠️ Was existiert nur auf dem Papier?
- ❌ Was ist deaktiviert? (Feature Flags, deprecated)

**Quellen:** architecture.md, workflows.md, app-layout.md

---

## Issue-Analyse

```bash
gh issue list --search "<thema>" --limit 50
gh issue list --state closed --search "<thema>" --limit 20
```

**Design-Entscheidungen prüfen:**
- Warum geschlossen?
- Explizite Trade-offs?
- Darf das nicht erneut aufgerollt werden?

---

## 🔒 Quality Gate (PFLICHT)

**⚠️ Kein Weitergehen ohne User-OK!**

```markdown
## Bestehende Features
| Feature | Status | Quelle |
|---------|--------|--------|
| ... | Implementiert | architecture.md |

## Fehlende Features
| # | Thema | Priorität | Warum jetzt? | Risiko wenn nicht? |
|---|-------|-----------|--------------|---------------------|
| 1 | ... | High | Begründung | Konsequenz |

## Issues zum Aktualisieren
| # | Titel | Änderung |
|---|-------|----------|
| #XX | ... | + Erweiterung |

## Abhängigkeiten / Risiken
- Blockiert durch #XXX
- Erfordert Migration Y
- Security/Legal Review nötig

## Nicht-Ziele & Constraints
- Out of scope: X
- Tech Stack Constraints: Y

Soll ich die Issues erstellen?
```

---

## Issue-Erstellung

**Nach User-OK:**
- Gold Standard Format (→ GitHub Issue Expert)
- Labels: typ, prio, bereich, domain, model
- Keine Duplikate (erweitern statt neu)
- Empfohlene Reihenfolge

**Trade-offs dokumentieren:**
- Warum diese Lösung?
- Warum nicht Alternative A/B?
- Kompromisse / Einschränkungen?

---

## Docs Update

**Nach Issue-Erstellung:**
- architecture.md (Patterns, Entscheidungen)
- workflows.md (User-Journeys)
- Trade-offs dokumentieren

---

## Best Practices

1. Immer zuerst fragen was existiert
2. User-Bestätigung vor Issue-Erstellung (Quality Gate!)
3. Keine Duplikate (erweitern statt neu)
4. Keine Zeit-Schätzungen
5. Referenzen mit Jahr + Kontext
6. Trade-offs dokumentieren (Pflicht!)

---

## Wann aktiv

Feature-Planung, Best Practices Research, Architektur-Review.
