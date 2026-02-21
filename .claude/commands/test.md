# Test-Suite ausführen

Fuehrt technische Checks aus und erzeugt standardisierte Test-Protokolle für GitHub Issues.

## Quick Start

- Volltest: `/test`
- Nur TS: `/test quick`
- E2E-Tests: `/test e2e` (via /e2e Skill)
- Alles (Build + E2E): `/test all`
- Manuelles Chrome-Protokoll: `/test chrome` (Fallback)
- Chrome-Protokoll für Route: `/test chrome /dashboard` (Fallback)

## Default Workflow

```
/work #123
  -> Plan + Umsetzung

/test
  -> Technische Checks ausfuehren

/test e2e
  -> Playwright E2E-Tests (automatisch)

/test chrome /<route>
  -> Protokoll ins Issue posten (nur bei Playwright-Problemen)
```

## Command-Verhalten

### `/test` - Standard

Fuehrt folgende Checks aus:

```bash
# Repo Root - TypeScript Check
npx tsc --noEmit

# Frontend
cd frontend && npm run build && npm run lint

# Backend
cd ../backend && npm run build && npm run lint
```

**Output:**

```markdown
## Test-Ergebnis

**Datum:** [Heute]
**Issue:** #XXX
**Branch/Commit:** [branch] / [sha]
**Env:** local | staging

| Check          | Status  | Details     |
| -------------- | ------- | ----------- |
| Frontend Build | OK/FAIL | ...         |
| Backend Build  | OK/FAIL | ...         |
| TypeScript     | OK/FAIL | X Fehler    |
| Lint           | OK/FAIL | X Warnungen |

### Zusammenfassung

- Alle Tests bestanden / X Fehler gefunden
```

### `/test quick`

Nur TypeScript Check ohne vollständigen Build.

```bash
# Repo Root
npx tsc --noEmit
```

### `/test e2e`

Fuehrt Playwright E2E-Tests aus (via `/e2e` Skill):

```bash
# Nutzt den /e2e Command
/e2e                    # Vollständiger E2E-Test
/e2e /dashboard         # Spezifische Route
/e2e --debug            # Mit Debug-Modus
```

**Output:**

```markdown
## E2E Test-Ergebnis

**Datum:** [Heute]
**Issue:** #XXX
**Test-Modus:** Playwright E2E

| Test       | Status  | Details |
| ---------- | ------- | ------- |
| Homepage   | OK/FAIL | ...     |
| Navigation | OK/FAIL | ...     |
| Feature X  | OK/FAIL | ...     |

### Screenshots

- [Bei Fehlern automatisch erstellt]

### Zusammenfassung

- Alle E2E-Tests bestanden / X Fehler gefunden
```

**Vorteile gegenüber Chrome-Test:**

- Automatisch ausführbar (keine manuelle Interaktion)
- Screenshots bei Fehlern
- Konsistente Test-Logs
- Parallele Test-Ausführung möglich

### `/test chrome` - Manuelles Test-Protokoll (Fallback)

⚠️ **Hinweis:** Nur verwenden wenn Playwright-Tests nicht ausreichen oder bei Browser-spezifischen Problemen.

Generiert ein Template für manuelle Browser-Tests:

```markdown
## Chrome-Test Protokoll

**Datum:** [Heute]
**Browser:** Chrome [Version]
**Env:** local | staging
**User/Rolle:** anonymous | user | organizer | dj | admin
**Getestete Änderung:** Issue #XXX

### 1. Seite laden

- [ ] URL: /[path]
- [ ] Keine Console Errors
- [ ] Keine Network 500er
- [ ] Ladezeit < 3s

### 2. Happy Path

- [ ] Schritt 1: [Beschreibung] -> Erwartet: [X]
- [ ] Schritt 2: [Beschreibung] -> Erwartet: [X]
- [ ] Schritt 3: [Beschreibung] -> Erwartet: [X]

### 3. Edge Cases

- [ ] Refresh -> Seite laedt korrekt
- [ ] Back-Button -> Navigation funktioniert
- [ ] Deep-Link -> Direktaufruf funktioniert
- [ ] Leere Daten -> Empty State angezeigt
- [ ] Fehler -> Error State angezeigt

### 4. Responsive

- [ ] Desktop (1920px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### 5. Auth-Tests (falls relevant)

- [ ] Ohne Login -> Redirect zu /login
- [ ] Falsche Rolle -> 403 oder Redirect
- [ ] Token abgelaufen -> Refresh oder Logout

### Ergebnis

- [ ] BESTANDEN - Alle Tests OK
- [ ] FEHLGESCHLAGEN - Issues gefunden

### Gefundene Probleme

1. [Problem]: [Beschreibung]

### Artefakte (optional)

- Screenshots: [Link]
- Console-Export: [Link]
- HAR: [Link]
```

### `/test chrome /dashboard`

Generiert spezifisches Test-Template für eine Route mit vorausgefüllten Schritten.
PathVariable wird automatisch in URL-Pfad und Feature-Kontext übernommen.

### `/test all`

Fuehrt alle Checks aus (`/test`) und zusätzlich E2E-Tests via `/e2e`.
Kombiniert Standard-Test + E2E für vollständige Test-Dokumentation.

**Ablauf:**

1. TypeScript Check
2. Frontend Build + Lint
3. Backend Build + Lint
4. E2E-Tests via `/e2e` Skill

**Verwendung:** Vor wichtigen Commits oder vor Issue-Abschluss.

## Test-Checklisten nach Feature-Typ

### API-Endpoint

```markdown
- [ ] POST mit validen Daten -> 200/201
- [ ] POST mit invaliden Daten -> 400 + Fehlermeldung
- [ ] GET ohne Auth -> 401
- [ ] GET mit falscher Rolle -> 403
- [ ] GET nicht existierend -> 404
- [ ] Rate Limiting (falls konfiguriert)
```

### UI-Komponente

```markdown
- [ ] Rendert ohne Fehler
- [ ] Loading State sichtbar
- [ ] Error State bei API-Fehler
- [ ] Empty State bei leeren Daten
- [ ] Responsive auf allen Breakpoints
- [ ] Keyboard-Navigation möglich
- [ ] Dark Mode funktioniert
```

### Formular

```markdown
- [ ] Validation-Fehler werden angezeigt
- [ ] Submit-Button disabled waehrend Loading
- [ ] Erfolgs-Toast nach Submit
- [ ] Fehler-Toast bei API-Fehler
- [ ] Form-Reset nach Erfolg (falls gewuenscht)
```

### Datenbank-Migration

```markdown
- [ ] Migration laeuft durch (npm run db:migrate)
- [ ] Rollback möglich (npm run db:rollback)
- [ ] Bestehende Daten intakt
- [ ] Neue Spalten haben Default-Werte
- [ ] Foreign Keys korrekt
```

## Fehler-Handling

### Build-Fehler

```markdown
## Build fehlgeschlagen

**Fehler in:** frontend/src/features/X/Component.tsx:42

**Meldung:**
Property 'foo' does not exist on type 'Bar'

**Vorschlag:**

1. Typ-Definition prüfen
2. Import korrigieren
3. debugger Agent einsetzen
```

### Lint-Warnungen

```markdown
## Lint-Warnungen (nicht blockierend)

| Datei | Zeile | Regel          | Meldung                         |
| ----- | ----- | -------------- | ------------------------------- |
| X.tsx | 42    | no-unused-vars | 'foo' is defined but never used |

Soll ich diese automatisch fixen? [Ja/Nein]
```

## Quality Gates

### Blocker (kein Commit)

- Build FAIL (frontend oder backend)
- TypeScript FAIL

### Warnung (Commit ok, aber fix empfohlen)

- Lint Warnungen

### Pflicht für Abschluss von UI-Issues

- E2E-Test Protokoll im Issue dokumentiert (via `/test e2e`)
- Fallback: Chrome-Test Protokoll bei Browser-spezifischen Problemen
