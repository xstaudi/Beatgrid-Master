#!/bin/bash
# TaskCompleted Hook: ESLint + TypeScript Incremental Check (parallel)
# Verhindert Task-Abschluss bei ESLint/TypeScript-Fehlern (exit 2 = Block + Feedback)

# Geaenderte .ts/.tsx Dateien ermitteln (staged + unstaged)
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null | grep -E '\.(ts|tsx)$')

# Keine relevanten Dateien → OK
[ -z "$CHANGED_FILES" ] && exit 0

ROOT=$(git rev-parse --show-toplevel)
ERRORS_FOUND=0
ERROR_OUTPUT=""

# --- ESLint Check (OHNE --fix, workspace-scoped) ---
while IFS= read -r FILE; do
  [ -f "$FILE" ] || continue

  # ESLint aus dem richtigen Workspace-Verzeichnis ausfuehren
  if [[ "$FILE" == backend/* ]]; then
    REL_PATH="${FILE#backend/}"
    RESULT=$(cd "$ROOT/backend" && npx eslint --no-fix "$REL_PATH" 2>&1)
  elif [[ "$FILE" == frontend/* ]]; then
    REL_PATH="${FILE#frontend/}"
    RESULT=$(cd "$ROOT/frontend" && npx eslint --no-fix "$REL_PATH" 2>&1)
  else
    continue
  fi

  if [ $? -ne 0 ]; then
    ERRORS_FOUND=1
    ERROR_OUTPUT="${ERROR_OUTPUT}\n--- ${FILE} ---\n${RESULT}\n"
  fi
done <<< "$CHANGED_FILES"

if [ $ERRORS_FOUND -ne 0 ]; then
  echo "ESLint-Fehler gefunden! Bitte beheben:"
  echo -e "$ERROR_OUTPUT"
  exit 2
fi

# --- TypeScript Incremental Check (PARALLEL via temp files) ---
BACKEND_CHANGED=$(echo "$CHANGED_FILES" | grep -c '^backend/' 2>/dev/null || echo "0")
FRONTEND_CHANGED=$(echo "$CHANGED_FILES" | grep -c '^frontend/' 2>/dev/null || echo "0")

# Temp-Verzeichnis für parallele Ergebnisse
TMPDIR_TSC="${ROOT}/.tsc-check-$$"
mkdir -p "$TMPDIR_TSC"
trap "rm -rf '$TMPDIR_TSC'" EXIT

BACKEND_PID=""
FRONTEND_PID=""

if [ "$BACKEND_CHANGED" -gt 0 ]; then
  (cd "$ROOT/backend" && npx tsc --noEmit 2>&1 | tail -20 > "$TMPDIR_TSC/backend.out"; echo ${PIPESTATUS[0]} > "$TMPDIR_TSC/backend.exit") &
  BACKEND_PID=$!
fi

if [ "$FRONTEND_CHANGED" -gt 0 ]; then
  (cd "$ROOT/frontend" && npx tsc --noEmit 2>&1 | tail -20 > "$TMPDIR_TSC/frontend.out"; echo ${PIPESTATUS[0]} > "$TMPDIR_TSC/frontend.exit") &
  FRONTEND_PID=$!
fi

# Auf beide Prozesse warten
[ -n "$BACKEND_PID" ] && wait "$BACKEND_PID"
[ -n "$FRONTEND_PID" ] && wait "$FRONTEND_PID"

TSC_ERRORS=0
TSC_OUTPUT=""

if [ -f "$TMPDIR_TSC/backend.exit" ] && [ "$(cat "$TMPDIR_TSC/backend.exit")" -ne 0 ]; then
  TSC_ERRORS=1
  TSC_OUTPUT="${TSC_OUTPUT}\n--- Backend TypeCheck ---\n$(cat "$TMPDIR_TSC/backend.out")\n"
fi

if [ -f "$TMPDIR_TSC/frontend.exit" ] && [ "$(cat "$TMPDIR_TSC/frontend.exit")" -ne 0 ]; then
  TSC_ERRORS=1
  TSC_OUTPUT="${TSC_OUTPUT}\n--- Frontend TypeCheck ---\n$(cat "$TMPDIR_TSC/frontend.out")\n"
fi

if [ $TSC_ERRORS -ne 0 ]; then
  echo "TypeScript-Fehler gefunden! Bitte beheben:"
  echo -e "$TSC_OUTPUT"
  exit 2
fi

exit 0
