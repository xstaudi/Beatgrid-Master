#!/bin/bash
# TeammateIdle Hook: Prueft ob Agent offene Tasks hat vor Idle
# Exit 2 = Feedback + weiterarbeiten | Exit 0 = idle erlauben

INPUT=$(cat)

# Agent-Name aus Hook-Input extrahieren
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_name // empty' 2>/dev/null)

# [FIX C2] Kein agent_name → kann nicht prüfen → idle erlauben mit Warnung
if [ -z "$AGENT_NAME" ]; then
  exit 0
fi

# [FIX C1] Alle Team-Verzeichnisse durchsuchen, nicht nur das erste
OPEN_TASKS=""
OPEN_COUNT=0

for dir in "$HOME/.claude/tasks"/*/; do
  [ -d "$dir" ] || continue
  for task_file in "$dir"*.json; do
    [ -f "$task_file" ] || continue
    # [FIX I2] Ein jq-Aufruf statt 4
    PARSED=$(jq -r '[.status // "", .owner // "", .id // "?", .subject // "Unbekannt"] | @tsv' "$task_file" 2>/dev/null) || continue
    IFS=$'\t' read -r STATUS OWNER TASK_ID SUBJECT <<< "$PARSED"
    if [ "$STATUS" = "in_progress" ] && [ "$OWNER" = "$AGENT_NAME" ]; then
      # [FIX I1] Alle offenen Tasks sammeln
      OPEN_TASKS="${OPEN_TASKS}- Task ${TASK_ID}: ${SUBJECT} (status: in_progress)\n"
      OPEN_COUNT=$((OPEN_COUNT + 1))
    fi
  done
done

if [ "$OPEN_COUNT" -gt 0 ]; then
  echo "STOP! Du hast noch $OPEN_COUNT offene Tasks:"
  echo -e "$OPEN_TASKS"
  echo "PFLICHT vor idle:"
  echo "1. TaskUpdate(status: \"completed\") für ALLE fertigen Tasks"
  echo "2. TaskList() für nächsten Task"
  echo "3. Bei shutdown_request: SendMessage(type: \"shutdown_response\", approve: true)"
  exit 2
fi

# Keine offenen Tasks → idle erlauben
exit 0
