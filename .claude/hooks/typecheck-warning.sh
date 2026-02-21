#!/bin/bash
# PostToolUse Hook: Warnt bei Änderungen an type-relevanten Dateien
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Windows-Pfade normalisieren (Backslash → Forward-Slash)
FILE_PATH="${FILE_PATH//\\//}"
[[ -n "$CLAUDE_PROJECT_DIR" ]] && CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR//\\//}"

# Skip: Dateien ausserhalb des Projekts (z.B. ~/.claude/memory/)
[[ -n "$CLAUDE_PROJECT_DIR" && "$FILE_PATH" != "$CLAUDE_PROJECT_DIR"* ]] && exit 0

# Nur type-relevante Dateien (Interfaces, DTOs, Schema-Definitionen)
if echo "$FILE_PATH" | grep -qE '(\.d\.ts$|/types\.ts$|/dtos\.ts$|/db/schema/)'; then
  echo "TYPE_WARNING: Type-relevante Datei geändert ($FILE_PATH). Beachte: Abhaengige Dateien prüfen und npx tsc --noEmit vor Commit!" >&2
fi
exit 0
