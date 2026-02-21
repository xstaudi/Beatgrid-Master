# Agent Team: Cross-Modul Refactoring

Gleiches Pattern/Änderung über mehrere Module parallel anwenden.

---

## Voraussetzungen

- [ ] Refactoring-Pattern ist definiert und getestet (an einem Modul manuell bestätigt!)
- [ ] Betroffene Module sind identifiziert
- [ ] Module sind voneinander unabhängig (keine Cross-Module-Imports im Refactoring-Scope)
- [ ] Build ist gruen vor Start

## Model-Strategie (Kosten-Optimierung)

| Rolle                     | Model  | Begründung                                    |
| ------------------------- | ------ | ---------------------------------------------- |
| **Haupt-Agent (Lead)**    | Opus   | Pattern-Definition, Verify, Konsistenz-Check   |
| **Agent 1-N: Refactorer** | Sonnet | Pattern-Anwendung ist repetitiv, 5x günstiger |

**Spawn mit Model:** `model: "sonnet"` im Task-Tool Parameter setzen.
Pattern-Anwendung ist hochgradig repetitiv - Sonnet genügt hier.

---

## Team-Komposition

| Agent       | Rolle               | Exklusive Module |
| ----------- | ------------------- | ---------------- |
| **Agent 1** | `backend-architect` | Module A, B      |
| **Agent 2** | `backend-architect` | Module C, D      |
| **Agent N** | `backend-architect` | Module E, F      |

**Faustregel:** Max 2-3 Module pro Agent, max 3-4 Agents parallel.

---

## Ablauf

```
1. PATTERN DEFINIEREN (Haupt-Agent)
   - Refactoring an EINEM Modul manuell durchfuehren
   - Ergebnis als Referenz dokumentieren
   - Pattern-Beschreibung erstellen
        |
2. MODULE ZUWEISEN
   - Jeder Agent bekommt N Module
   - File-Ownership-Map erstellen
   - Keine Überschneidungen!
        |
3. PARALLEL SPAWNEN
   - Jeder Agent wendet Pattern auf seine Module an
   - Agents arbeiten unabhaengig
        |
4. VERIFY (Haupt-Agent)
   - Build + Lint prüfen
   - Konsistenz zwischen Modulen prüfen
   - Code Review auf Vollständigkeit
```

---

## Spawn-Prompt (Template für jeden Agent)

```
KRITISCH - TASK-MANAGEMENT (LIES DAS ZUERST!):
1. TaskGet({ taskId: "X" }) - Task-Details laden
2. TaskUpdate({ taskId: "X", status: "in_progress" }) - In Arbeit markieren
3. Arbeit erledigen
4. TaskUpdate({ taskId: "X", status: "completed" }) - PFLICHT! Blockiert sonst das Team!
5. TaskList() - Naechsten Task suchen
6. Bei shutdown_request: SendMessage({ type: "shutdown_response", ..., approve: true })

---

Du bist Refactoring-Agent für folgende Module:
- [MODUL_1]: backend/src/modules/[modul_1]/
- [MODUL_2]: backend/src/modules/[modul_2]/

Deine EXKLUSIVEN Dateien:
- backend/src/modules/[modul_1]/**
- backend/src/modules/[modul_2]/**

Refactoring-Pattern:
[PATTERN-BESCHREIBUNG]

Referenz-Beispiel (bereits umgesetzt):
[DATEI + DIFF DES MANUELL REFACTORTEN MODULS]

Regeln:
- NUR deine zugewiesenen Module bearbeiten
- Pattern EXAKT wie im Referenz-Beispiel anwenden
- Bei Unklarheiten: NICHT raten, sondern stoppen und fragen
- Lies CLAUDE.md für Projekt-Standards
- Nach Abschluss: Build prüfen (`npm run build`)
```

---

## File-Ownership-Map (KRITISCH!)

```
backend/src/modules/auth/**          → Agent 1
backend/src/modules/users/**         → Agent 1
backend/src/modules/events/**        → Agent 2
backend/src/modules/bookings/**      → Agent 2
backend/src/modules/notifications/** → Agent 3
backend/src/modules/social/**        → Agent 3
```

**Shared Dateien (NUR Haupt-Agent):**

```
backend/src/db/schema/**             → Haupt-Agent (VOR Parallel-Start)
backend/src/services/shared/**       → Haupt-Agent (VOR Parallel-Start)
```

---

## Typische Refactoring-Szenarien

| Szenario                         | Module                   | Pattern                              |
| -------------------------------- | ------------------------ | ------------------------------------ |
| Service-Methode standardisieren  | Alle Module mit Services | Einheitliche Error-Handling-Struktur |
| DTO-Validation hinzufügen       | Module ohne Zod-Schemas  | dtos.ts mit Zod-Schemas erstellen    |
| Response-Format vereinheitlichen | Alle API-Module          | `{ data, meta, errors }` Format      |
| Logger-Integration               | Alle Module              | Structured Logging hinzufügen       |
| Permission-Check migrieren       | Auth-relevante Module    | Middleware-Pattern aktualisieren     |

---

## Synchronisierungspunkt

Nach Abschluss aller Agents:

1. **Build Check:** `npm run build` (Backend + Frontend wenn betroffen)
2. **Konsistenz-Check:** Alle Module folgen dem gleichen Pattern
3. **Vollständigkeit:** Kein Modul vergessen?
4. **ESLint:** `TaskCompleted` Hook validiert automatisch
5. **Grep-Verify:** Altes Pattern darf nicht mehr vorkommen

```bash
# Beispiel: Prüfen ob altes Pattern noch existiert
grep -r "oldPattern" backend/src/modules/ --include="*.ts"
```

---

## Wann NICHT verwenden

- Weniger als 3 Module betroffen (sequenziell schneller)
- Module haben starke Abhängigkeiten zueinander
- Pattern ist noch nicht getestet (erst an einem Modul validieren!)
- Shared Dateien müssen geändert werden (erst shared, dann parallel)
