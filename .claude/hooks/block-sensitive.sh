#!/bin/bash
# PreToolUse Hook: Blockt Edit/Write auf sensitive Dateien
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Windows-Pfade normalisieren (Backslash → Forward-Slash)
FILE_PATH="${FILE_PATH//\\//}"
[[ -n "$CLAUDE_PROJECT_DIR" ]] && CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR//\\//}"

# Skip: Dateien ausserhalb des Projekts (z.B. ~/.claude/memory/)
[[ -n "$CLAUDE_PROJECT_DIR" && "$FILE_PATH" != "$CLAUDE_PROJECT_DIR"* ]] && exit 0

if echo "$FILE_PATH" | grep -qE '\.(env|pem|key)$|\.env\.|credentials\.json|secrets\.json'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "BLOCKED: Sensitive Datei! Siehe .claude/rules/git.md"
    }
  }'
else
  exit 0
fi
