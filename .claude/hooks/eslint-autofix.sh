#!/bin/bash
# PostToolUse Hook: ESLint --fix auf bearbeitete .ts/.tsx Dateien
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Windows-Pfade normalisieren (Backslash → Forward-Slash)
FILE_PATH="${FILE_PATH//\\//}"
[[ -n "$CLAUDE_PROJECT_DIR" ]] && CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR//\\//}"

# Skip: Dateien ausserhalb des Projekts (z.B. ~/.claude/memory/)
[[ -n "$CLAUDE_PROJECT_DIR" && "$FILE_PATH" != "$CLAUDE_PROJECT_DIR"* ]] && exit 0

# Nur .ts/.tsx Dateien
[[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]] && exit 0

# Workspace erkennen und ESLint ausfuehren
if [[ "$FILE_PATH" == *"/backend/"* ]]; then
  npx eslint --fix "$FILE_PATH" >/dev/null 2>&1 || true
elif [[ "$FILE_PATH" == *"/frontend/"* ]]; then
  npx eslint --fix "$FILE_PATH" >/dev/null 2>&1 || true
fi
exit 0
