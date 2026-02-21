# Security-Audit durchfuehren

Systematisch kritische Sicherheitslücken identifizieren und priorisieren – ohne Tool-Wildwuchs.
OWASP-basierter Security-Audit für Dateien, Module oder das gesamte Projekt.

## Quick Start
- Schnellcheck Auth & Zugriff: `/security` (Default)
- Fokus auf Modul/Feature: `/security [path]`
- Tiefenprüfung vor Release: `/security full`

## Default Workflow

```
/work #123
  -> Plan + Umsetzung (sicherheitskritische Features)

/security [path]
  -> Security-Audit durchfuehren

[Bei Critical/High]
  -> Issue erstellen, fixen, retesten
```

## Usage
```
/security              # Schnellcheck Auth & Zugriff (Default)
/security [path]       # Fokus auf Modul oder Feature
/security full         # Tiefenprüfung vor Release
```

## Workflow

1. **Scope bestimmen** – Welche Teile sind sicherheitskritisch?
2. **OWASP Top 10 prüfen** – Standardrisiken systematisch abarbeiten
3. **Projekt-spezifische Checks** – Abweichungen, Architektur, Sonderfälle
4. **Findings dokumentieren** – Nach Schweregrad & Fix-Aufwand priorisieren

## OWASP Top 10 Checks

| # | Risiko | Prüfung | Fokus |
|---|--------|----------|-------|
| A01 | Broken Access Control | Role-Checks, Permissions | Auth, API |
| A02 | Cryptographic Failures | Hashing, Encryption, HTTPS | Auth, API, Infra |
| A03 | Injection | Parameterized Queries, Input Validation | API, Backend |
| A04 | Insecure Design | Auth Flows, Session Management | Auth, Frontend |
| A05 | Security Misconfiguration | Headers, CORS, Cookies | Frontend, Infra |
| A06 | Vulnerable Components | Dependency Audit | Backend, Frontend |
| A07 | Auth Failures | Rate Limiting, Brute Force | Auth, API |
| A08 | Software Integrity | Package Lock, SRI | Frontend, Infra |
| A09 | Logging Failures | Security Event Logging | Backend, Infra |
| A10 | SSRF | URL Validation | API, Backend |

## Output Format

```markdown
## Security Audit: [Scope]

**Datum:** [Heute]
**Scope:** [module/path/full]
**Gesamtrisiko:** Critical | High | Medium | Low
_Beispiel: Hoch – mehrere sofort ausnutzbare Zugriffslücken_

### Summary
- Critical: X
- High: X
- Medium: X
- Low: X

### Critical Findings
| Issue | Location | OWASP | Fix |
|-------|----------|-------|-----|
| [Beschreibung] | [Datei:Zeile] | A01 | [Lösung] |

### Recommendations
1. [Priorität 1]: [Beschreibung]
2. [Priorität 2]: [Beschreibung]

### Passed Checks
- [x] A01: Access Control korrekt implementiert
- [x] A03: Injection-Schutz aktiv
```

## Severity

| Level | Beschreibung |
|-------|--------------|
| Critical | Sofort ausnutzbar |
| High | Ernsthaftes Risiko |
| Medium | Moderates Risiko |
| Low | Best Practice |

## Nach Audit

### Sofort-Massnahmen
- **Critical/High Findings** → GitHub Issue mit `typ:security`, `prio:critical/high`
- **Blocker** → Kein Merge/Deploy bis Fix

### Dokumentation
- Docs aktualisieren wenn Fixes (architecture.md, security.md)
- CHANGELOG.md bei Security Fixes (Pflicht)

### Follow-Up
- Retest nach Fixes: `/security [path]`
- Vor Release: `/security full` als letzter Check
