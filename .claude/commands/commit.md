# Git Commit erstellen

Professioneller Git Commit mit Issue-Referenz.

## Usage
```
/commit                # Staged Changes
/commit #123           # Mit Issue-Referenz
```

## Format

```
<type>: <beschreibung> (<Refs/Closes> #XX)

<optionaler body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Types

| Type | Verwendung |
|------|------------|
| feat | Neues Feature |
| fix | Bugfix |
| docs | Dokumentation |
| style | Formatting |
| refactor | Refactoring |
| perf | Performance |
| test | Tests |
| chore | Maintenance |

## Issue-Referenz

- `(Refs #XX)` - Waehrend Arbeit
- `(Closes #XX)` - Nach Abschluss

## Workflow

1. `git status` + `git diff --staged`
2. Message generieren
3. Commit ausführen
4. Docs prüfen (API_REFERENCE, SECURITY, etc.)

**Definition of Done:** Code funktionsfähig, getestet, Docs aktuell (wenn relevant)

**CHANGELOG.md NUR bei:** Major Features, Breaking Changes, Security Fixes
**Git History ist das Detail-Log** - nicht alles in CHANGELOG duplizieren!

## Regeln

- Erste Zeile max 72 Zeichen
- Imperativ ("Add" nicht "Added")
- Keine Secrets committen
- Issue-Referenz wenn vorhanden
- Nur committen wenn vollständig & testbar (kein WIP)

## Beispiele

```
feat: User-Profil Bearbeitung (Closes #123)

fix: Rate Limiting auf Login (Refs #456)

docs: API-Dokumentation erweitert
```
