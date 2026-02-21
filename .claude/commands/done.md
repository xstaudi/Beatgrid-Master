# Issue abschliessen

Commit - Push - Issue schliessen - Planungsdocs aktualisieren.

**Automatisiert den kompletten Abschluss-Workflow nach erfolgreicher Implementation.**

---

## Usage

```
/done #123              # Issue #123 abschliessen
/done #123 "message"    # Mit custom Commit-Message
```

---

## Was dieser Command macht

```
┌─────────────────────────────────────┐
│ 1. GIT STATUS                       │
│    - Geaenderte Dateien prüfen     │
│    - Nur relevante Dateien stagen   │
│    - .claude/, node_modules etc.    │
│      NICHT committen                │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 2. CODE REVIEW                      │
│    - /review ausfuehren             │
│    - Code-Qualitaet prüfen         │
│    - Sicherheits-Check              │
│    - Best Practices validieren      │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 3. PLANUNGSDOCS AKTUALISIEREN       │
│    - arbeitsplan.md                 │
│    - Issue als ✅ markieren         │
│    - Noch NICHT committen           │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 4. COMMIT                           │
│    - Message generieren             │
│    - Format: type: desc (Closes #X) │
│    - Implementation + Docs zusammen │
│    - Co-Authored-By: Claude         │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 5. PUSH                             │
│    - git push origin master         │
│    - Nur einmal pushen              │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 6. ISSUE SCHLIESSEN                 │
│    - gh issue close #X              │
│    - Mit Zusammenfassungs-Kommentar │
│    - Features/Fixes auflisten       │
└─────────────────────────────────────┘
```

---

## Commit-Message Format

```
<type>: <beschreibung> (Closes #XXX)

<optionaler body mit Details>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types

| Type     | Verwendung    |
| -------- | ------------- |
| feat     | Neues Feature |
| fix      | Bugfix        |
| docs     | Dokumentation |
| style    | Formatting    |
| refactor | Refactoring   |
| perf     | Performance   |
| test     | Tests         |
| chore    | Maintenance   |

---

## Dateien die NICHT committet werden

Diese Dateien werden automatisch ignoriert:

- `.claude/settings.local.json`
- `.claude/plans/*.md`
- `node_modules/`
- `.env*`
- `dist/`, `build/`

---

## Issue-Kommentar Format

```markdown
Implementiert in Commit <SHA>

**Features:**

- Feature 1
- Feature 2

**Dateien:**

- path/to/file1.tsx
- path/to/file2.ts
```

---

## Planungsdocs Update

Die Planungsdatei wird aktualisiert:

| Datei                         | Aktion                |
| ----------------------------- | --------------------- |
| `docs/planung/arbeitsplan.md` | `\|  \|` → `\| ✅ \|` |

Die Docs werden im gleichen Commit wie die Implementation committed.

---

## Beispiel

```
> /done #415

Prüfe git status...
3 Dateien geändert:
- frontend/src/components/shared/RefreshButton.tsx (neu)
- frontend/src/components/shared/index.ts
- frontend/src/features/events/pages/OrganizerEventDashboardPage.tsx

Fuehre Code Review durch...
✓ Keine kritischen Issues gefunden
✓ Best Practices eingehalten
✓ TypeScript Types korrekt
✓ Security-Check bestanden

Aktualisiere Planungsdocs...
- arbeitsplan.md: #415 als ✅ markiert

Generiere Commit-Message...

feat(dashboard): Add RefreshButton with visual feedback (Closes #415)

- Add RefreshButton component with idle/loading/success states
- Integrate in OrganizerEventDashboardPage header
- Toast notifications on success/error
- WCAG compliant
- Update arbeitsplan.md

Commit erstellt: abc1234
Push erfolgreich.

Issue #415 geschlossen mit Kommentar.

✅ Issue #415 vollständig abgeschlossen!
```

---

## Voraussetzungen

- Issue-Nummer muss angegeben werden
- Änderungen müssen vorhanden sein
- GitHub CLI (`gh`) muss authentifiziert sein
- Planungsdocs müssen das Issue enthalten

---

## Fehlerbehandlung

| Fehler               | Aktion                   |
| -------------------- | ------------------------ |
| Keine Änderungen    | Abbruch mit Hinweis      |
| Issue nicht gefunden | Abbruch mit Hinweis      |
| Push fehlgeschlagen  | Retry-Hinweis            |
| Issue nicht in Docs  | Warnung, aber fortfahren |

---

## Regeln

- **Immer Issue-Nummer angeben** - Kein anonymer Abschluss
- **Nur relevante Dateien** - Keine Config/Plan-Dateien
- **Closes statt Refs** - Issue wird geschlossen
- **Planungsdocs Pflicht** - Immer aktualisieren

---

## Verwandte Commands

| Command      | Zweck                        |
| ------------ | ---------------------------- |
| `/commit`    | Nur Commit (ohne Push/Close) |
| `/work #123` | Issue bearbeiten             |
| `/review`    | Code Review vor Abschluss    |
