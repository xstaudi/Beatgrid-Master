---
name: parallel-dispatcher
description: Parallele Agent-Dispatch für unabhängige Probleme. Verwenden bei mehreren Failures, verschiedenen Test-Dateien, unabhängigen Subsystemen, parallelem Debugging.
allowed-tools: Task, Read, Grep, Glob
---

# Parallel Agent Dispatch

## ⚠️ Wichtiger Hinweis

**Falsch eingesetzt erzeugt Parallelisierung mehr Chaos als Geschwindigkeit.**

Dieses Pattern ist **nur** für unabhängige Probleme geeignet. Bei gekoppelten Tasks führt Parallelisierung zu Merge-Konflikten, Inkonsistenzen und erhöhtem Debugging-Aufwand.

---

## Wann verwenden

- 3+ unabhängige Failures
- Verschiedene Test-Dateien / Subsysteme
- Probleme ohne gemeinsamen Kontext
- Keine Shared State zwischen Untersuchungen

**Unabhängig bedeutet:**
- Kein gemeinsamer State
- Keine gemeinsamen Types
- Keine gemeinsame Datenbank-Tabelle
- Keine gemeinsamen Dateien oder Verzeichnisse

## Wann NICHT verwenden

- Failures sind zusammenhaengend
- Agents wuerden dieselben Dateien editieren
- **Files liegen im selben Verzeichnis / Feature** (Harte Regel!)
- **Gemeinsame Shared Utilities / Types** (Harte Regel!)
- Volle System-Sicht nötig

**Harte Regel:** Kein paralleles Editieren desselben Pfads

**Warum:** Verhindert subtile Merge-Fehler.

---

## Workflow

### 1. Unabhängige Domains identifizieren

```
Failure A: Auth Tests → Domain: Authentication
Failure B: API Tests → Domain: API Layer
Failure C: UI Tests → Domain: Frontend
```

### 2. Fokussierte Agent-Tasks erstellen

Jeder Agent bekommt:
- Spezifischer Scope (eine Datei/ein Subsystem)
- Klares Ziel
- Constraints (nicht andere Bereiche ändern)
- Erwarteter Output

### 3. Parallel dispatchen

```typescript
Task("Fix auth.test.ts failures")
Task("Fix api.test.ts failures")
Task("Fix ui.test.ts failures")
// Alle drei laufen gleichzeitig
```

### 4. Ergebnisse integrieren

- Summaries lesen
- Auf Konflikte prüfen
- Full Test Suite laufen
- Alle Changes integrieren

---

## Agent Prompt Template

```markdown
Fix the failing tests in [FILE]:

1. [Test name] - [Expected vs Actual]
2. [Test name] - [Expected vs Actual]

Your task:
1. Read the test file
2. Identify root cause
3. Fix the issue
4. Do NOT change other files

Return:
- Root cause (Was war das Problem?)
- Fix summary (Was wurde geändert?)
- Risk / Side effects (Falls vorhanden)
```

---

## Common Mistakes

| ❌ Falsch | ✅ Richtig |
|-----------|-----------|
| "Fix all tests" | "Fix auth.test.ts" |
| Kein Kontext | Error messages + Test names |
| Keine Constraints | "Do NOT change X" |
| Vager Output | "Return summary of changes" |

---

## Vorteile

- **Parallelisierung** - 3 Probleme in Zeit von 1
- **Fokus** - Schmaler Scope pro Agent
- **Isolation** - Keine Interferenz
- **Klarheit** - Jeder Agent hat klare Aufgabe

---

## Nach Agent-Rueckkehr

1. Summaries reviewen (Root cause, Fix summary, Risks)
2. Auf Konflikte prüfen
3. Full Test Suite
4. Spot-Check der Änderungen

---

## Abgrenzung

**parallel-dispatcher:**
- Bugfix / Failures / Reparatur
- Unabhängige Probleme (verschiedene Dateien/Subsysteme)
- Build kaputt? → parallel-dispatcher

**subagent-driven-dev:**
- Feature-Implementierung / neue Funktionalität
- Mehrstufige Features mit Plan
- Feature bauen? → subagent-driven-dev

**Kombination:**
- Beide Patterns sind komplementär, aber explizit getrennte Use Cases
- Parallel Dispatch für Bug-Fixes und Test-Failures
- Subagent-Driven Dev für Features und Architektur-Änderungen

---

## When Parallel Dispatch Goes Wrong

**Anzeichen:**
- Merge-Konflikte bei Integration
- Inkonsistente Änderungen in gemeinsamen Dateien
- Tests schlagen nach Integration fehl (obwohl einzeln OK)
- Mehr Debugging-Zeit als erwartet

**Lösung:**
1. Tasks abbrechen
2. Abhängigkeiten neu identifizieren
3. Sequenziell abarbeiten (subagent-driven-dev) oder Tasks anders aufteilen
4. Klarere Isolation sicherstellen

---

## Einordnung im Gesamtsystem

Dieses Profil passt perfekt zu:

- **GitHub Issue Expert** → mehrere Bug-Issues parallel fixen
- **CI-Fixes / Test-Failures** → Build-Reparatur
- **Infrastruktur- & Wartungsarbeit** → unabhängige Refactors
- **Subagent-Driven Development** → explizit getrennte Use Cases

**Mentale Trennung:**
- Build kaputt? → **parallel-dispatcher**
- Feature bauen? → **subagent-driven-dev**
