#!/bin/bash
# PreToolUse Hook: Blockt Edit/Write auf node_modules und Build-Artefakte
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Windows-Pfade normalisieren (Backslash → Forward-Slash)
FILE_PATH="${FILE_PATH//\\//}"
[[ -n "$CLAUDE_PROJECT_DIR" ]] && CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR//\\//}"

# Skip: Dateien ausserhalb des Projekts (z.B. ~/.claude/memory/)
[[ -n "$CLAUDE_PROJECT_DIR" && "$FILE_PATH" != "$CLAUDE_PROJECT_DIR"* ]] && exit 0

# Block: node_modules editieren
if echo "$FILE_PATH" | grep -q 'node_modules/'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "BLOCKED: node_modules darf nicht editiert werden!"
    }
  }'
  exit 0
fi

# Block: dist/build-Artefakte editieren
if echo "$FILE_PATH" | grep -qE '(/dist/|/build/|\.js\.map$)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "BLOCKED: Build-Artefakt! Editiere die Source-Datei."
    }
  }'
  exit 0
fi

# Block: package-lock.json editieren
if echo "$FILE_PATH" | grep -q 'package-lock\.json$'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "BLOCKED: package-lock.json wird von npm verwaltet, nicht manuell editieren!"
    }
  }'
  exit 0
fi

exit 0
