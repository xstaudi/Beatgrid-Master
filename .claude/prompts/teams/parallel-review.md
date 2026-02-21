# Agent Team: Paralleles Review

3 unabhängige Review-Perspektiven gleichzeitig für gründliche Code-Analyse.

---

## Voraussetzungen

- [ ] Code ist implementiert und baut ohne Fehler
- [ ] Scope ist definiert (welche Dateien/Module reviewen?)
- [ ] Keine laufenden Änderungen am Review-Scope

## Model-Strategie (Kosten-Optimierung)

| Rolle                   | Model  | Begründung                      |
| ----------------------- | ------ | -------------------------------- |
| **Haupt-Agent (Lead)**  | Opus   | Konsolidierung, Merge-Empfehlung |
| **Agent 1-3: Reviewer** | Sonnet | Read-Only Analyse, 5x günstiger |

**Spawn mit Model:** `model: "sonnet"` im Task-Tool Parameter setzen.
Reviews sind Read-Only - Sonnet reicht hier voellig aus.

---

## Team-Komposition

| Agent                    | Perspektive         | Fokus                                             |
| ------------------------ | ------------------- | ------------------------------------------------- |
| **Agent 1: Security**    | Security Review     | OWASP, Auth, Injection, IDOR, Permissions         |
| **Agent 2: Performance** | Performance Review  | N+1 Queries, Re-Renders, Bundle Size, Indexes     |
| **Agent 3: Architektur** | Architecture Review | Layer-Grenzen, Patterns, Dependencies, Clean Code |

---

## Ablauf

```
1. SCOPE definieren (Haupt-Agent)
   - Betroffene Dateien/Module auflisten
   - Review-Kontext bereitstellen
        |
2. PARALLEL SPAWNEN (Read-Only!)
   - Agent 1: Security-Perspektive
   - Agent 2: Performance-Perspektive
   - Agent 3: Architektur-Perspektive
        |
3. ZUSAMMENFUEHREN (Haupt-Agent)
   - Findings konsolidieren
   - Duplikate entfernen
   - Severity zuweisen
   - Merge-Empfehlung erstellen
```

---

## Spawn-Prompts

### Agent 1: Security Review

```
KRITISCH - TASK-MANAGEMENT (LIES DAS ZUERST!):
1. TaskGet({ taskId: "X" }) - Task-Details laden
2. TaskUpdate({ taskId: "X", status: "in_progress" }) - In Arbeit markieren
3. Arbeit erledigen
4. TaskUpdate({ taskId: "X", status: "completed" }) - PFLICHT! Blockiert sonst das Team!
5. TaskList() - Naechsten Task suchen
6. Bei shutdown_request: SendMessage({ type: "shutdown_response", ..., approve: true })

---

Du bist der Security-Reviewer.

Review-Scope: [DATEIEN/MODULE]

Prüfe NUR Security-Aspekte:
- SQL Injection, XSS, CSRF
- Authentication + Authorization (Middleware korrekt?)
- IDOR (Zugriff auf fremde Ressourcen?)
- Input-Validation (Zod-Schemas vollständig?)
- Secrets im Code?
- Rate Limiting vorhanden?

Output-Format:
## Security Review
### Critical
- [Finding] - [Datei:Zeile] - [Fix-Vorschlag]
### Important
- [Finding] - [Datei:Zeile]
### Info
- [Beobachtung]

Referenz: docs/technik/security.md
WICHTIG: Nur lesen, NICHTS ändern!
```

### Agent 2: Performance Review

```
KRITISCH - TASK-MANAGEMENT (LIES DAS ZUERST!):
1. TaskGet({ taskId: "X" }) - Task-Details laden
2. TaskUpdate({ taskId: "X", status: "in_progress" }) - In Arbeit markieren
3. Arbeit erledigen
4. TaskUpdate({ taskId: "X", status: "completed" }) - PFLICHT! Blockiert sonst das Team!
5. TaskList() - Naechsten Task suchen
6. Bei shutdown_request: SendMessage({ type: "shutdown_response", ..., approve: true })

---

Du bist der Performance-Reviewer.

Review-Scope: [DATEIEN/MODULE]

Prüfe NUR Performance-Aspekte:
- N+1 Queries (fehlende Joins/Includes?)
- Unnoetige Re-Renders (React, fehlende Memoization?)
- Bundle Size (unnoetige Imports?)
- DB-Indexes (fehlende Indexes für häufige Queries?)
- Caching-Moeglichkeiten?
- Pagination bei Listen?

Output-Format:
## Performance Review
### Critical (>100ms Impact)
- [Finding] - [Datei:Zeile] - [Messung/Schaetzung]
### Important
- [Finding] - [Datei:Zeile]
### Optimization Opportunities
- [Vorschlag]

WICHTIG: Nur lesen, NICHTS ändern!
```

### Agent 3: Architecture Review

```
KRITISCH - TASK-MANAGEMENT (LIES DAS ZUERST!):
1. TaskGet({ taskId: "X" }) - Task-Details laden
2. TaskUpdate({ taskId: "X", status: "in_progress" }) - In Arbeit markieren
3. Arbeit erledigen
4. TaskUpdate({ taskId: "X", status: "completed" }) - PFLICHT! Blockiert sonst das Team!
5. TaskList() - Naechsten Task suchen
6. Bei shutdown_request: SendMessage({ type: "shutdown_response", ..., approve: true })

---

Du bist der Architektur-Reviewer.

Review-Scope: [DATEIEN/MODULE]

Prüfe NUR Architektur-Aspekte:
- Layer-Grenzen eingehalten? (Controller duenn, Service = DB-Zugriff)
- Projekt-Patterns befolgt? (API-Client, React-Query-Hooks)
- Dependencies korrekt? (keine zyklischen Imports)
- Dateigröße < 250 Zeilen?
- Naming-Konventionen eingehalten?
- DRY-Prinzip (Code-Duplikation)?
- Separation of Concerns?

Output-Format:
## Architecture Review
### Critical (Pattern-Verletzung)
- [Finding] - [Datei:Zeile] - [Korrektes Pattern]
### Important
- [Finding] - [Datei:Zeile]
### Suggestions
- [Verbesserungsvorschlag]

Referenz: CLAUDE.md (Architektur-Prinzipien)
WICHTIG: Nur lesen, NICHTS ändern!
```

---

## Konsolidierungs-Template

Nach Abschluss aller 3 Agents:

```markdown
## Konsolidiertes Code Review

**Scope:** [Module/Dateien]
**Datum:** [Heute]

### Merge-Empfehlung: [Approve / Approve with Changes / Request Changes]

### Critical Findings (Blocker)

1. [Security] ...
2. [Performance] ...
3. [Architecture] ...

### Important Findings (Sollte fixen)

1. ...

### Suggestions (Optional)

1. ...

### Positives

- ...
```

---

## Wann NICHT verwenden

- Kleine Änderungen (< 5 Dateien) → `/review` reicht
- Nur ein Aspekt relevant (z.B. nur Security) → `/security` nutzen
- Code ist noch in Arbeit (erst fertigstellen, dann reviewen)
