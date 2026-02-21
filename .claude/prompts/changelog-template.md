# CHANGELOG Entry Template

## Wann CHANGELOG.md aktualisieren?

**JA - Eintrag erstellen:**
- Major Features (neue Funktionalität für User)
- Breaking Changes (API, DB Schema)
- Security Fixes

**NEIN - Nur Git History:**
- Kleine Bugfixes
- Refactorings
- Style/UI Tweaks
- Dokumentations-Updates
- Dependency Updates

## Verantwortung

- CHANGELOG wird bei Merge in main aktualisiert
- Autor des Features ist verantwortlich für den Eintrag

## Format

```markdown
## [Unreleased]

### Added
- Feature-Name kurz beschrieben (#issue)

### Changed
- Was sich geändert hat (#issue)

### Fixed
- Was gefixt wurde (#issue)

### Security
- Security-relevante Änderung (#issue)

### Deprecated (optional)
- Funktion die in Zukunft entfernt wird (#issue)
```

**Hinweis:** Security-Eintraege bleiben bewusst high-level (keine Angriffsdetails).

## Regeln

1. **Eine Zeile pro Item** - keine Bullet-Listen mit Details
2. **Issue-Referenz** am Ende in Klammern `(#123)` oder mehrere `(#123, #124)`
3. **Mehrere Issue-Referenzen sind erlaubt** - wenn Feature mehrere Issues umfasst
4. **Keine technischen Details** - die sind im Git Log
5. **User-Perspektive** - was bedeutet das für den Nutzer?
6. **Kurz und praegnant** - max 80 Zeichen pro Zeile

## Beispiele

### Gut ✅
```markdown
- Multi-Day Festival Support (#770, #771)
- Login Brute-Force Protection (#600)
- Error State Design vereinheitlicht (#677)
```

### Schlecht ❌
```markdown
- **Multi-Day Festival Support (#770, #771)**
  - Neues Feld `events.event_type` mit Enum `SINGLE` | `MULTI_DAY`
  - Neues Feld `events.festival_name` für Festival-Namen
  - Neue Tabelle `event_days` mit day_number, date, label
  - Service: `EventDaysService` mit CRUD-Operationen
  - API-Endpoints: GET/POST/PUT/DELETE `/api/events/:eventId/days`
```

## Release Workflow

- Alle Eintraege landen zunächst unter `[Unreleased]`
- Beim Release wird `[Unreleased]` in `[x.y.z]` umbenannt
- Danach wird eine neue leere `[Unreleased]`-Sektion angelegt

**Beispiel:**
```markdown
## [Unreleased]

### Added
- Neues Feature (#123)

---

## [1.2.0] - 2024-01-15

### Added
- Altes Feature (#120)
```

---

## Git History für Details

```bash
# Alle Commits sehen
git log --oneline

# Commits für ein Issue
git log --oneline --grep="#770"

# Änderungen in einer Datei
git log --oneline -- backend/src/modules/events/
```
