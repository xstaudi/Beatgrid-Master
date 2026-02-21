#!/bin/bash
# PostToolUse Hook: Warnt bei Schema-Änderungen
# Erinnert daran, db:generate auszufuehren
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Windows-Pfade normalisieren (Backslash → Forward-Slash)
FILE_PATH="${FILE_PATH//\\//}"
[[ -n "$CLAUDE_PROJECT_DIR" ]] && CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR//\\//}"

# Skip: Dateien ausserhalb des Projekts (z.B. ~/.claude/memory/)
[[ -n "$CLAUDE_PROJECT_DIR" && "$FILE_PATH" != "$CLAUDE_PROJECT_DIR"* ]] && exit 0

# Nur Schema-Dateien im DB-Verzeichnis
if echo "$FILE_PATH" | grep -q 'backend/src/db/schema/'; then
  echo "SCHEMA_WARNING: Schema-Datei geändert ($FILE_PATH). Bitte 'npm run db:generate --workspace=backend' ausfuehren, um eine Migration zu generieren!" >&2
fi
exit 0
