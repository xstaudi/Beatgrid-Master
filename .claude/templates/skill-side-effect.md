---
name: SKILL_NAME
description: SKILL_DESCRIPTION
allowed-tools: Bash, Write, Edit
disable-model-invocation: true
---

# SKILL_NAME

**⚠️ Side-Effect Warning:** Dieses Skill führt kritische Operationen aus. Nur manuell via User-Befehl nutzbar.

## Wann verwenden

[Beschreibung wann das Skill verwendet werden sollte]

## Kritische Operationen

- [Liste der Side-Effects]
- [z.B. Datei-Erstellung, DB-Migrations, Git-Commits, API-Calls]

## Tools

- `Write` - Datei-Erstellung
- `Edit` - Datei-Änderung
- `Bash` - Shell-Kommandos (gh CLI, git, npm, etc.)

## Beispiel

```bash
# Manueller Aufruf via Command
/skill-name [args]
```

## Workflow

1. User ruft Skill explizit auf
2. Skill prüft Voraussetzungen
3. Skill führt kritische Operationen aus
4. Skill gibt Bestätigung zurück

## Checkliste

- [ ] Skill nur auf expliziten User-Befehl aktiviert
- [ ] `disable-model-invocation: true` gesetzt
- [ ] Side-Effects klar dokumentiert
- [ ] Rollback-Strategie überlegt
