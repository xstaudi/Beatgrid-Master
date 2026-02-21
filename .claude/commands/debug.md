# Debugging durchfuehren

Systematisches Debugging für Errors und Failures.

**Wann nutzen?** Akute Fehler (lokal oder Production), sporadische Bugs, Test-Failures – immer wenn du die Ursache eines konkreten Problems finden musst.

→ **Viele Bugs gleichzeitig?** Nutze `/parallel-dispatch` statt mehrere `/debug` Calls.

**Kritisch:** Jeder Fix wird auf technische Korrektheit, UX-Auswirkungen, Accessibility, Security und Design-System-Konsistenz geprüft.

## Usage
```
/debug                 # Interaktiv: Schritt-für-Schritt Dialog
/debug "Error msg"     # Direkt: Spezifischer Error/Exception
/debug test            # Modus: Test-Failures analysieren
/debug 500             # Kategorie: HTTP 500 Errors (oder andere Codes)
```

## Workflow

### 1. Fehler erfassen
```
Was: Fehlermeldung / unerwartetes Verhalten
Wo: Frontend / Backend / Datenbank
Wann: Immer / Sporadisch / Nach bestimmter Aktion
Wer: Alle User / Bestimmte Rolle / Bestimmter User
```

### 2. Reproduktion
- Exakte Schritte dokumentieren
- Minimales Reproduktions-Szenario finden
- Umgebung prüfen (Dev/Prod, Browser, etc.)

### 3. Isolation
- Stack Trace analysieren
- Letzte Code-Änderungen prüfen (`git log`, `git diff`)
- Betroffene Layer identifizieren

### 3b. Impact-Analyse (vor Fix)
**Kritisch:** Bevor ein Fix implementiert wird, muss der potenzielle Impact analysiert werden.

- Welche anderen Flows nutzen denselben Code?
- Gibt es Abhängigkeiten (Frontend/Backend)?
- Welche User-Rollen/Features sind betroffen?
- Gibt es Tests, die ebenfalls angepasst werden müssen?

**Stop-the-Line:** Bei Sicherheitsrisiken oder kritischen Abhängigkeiten → Issue erstellen und eskalieren.

### 4. Diagnose & Fix
- Hypothese bilden und testen
- Minimalen Fix implementieren (nur bei einfachen Fixes)
- **Impact-Analyse beruecksichtigen** (siehe 3b)

**Bei komplexen Fixes:** → `frontend-developer` oder `backend-architect` konsultieren (siehe Abgrenzung)

### 4b. UX-Verifikation (Pflicht bei Frontend-Bugs)
Nach technischem Fix muss die User-Experience verifiziert werden:

- [ ] Fehlermeldung für User verstaendlich?
- [ ] Retry/Recovery möglich?
- [ ] Loading/Error/Empty States korrekt?
- [ ] Keine neuen UI-Regressionen
- [ ] Feedback-Mechanismen funktionieren (Toasts, Notifications)

### 4c. Accessibility-Check (bei UI-Fixes)
**Pflicht:** Jeder UI-Fix muss auf A11y-Auswirkungen geprüft werden:

- [ ] Fokus-Reihenfolge intakt
- [ ] Keyboard weiterhin bedienbar
- [ ] Fehlermeldungen für Screenreader erkennbar (aria-live)
- [ ] Keine reinen Click-Fixes ohne Keyboard-Fallback
- [ ] Disabled Buttons mit aria-disabled
- [ ] Modals/Navigation behalten Fokus-Management

### 4d. Safety & Security-Check (Pflicht)
**Kritisch:** Explizite Sicherheitsprüfung nach jedem Fix:

- [ ] Keine sensiblen Daten in Logs/Errors (Tokens, PII)
- [ ] Auth-/Permission-Checks nicht umgangen
- [ ] Fehlercodes korrekt (401 vs 403 vs 500)
- [ ] Keine Stacktraces im UI (nur in Dev)
- [ ] Keine "Temporary Fixes", die Checks umgehen
- [ ] Input-Validierung weiterhin aktiv

**Stop-the-Line:** Bei Sicherheitsrisiken → Fix stoppen, Issue mit `typ:security,prio:critical` erstellen.

### 4e. Design-System-Konsistenz (bei UI-Fixes)
- [ ] Keine Inline-Styles oder Quick-Fixes
- [ ] Bestehende UI-Komponenten verwendet (`frontend/src/components/ui/`)
- [ ] Design Tokens respektiert (siehe `docs/entwicklung/styling-rules.md`)
- [ ] Dark Mode kompatibel

### 5. Verifikation & Regression
- Technische Verifikation (Funktioniert es wieder?)
- **UX-Verifikation** (siehe 4b)
- **A11y-Verifikation** (siehe 4c)
- **Security-Verifikation** (siehe 4d)
- **Design-System-Verifikation** (siehe 4e)

### 5b. Regression-Check
**Explizit prüfen:**

- [ ] Betroffene Features funktionieren weiterhin
- [ ] Andere User-Flows nicht beeintraechtigt
- [ ] Keine neuen Console-Errors/Warnings
- [ ] Performance nicht verschlechtert
- [ ] Tests (falls vorhanden) weiterhin gruen

**Bei Regressionen:**
- Fix zurücknehmen oder anpassen
- Issue mit Regression-Details erstellen

## Stop-the-Line-Mechanismus

**Kritische Situationen, bei denen gestoppt und eskaliert werden muss:**

1. **Sicherheitsrisiken:**
   - Auth-Checks umgangen
   - Sensible Daten in Logs/Errors
   - SQL-Injection-Risiko
   - → Issue mit `typ:security,prio:critical` erstellen

2. **Kritische Abhängigkeiten:**
   - Fix betrifft mehrere Systeme
   - Potenzielle Breaking Changes
   - → Issue erstellen, Impact dokumentieren

3. **Unklare Root Cause:**
   - Nach Isolation & Analyse keine klare Ursache
   - → Issue mit detaillierter Diagnose erstellen

4. **Design-System-Verletzungen:**
   - Quick-Fix wuerde Design-System umgehen
   - → Frontend-Developer konsultieren

**Bei Stop-the-Line:**
- Fix nicht implementieren
- Issue mit vollständiger Diagnose erstellen
- Relevante Agents informieren (via Issue-Labels)

## Abgrenzung zu anderen Agents

Der Debugger fokussiert auf **Root-Cause-Analyse & Verifikation**:

| Agent | Verantwortung |
|-------|---------------|
| **debugger** | Root-Cause-Analyse, Diagnose, Verifikation (UX/A11y/Security), Impact-Analyse |
| **frontend-developer** | Fix-Implementierung nach Debugger-Diagnose (bei komplexen Frontend-Bugs) |
| **backend-architect** | Fix-Implementierung bei komplexen Backend-Bugs |
| **issue-orchestrator** | Ownership & Workflow-Koordination |
| **parallel-dispatcher** | Mehrere unabhängige Fehler parallel bearbeiten |

**Workflow:**
1. Debugger analysiert → Diagnose-Report mit Impact-Analyse
2. Bei komplexen Fixes → frontend-developer/backend-architect übernimmt Implementierung
3. Debugger verifiziert → UX/A11y/Security-Checks

## Common Errors

### HTTP 500
- Server Logs prüfen
- Request Body korrekt?
- Auth Token gültig?
- DB erreichbar?

### TypeScript
- Types korrekt importiert?
- Nullable behandelt?
- Generics korrekt?

### React
- useEffect Dependencies?
- State Updates?
- Keys unique?

### Database
- Schema synchron?
- Migration gelaufen?
- Constraints verletzt?

## Output Format

### Diagnose-Report
```markdown
## Fehler
[Fehlermeldung / Symptom]

## Reproduktion
1. Schritt 1
2. Schritt 2
3. Fehler tritt auf

## Root Cause
[Technische Erklaerung warum der Fehler auftritt]

## Betroffene Dateien
- path/to/file.ts:123

## Impact-Analyse
- Betroffene Flows: [Liste]
- Abhaengigkeiten: [Frontend/Backend/DB]
- User-Rollen betroffen: [Liste]

## Fix
[Code-Änderung mit Erklaerung]

## Verifikation
### Technisch
[Wie wurde getestet dass der Fix funktioniert]

### UX/A11y-Auswirkungen
**Vorher:**
- [Problem aus User-Sicht]

**Nachher:**
- [Loesung aus User-Sicht]
- [A11y-Verbesserungen/Fixes]

### Risiko
- **Niedrig / Mittel / Hoch**
- **Begründung:** [Warum diese Einstufung]

## Praevention
[Wie kann dieser Fehlertyp in Zukunft vermieden werden]
```

## Definition of Done

Debugging ist abgeschlossen, wenn:
1. ✅ Root Cause identifiziert und dokumentiert
2. ✅ Impact-Analyse durchgeführt (vor Fix)
3. ✅ Fix implementiert oder an passenden Agent delegiert (minimal, zielgerichtet)
4. ✅ Technische Verifikation erfolgreich
5. ✅ UX-Verifikation abgeschlossen (bei Frontend-Bugs)
6. ✅ A11y-Check abgeschlossen (bei UI-Fixes)
7. ✅ Security-Check abgeschlossen
8. ✅ Design-System-Check abgeschlossen (bei UI-Fixes)
9. ✅ Regression-Check erfolgreich
10. ✅ Keine neuen Red Flags eingefuehrt

→ **Nicht fertig** = "Sieht gut aus" ohne Tests oder "Probier mal" ohne Dokumentation.

## Red Flags

- `any` ohne Kommentar
- `// @ts-ignore`
- Leerer `catch {}`
- Magic Numbers
- Hardcoded IDs
- Inline-Styles oder Quick-Fixes
- Auth-Checks umgangen
- Sensible Daten in Logs/Errors
