# Parallel Agent Dispatcher

Analyze failures and dispatch multiple agents in parallel for independent problem domains.

**Output:** Summary table, root causes, changes made, conflict check, final test suite status

**Wann einsetzen:** Use this command when multiple test failures or errors appear to be unrelated. This is an orchestration tool for parallel debugging, not a general fix-all command.

## Default Workflow

```
/test
  -> Multiple failures detected

/parallel-dispatch [test-output]
  -> Independent domains identifizieren
  -> Agents parallel dispatchen

[Bei Konflikten]
  -> Manuell loesen, erneut testen
```

## Quick Start

1. `/parallel-dispatch [test-output]` → Fehler analysieren
2. Unabhängige Domains identifizieren
3. Agents parallel dispatchen
4. Konflikte prüfen, Tests ausführen

## Usage
```
/parallel-dispatch [test-output or error-description]
```

## When NOT to Use This Command

This command is designed for parallel debugging of independent problems. **Don't use it for:**
- **Single failure**: Use standard debugging or `/test` command
- **Architectural refactoring**: Requires sequential, coordinated changes
- **Unclear problem relationships**: Analyze dependencies first with `/review` or `/scan-issues`

## What This Command Does

1. **Analyzes** the provided failures/errors
2. **Groups** them into independent problem domains
3. **Creates** focused agent prompts for each domain
4. **Dispatches** agents in parallel using the Task tool
5. **Reports** results and checks for conflicts

## Workflow

### Step 1: Failure Analysis
First, I'll analyze the failures you provide:
- Parse error messages and stack traces
- Identify affected files and subsystems
- Determine if problems are related or independent

### Step 2: Domain Identification
Group failures by independence:
- **Independent**: Different files, different root causes → Parallel dispatch
- **Related**: Same root cause, cascading failures → Single agent

### Step 3: Agent Dispatch
For each independent domain, dispatch a focused agent:
```
Task("Fix [specific-file].test.ts: [error-summary]")
```

**Each agent focuses only on its assigned domain and does not modify unrelated files.** This focused approach minimizes conflicts and ensures clear responsibility boundaries.

### Step 4: Integration
- Review agent summaries
- Check for conflicts (same files edited)
- Run full test suite
- Report final status

## Example Input

Provide test output like:
```
FAIL src/tests/agent-tool-abort.test.ts
  ✕ should abort tool with partial output capture
  ✕ should handle mixed completed and aborted tools

FAIL src/tests/batch-completion.test.ts
  ✕ should execute all tools in batch

FAIL src/tests/tool-approval.test.ts
  ✕ should track execution count correctly
```

## Decision Criteria

| Condition | Action |
|-----------|--------|
| 3+ failures, different files, unrelated | ✅ Parallel dispatch |
| Failures in same file/module | ⚠️ Single agent investigation |
| Cascading failures (one fix might fix others) | ⚠️ Investigate together first |
| Unknown relationship | 🔍 Analyze dependencies first |

## Output

After completion, you'll receive:
- Summary table of all investigations
- Root causes identified
- Changes made
- Conflict check results
- Final test suite status

**If conflicts are detected (same files edited by multiple agents), manual resolution may be required.** The dispatcher will flag conflicts and provide recommendations.

## Definition of Done

A dispatch is considered successful when:
- ✅ All dispatched agents have completed and reported
- ✅ No conflicts detected, OR conflicts have been manually resolved
- ✅ Full test suite passes (or remaining failures are unrelated/new)
- ✅ Summary clearly identifies root causes and fixes applied
