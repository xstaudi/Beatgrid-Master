#!/bin/bash
# PostToolUse Hook: Prettier auf Nicht-TS Dateien (JSON, CSS, MD, HTML)
# TS/TSX wird bereits durch eslint-autofix.sh abgedeckt
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Windows-Pfade normalisieren (Backslash → Forward-Slash)
FILE_PATH="${FILE_PATH//\\//}"
[[ -n "$CLAUDE_PROJECT_DIR" ]] && CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR//\\//}"

# Skip: Dateien ausserhalb des Projekts (z.B. ~/.claude/memory/)
[[ -n "$CLAUDE_PROJECT_DIR" && "$FILE_PATH" != "$CLAUDE_PROJECT_DIR"* ]] && exit 0

# Nur relevante Dateitypen (NICHT .ts/.tsx - das macht ESLint)
case "$FILE_PATH" in
  *.json|*.css|*.scss|*.md|*.html|*.yml|*.yaml)
    npx prettier --write "$FILE_PATH" >/dev/null 2>&1 || true
    ;;
esac
exit 0
