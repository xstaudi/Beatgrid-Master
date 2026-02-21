---
disable-model-invocation: true
description: Generiert Release Notes aus Git History im CHANGELOG.md Format
---

# Release Notes Generator

## Wann verwenden
Manuell via `/release-notes` oder wenn der User explizit Release Notes anfordert.

## Workflow

1. **Letzten Tag finden:** `git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD`
2. **Commits seit Tag:** `git log <tag>..HEAD --oneline --no-merges`
3. **Commits kategorisieren:**
   - `feat:` → Added
   - `fix:` → Fixed
   - `refactor:` / `chore:` → Changed
   - `perf:` → Changed
   - `security:` / `BREAKING` → Security
   - `docs:` → Documented
4. **CHANGELOG-Format ausgeben** (NICHT in Datei schreiben!)

## Regeln
- **1 Zeile pro Item** (keine Bullet-Listen mit Details)
- Issue-Referenz anhaengen: `(#XX)`
- Nur Major Features, Breaking Changes, Security Fixes
- Triviale Commits (typos, lint) weglassen
- Format: `## [Unreleased]` mit Sektionen Added|Changed|Fixed|Removed|Security|Documented
- Referenz: `.claude/prompts/changelog-template.md`

## Output
Formatierte Release Notes im Terminal. User entscheidet ob in CHANGELOG.md eingetragen wird.
