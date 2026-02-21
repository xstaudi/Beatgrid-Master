# Architektur-Research und Best-Practice Review

Recherchiere Best Practices für ein Thema, analysiere den aktuellen Projektstand (Docs + Codebase) und liefere eine priorisierte Roadmap.

## Default Workflow

```
/research <thema>
  -> Best Practices recherchieren
  -> Projekt-Status analysieren
  -> Roadmap generieren
```

## Quick Start

1. `/research <thema>` → Research durchfuehren
2. Best Practices + Roadmap prüfen

## Usage
```
/research <thema>
```

## Beispiele
```
/research Security und Auth
/research Performance und Caching
/research Real-time Features
/research Accessibility
/research Event Search Ranking
```

## Workflow (5 Schritte)

### Schritt 1: Thema definieren
- User gibt Thema als Argument
- Falls kein Argument: nachfragen
- Optional: Ziel klaeren (Feature-Planung vs Codebase-Analyse vs beides)

### Schritt 2: Web-Research (Best Practices)
Fuehre mehrere Web-Suchen durch:
- "<thema> best practices 2025"
- "<thema> architecture patterns"
- "<thema> implementation pitfalls"
- Spezifische technische Suchen zum Thema

**Ergebnis:** kurze Liste belastbarer Best-Practice-Punkte + Quellen

### Schritt 2.5: Context-Budget prüfen
**Ziel:** Context-Overflow verhindern vor Codebase-Scan.

**Aufgaben:**
- Fuehre `/context` aus
- Wenn >80%: Warnung ausgeben + Empfehlung
- Wenn >90%: Abbruch empfehlen (Codebase-Scan skippen, nur Docs nutzen)
- Wenn >95%: Automatischer Stop

**User-Feedback-Format:**
```markdown
⚠️ **Context-Budget Warning**
- Aktuell: X% Context-Usage
- Empfehlung: Codebase-Scan skippen, nur Docs nutzen
- Alternative: `/compact` ausfuehren vor Codebase-Analyse
```

**Dann:** Entscheiden ob Codebase-Scan oder nur Docs-Analyse

### Schritt 3: Projekt-Status analysieren (Docs + Codebase)
Durchsuche relevante Projekt-Dokumentation und Code:
- Architektur-Docs
- Bestehende Module und APIs
- Relevante Config-Dateien

Identifiziere:
- Was ist bereits implementiert / dokumentiert?
- Welche APIs/Endpoints/Module existieren?
- Welche Luecken/Inkonsistenzen gibt es?
- Abweichungen zu Best Practices (inkl. Risiko/Impact)

### Schritt 4: Übersicht praesentieren

```markdown
## Research: <Thema> - Übersicht

### Best Practices (kompakt)
- 1) ...
- 2) ...
- 3) ...
(inkl. Quellen)

### Aktueller Stand im Projekt
| Bereich | Status | Evidenz (Docs/Code) | Notiz |
|--------|--------|----------------------|-------|
| ... | ... | docs/... | ... |

### Gaps / Risiken
| # | Gap | Impact | Empfehlung |
|---|-----|--------|------------|
| 1 | ... | High/Med/Low | ... |

### Roadmap (empfohlene Reihenfolge)
| Prio | Thema | Warum jetzt | Abhaengigkeiten |
|------|-------|-------------|-----------------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |
```

### Schritt 5: Optional – Docs aktualisieren (wenn relevant)

- Architektur-Docs: nur wenn Architektur/Contracts geändert oder geplant
- CHANGELOG.md: NUR bei echten Features/Breaking Changes (1 Zeile pro Item!)

## Output-Format

```markdown
## Research: <Thema> - Zusammenfassung

### Best Practices
- ...

### Projekt-Status
- ...

### Roadmap
1) ...
2) ...
```

## Wichtige Hinweise

- **Erst verstehen was bereits existiert** (Docs + Code)
- **Keine Umlaute** in Output (ae, oe, ue verwenden)
- **Keine Zeit-Schätzungen**
- **Referenzen zu Best-Practice-Quellen** angeben
