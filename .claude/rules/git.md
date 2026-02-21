# Git Rules

**Aktiviert bei:** Git-Operationen (commit, push, add)

---

## Security-First Commit Policy

### NIEMALS committen (Security-kritisch)

| Dateityp | Beispiele | Grund |
|----------|-----------|-------|
| **Environment Files** | `.env`, `.env.local`, `.env.production` | API Keys, Passwörter |
| **Credentials** | `credentials.json`, `secrets.json`, `service-account.json` | Auth-Tokens, Service-Accounts |
| **Private Keys** | `*.pem`, `*.key`, `id_rsa`, `*.p12` | Kryptographische Schlüssel |
| **Auth Tokens** | `token.json`, `oauth-tokens.json` | Session/OAuth Tokens |
| **Database Dumps** | `*.sql` mit Daten, `backup.sql` | Personenbezogene Daten |

### IMMER committen (Safe für Team-Sync)

| Dateityp | Beispiele | Grund |
|----------|-----------|-------|
| **Tool-Config** | `.claude/settings.local.json`, `.serena/memories/` | Permissions, Projekt-Kontext |
| **Pläne** | `.claude/plans/` | Implementation-Pläne |
| **IDE-Settings** | `.vscode/settings.json` (ohne Secrets) | Konsistente Entwicklungsumgebung |
| **Linter-Config** | `.eslintrc`, `.prettierrc` | Code-Qualität |

---

## Vor jedem Commit prüfen

```bash
# Zeigt alle staged files
git diff --cached --name-only

# Suche nach potentiellen Secrets
git diff --cached | grep -iE "(password|secret|api_key|token|private_key)"
```

**Bei Verdacht:** File NICHT committen, in `.gitignore` aufnehmen.

---

## Commit-Message Format

```
type(scope): Kurze Beschreibung

- Detail 1
- Detail 2

(Refs #XX) oder (Closes #XX)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Types:** feat, fix, refactor, docs, chore, test, perf, style

---

## Regel-Zusammenfassung

> **Leitsatz:** Nur Dateien mit echten Secrets gehören in `.gitignore`.
> Config-Dateien, Tool-Settings und Projekt-Metadaten sind safe und sollten
> für Team-Sync committed werden.
