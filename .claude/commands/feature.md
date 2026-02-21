# Feature Development Workflow

End-to-End Feature-Entwicklung mit reproduzierbarer Qualität.

**Wann einsetzen:**
- Große Features (mehrere Dateien, mehrere Phasen)
- Issue-getriebene Entwicklung
- Features mit klaren Akzeptanzkriterien

**Optional für:**
- Kleine Bug-Fixes (können direkter via `/work` erfolgen)
- Experimentelle Proof-of-Concepts

**Ziel:** Sauberer, nachvollziehbarer Entwicklungsprozess von Planung bis Abschluss.

## Usage
```
/feature #123          # Aus Issue
/feature #123 --team   # Aus Issue mit Agent Teams (parallel)
/feature "Titel"       # Neue Feature (erstellt Issue + startet Workflow)
/feature plan          # Nur Plan (ohne Umsetzung)
```

**Unterschied:**
- `/feature "Titel"` → Erstellt GitHub Issue + vollständiger Workflow
- `/feature plan` → Nur Planungsphase (z. B. für Diskussion/Approval)

## Phasen

### 0. Context-Budget prüfen
**Ziel:** Context-Overflow verhindern.

**Aufgaben:**
- Fuehre `/context` aus
- Wenn >80%: Warnung ausgeben + Empfehlung `/compact`
- Wenn >90%: Abbruch empfehlen (neuer Chat oder `/compact`)
- Wenn >95%: Automatischer Stop

**User-Feedback-Format:**
```markdown
⚠️ **Context-Budget Warning**
- Aktuell: X% Context-Usage
- Empfehlung: `/compact` vor Feature-Start, um optimale Performance zu sichern
- Alternative: Session neu starten (neuer Chat)
```

**Abbruchkriterien (Definition of "Safe to Start"):**
- [x] Context-Usage <80% (optimal)
- [x] Oder User entscheidet trotz >80% fortzufahren

**Dann:** Weiter zu Phase 1 (Verstehen)

---

### 1. Verstehen
**Ziel:** Vollständiges Verständnis der Anforderung und Kontext.

**Aufgaben:**
- Issue/Requirements analysieren (alle Kommentare, Labels, Acceptance Criteria)
- Codebase erkunden (betroffene Module, bestehende Patterns)
- Fragen klären (offene Punkte identifizieren)

**Abbruchkriterien (Definition of "Verstanden"):**
- [x] Alle Akzeptanzkriterien klar definiert
- [x] Betroffene Codebereiche identifiziert
- [x] Abhängigkeiten zu anderen Features bekannt
- [x] Offene Fragen dokumentiert oder geklärt

**Dann:** Weiter zu Phase 2 (Planen)

### 2. Planen
**Ziel:** Strukturierter Feature-Plan mit Scope, Reihenfolge und Risiken.

**Vorab:** Context-Check nach Phase 1 (falls viele Docs/Code gelesen wurden)

**Standard:** Für alle Features mit `/feature`-Workflow (Pflicht).

**Optional:** Nur bei sehr kleinen Features (< 50 Zeilen Code, 1 Datei) kann Plan minimal sein.

**Plan-Template:**
```markdown
## Feature Plan

### Ziel
[Was erreichen?]

### Scope
**Drin:** ...
**Nicht drin:** ... (verhindert Feature-Creep)

### Dateien
| Datei | Änderung |
|-------|-----------|

### Reihenfolge
1. Backend
2. Frontend
3. Tests
4. Docs

### Risiken
| Risiko | Mitigation |
```

**Ergebnis:** Plan im Issue-Kommentar dokumentieren (für Nachvollziehbarkeit).

### 3. Implementieren (TDD)

**Standard (sequenziell):**
```
Test schreiben (Red)
    ↓
Implementieren (Green)
    ↓
Refactoren
    ↓
Wiederholen
```

**Mit `--team` (parallel, Agent Teams):**
```
Contract definieren (Types/DTOs)
    ↓
File Ownership zuweisen
    ↓
Agents parallel spawnen (Backend + Frontend)
    ↓
Integration + Build Check
```

Für Details zu Agent Teams siehe `.claude/prompts/teams/` Templates.

### 4. Review
**Ziel:** Qualitätssicherung vor Abschluss.

**Self-Review Checkliste (Pflicht):**
- [x] Code-Funktionalität getestet (manuell + automatisiert)
- [x] Alle Akzeptanzkriterien erfüllt
- [x] Tests grün (keine Fehler, keine Warnings)
- [x] Projekt-Patterns befolgt (siehe CLAUDE.md)
- [x] Keine unbenutzten Imports/Variablen
- [x] TypeScript kompiliert ohne Fehler

**Optional (bei größeren Features):**
- `/review` ausführen → Systematischer Code Review (siehe `.claude/commands/review.md`)
- Architectural Review bei komplexen Änderungen

**Dann:** Weiter zu Phase 5 (Abschluss)

### 5. Abschluss
**Ziel:** Sauberer Abschluss mit dokumentiertem Ergebnis.

**Pflicht-Schritte:**
1. `/test` laufen → Finale Test-Suite durchführen
2. Docs aktualisieren → architecture.md, api-reference.md, CHANGELOG.md (bei Features/Breaking Changes)
3. User fragen: `/done #XX` ausführen? (KEIN automatischer Commit!)

## Quality Gates (Merge-/Done-Kriterien)

**Diese Gates müssen BESTANDEN sein, bevor Feature als "Done" gilt:**

- [x] **Akzeptanzkriterien erfüllt** → Alle AC aus Issue erfüllt
- [x] **TypeScript kompiliert** → Keine Compile-Fehler oder Warnings
- [x] **Tests grün** → Alle Tests bestehen (keine fehlgeschlagenen Tests)
- [x] **Projekt-Patterns befolgt** → Architektur-Prinzipien eingehalten (siehe CLAUDE.md)
- [x] **Docs aktualisiert** → Relevante Docs aktualisiert (architecture.md, api-reference.md, CHANGELOG.md)

**Wenn ein Gate fehlschlägt:** Fix einarbeiten, erneut prüfen → Nicht committen/schließen!

## Definition of Done (DoD)

Ein Feature gilt als abgeschlossen, wenn:

- [x] **Plan erstellt** → Feature-Plan dokumentiert (im Issue)
- [x] **Implementiert** → Code geschrieben, Tests geschrieben
- [x] **Self-Review durchgeführt** → Self-Review Checkliste abgearbeitet
- [x] **Alle Quality Gates bestanden** → Kein Gate fehlgeschlagen
- [x] **Docs aktualisiert** → Relevante Dokumentation aktualisiert
- [ ] **Committed** → Via `/done #XX` (nur auf User-Anfrage)

**Dann:** Feature ist ready für Merge/Deployment.
