---
name: subagent-driven-dev
description: Plan-Execution mit frischen Subagents und Two-Stage Review. Verwenden bei Implementation-Plans, mehrstufigen Features, TDD-Workflows, Quality-Gate Prozessen.
allowed-tools: Task, Read, Grep, Glob, Edit, Write, Bash, TodoWrite
---

# Subagent-Driven Development

## Kernprinzip

Frischer Subagent pro Task + Two-Stage Review = Hohe Qualität, schnelle Iteration

---

## Wann verwenden

- **Implementation-Plan vorhanden** (siehe Definition unten)
- Tasks weitgehend unabhängig
- In derselben Session bleiben wollen
- Qualitäts-Gates gewünscht

### Plan-Definition (Pflicht)

Ein Plan gilt als vorhanden, wenn er mindestens enthält:
- **Ziel / Definition of Done** (was soll erreicht werden?)
- **Explizite Tasks** (umsetzbar, nicht abstrakt)
- **Betroffene Files/Module** (oder klarer Scope)
- **Bekannte Risiken oder offene Fragen** (optional, aber empfohlen)

❌ **Nicht ausreichend:** "Implementiere Feature X" ohne Tasks oder Scope

## Wann NICHT verwenden

- Kein Plan vorhanden
- Tasks stark gekoppelt
- Explorative Arbeit

---

## Workflow

**Controller View:**
```
Plan lesen → Tasks extrahieren → TodoWrite erstellen
                    ↓
    ┌───────────────────────────────┐
    │        Pro Task:              │
    │  1. Implementer dispatchen    │
    │     (status: in_progress)     │
    │  2. Spec Review               │
    │     (status: spec_review)     │
    │  3. Quality Review            │
    │     (status: quality_review)  │
    │  4. Task als done markieren   │
    │     (status: done)            │
    └───────────────────────────────┘
                    ↓
        Final Review → Done
```

**Subagent View (Implementer):**
- Task aus TodoWrite lesen
- Implementieren + Tests
- Self-Review
- Committen
- Status auf `spec_review` setzen

---

## Phase 1: Implementer

Subagent implementiert:
- Versteht Task aus Plan
- Fragt bei Unklarheiten (Status: `blocked` bis geklärt)
- Implementiert + Tests
- Self-Review
- Committed
- Status: `todo` → `in_progress` → `spec_review`

**TodoWrite Status-Semantik:**
- `todo` – noch nicht gestartet
- `in_progress` – Implementer aktiv
- `spec_review` – wartet auf Spec Review
- `quality_review` – wartet auf Quality Review
- `blocked` – offene Frage / Entscheidung nötig
- `done` – abgeschlossen

---

## Phase 2: Spec Review

**Scope (Pflicht):** Prüft ausschließlich:
- **Funktionalität** – Alle Requirements erfüllt?
- **Vollständigkeit** – Nichts vergessen?
- **Abweichungen vom Plan** – Nichts Überflüssiges?

**Nicht Bestandteil:**
- ❌ Code Style
- ❌ Performance-Optimierungen
- ❌ Refactoring-Vorschläge

**Tests (Pflicht):**
- Spec Review prüft **Existenz & Relevanz** der Tests
- Sind Edge Cases abgedeckt?
- Deckt der Test die Funktionalität ab?

**Abbruch-Regel:**
- Wenn der Plan als Ganzes falsch oder unvollständig ist:
  → Task abbrechen (Status: `blocked` oder `todo`)
  → Plan aktualisieren
  → Neues TodoWrite erstellen
  → ❌ **NICHT:** Plan-Fixen im Code

Bei Issues → Implementer fixt → Re-Review (Status bleibt `spec_review` bis OK)
Bei OK → Status: `quality_review`

---

## Phase 3: Quality Review

**Prüft Code-Qualität (Checkliste):**
- [ ] Keine `any` / keine unnötigen Type Assertions
- [ ] Kein ungenutzter Code (Imports, Variablen, Functions)
- [ ] Keine unnötigen Re-Renders / Effects
- [ ] Error Handling vorhanden
- [ ] Konsistenz mit Projekt-Guidelines (Design, TS, A11y)
- [ ] Performance: Keine offensichtlichen Bottlenecks
- [ ] Security: Input Validation, Auth Checks

**Test-Qualität (Pflicht):**
- Quality Review prüft **Test-Qualität** (Abdeckung, Edge Cases)
- Sind Tests wartbar und verständlich?
- Gibt es flaky tests?

**Optionale Regel:**
- Quality Review darf Änderungen verlangen, auch wenn Spec erfüllt ist
- Begründung erforderlich

Bei Issues → Implementer fixt → Re-Review (Status bleibt `quality_review` bis OK)
Bei OK → Status: `done`

---

## Regeln

### Niemals:
- Reviews überspringen
- Mit offenen Issues weitermachen
- Mehrere Implementer parallel (Konflikte!)
- Quality Review vor Spec Review
- Plan-Fixen im Code (→ Plan aktualisieren, neues TodoWrite)

### Immer:
- Agent-Fragen beantworten
- Re-Review nach Fixes
- TodoWrite aktuell halten (Status korrekt setzen)
- Spec Review vor Quality Review (getrennt durchführen)

---

## Vorteile

| Aspekt | Vorteil |
|--------|---------|
| Frischer Kontext | Keine Context-Pollution |
| Two-Stage Review | Spec + Quality getrennt |
| Same Session | Kein Handoff nötig |
| Quality Gates | Issues frueh fangen |
| Klare Rollen | Spec vs. Quality getrennt |
| Transparenz | Status-Tracking via TodoWrite |

**Einsatzbereich:**
- ✅ **Perfekt für:** größere Refactors, neue Module, Architektur-Änderungen
- ⚠️ **Optional für:** kleinere Tasks (Quick Wins, Bug-Fixes ohne Architektur-Impact)

---

## Kosten

- Mehr Subagent-Invocations
- Review-Loops brauchen Zeit
- Controller macht mehr Prep

**Aber:** Frueh gefangene Issues sind billiger als spaetes Debugging
