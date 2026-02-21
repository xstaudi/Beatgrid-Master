# Agent Team: Full-Stack Feature

Parallele Entwicklung von Backend + Frontend für ein Feature.

---

## Voraussetzungen

- [ ] GitHub Issue existiert mit klaren Akzeptanzkriterien
- [ ] API-Contract (Types/DTOs) ist definiert BEVOR Agents starten
- [ ] File-Ownership-Map ist erstellt (keine Überschneidungen!)
- [ ] Beide Workspaces bauen (`npm run build` in backend + frontend)

## Model-Strategie (Kosten-Optimierung)

| Rolle                         | Model  | Begründung                                  |
| ----------------------------- | ------ | -------------------------------------------- |
| **Haupt-Agent (Lead)**        | Opus   | Orchestrierung, Contract-Design, Integration |
| **Agent 1: Backend**          | Sonnet | Fokussierte Implementation, 5x günstiger    |
| **Agent 2: Frontend**         | Sonnet | Fokussierte Implementation, 5x günstiger    |
| **Agent 3: Tests** (optional) | Haiku  | Read-Only Review, 10x günstiger             |

**Spawn mit Model:** `model: "sonnet"` im Task-Tool Parameter setzen.

---

## Team-Komposition

| Agent                         | Rolle                | Exklusive Dateien                    |
| ----------------------------- | -------------------- | ------------------------------------ |
| **Agent 1: Backend**          | `backend-architect`  | `backend/src/modules/[feature]/**`   |
| **Agent 2: Frontend**         | `frontend-developer` | `frontend/src/features/[feature]/**` |
| **Agent 3: Tests** (optional) | `code-reviewer`      | `**/*.test.ts`, `**/*.spec.ts`       |

---

## Ablauf

```
1. CONTRACT definieren (Haupt-Agent)
   - Shared Types/DTOs erstellen
   - API-Endpunkte spezifizieren
   - Response-Formate festlegen
   - Tasks mit TaskCreate erstellen
        |
2. FILE OWNERSHIP zuweisen
   - Backend-Agent: nur backend/**
   - Frontend-Agent: nur frontend/**
   - Shared Types: nur Haupt-Agent
   - Task-Dependencies via TaskUpdate(addBlockedBy) definieren
        |
3. PARALLEL SPAWNEN
   - Agent 1: Backend implementieren
   - Agent 2: Frontend implementieren
   - WICHTIG: Agents MÜSSEN TaskUpdate(completed) nach Abschluss aufrufen!
        |
4. INTEGRATION (Haupt-Agent)
   - TaskList prüfen bis alle Tasks completed
   - API-Contract prüfen
   - E2E-Test durchfuehren
   - Code Review
```

---

## Spawn-Prompts

### Agent 1: Backend

```
KRITISCH - TASK-MANAGEMENT (LIES DAS ZUERST!):
1. TaskGet({ taskId: "X" }) - Task-Details laden
2. TaskUpdate({ taskId: "X", status: "in_progress" }) - In Arbeit markieren
3. Arbeit erledigen
4. TaskUpdate({ taskId: "X", status: "completed" }) - PFLICHT! Blockiert sonst das Team!
5. TaskList() - Naechsten Task suchen
6. Bei shutdown_request: SendMessage({ type: "shutdown_response", ..., approve: true })

---

Du bist der Backend-Agent für Feature [NAME].

Deine EXKLUSIVEN Dateien:
- backend/src/modules/[feature]/routes.ts
- backend/src/modules/[feature]/controller.ts
- backend/src/modules/[feature]/service.ts
- backend/src/modules/[feature]/dtos.ts

API-Contract:
[HIER CONTRACT EINFUEGEN]

Regeln:
- NUR Dateien in backend/src/modules/[feature]/ bearbeiten
- Service ist einziger Ort für DB-Zugriffe
- Controller schlank halten
- Zod-Validation in dtos.ts
- Lies CLAUDE.md für Projekt-Standards
```

### Agent 2: Frontend

```
KRITISCH - TASK-MANAGEMENT (LIES DAS ZUERST!):
1. TaskGet({ taskId: "X" }) - Task-Details laden
2. TaskUpdate({ taskId: "X", status: "in_progress" }) - In Arbeit markieren
3. Arbeit erledigen
4. TaskUpdate({ taskId: "X", status: "completed" }) - PFLICHT! Blockiert sonst das Team!
5. TaskList() - Naechsten Task suchen
6. Bei shutdown_request: SendMessage({ type: "shutdown_response", ..., approve: true })

---

Du bist der Frontend-Agent für Feature [NAME].

Deine EXKLUSIVEN Dateien:
- frontend/src/features/[feature]/pages/
- frontend/src/features/[feature]/components/
- frontend/src/features/[feature]/hooks/
- frontend/src/features/[feature]/services/[feature].api.ts

API-Contract:
[HIER CONTRACT EINFUEGEN]

Regeln:
- NUR Dateien in frontend/src/features/[feature]/ bearbeiten
- API-Zugriffe nur über API-Client + React-Query-Hooks
- Design Tokens verwenden (keine hardcoded Farben)
- Loading/Error/Empty States implementieren
- Lies CLAUDE.md + docs/entwicklung/styling-rules.md
```

---

## File-Ownership-Map (KRITISCH!)

```
backend/src/modules/[feature]/**     → Agent 1 (Backend)
frontend/src/features/[feature]/**   → Agent 2 (Frontend)
backend/src/db/schema/[feature].ts   → Agent 1 (Backend)
shared/types/[feature].ts            → Haupt-Agent (VOR Parallel-Start)
```

**Regel:** Kein Agent darf Dateien bearbeiten, die einem anderen Agent gehoeren!

---

## Synchronisierungspunkt

Nach Abschluss beider Agents:

1. **API-Contract Verify:** Stimmen Request/Response-Typen überein?
2. **Build Check:** `npm run build` in beiden Workspaces
3. **Integration Test:** Frontend-Hook ruft Backend-Endpoint korrekt auf
4. **ESLint:** `TaskCompleted` Hook validiert automatisch
5. **Code Review:** `/review` auf alle geänderten Dateien

---

## Wann NICHT verwenden

- Feature betrifft nur Backend ODER nur Frontend
- Weniger als 30 Min Arbeit pro Agent
- Starke Abhängigkeiten zwischen Backend und Frontend (sequenziell besser)
- Unklarer API-Contract (erst Contract definieren, dann Team starten)
