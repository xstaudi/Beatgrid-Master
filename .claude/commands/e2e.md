# E2E Command

**Command:** /e2e [filter?] [--headed|--fix|--report|--generate]

**Beschreibung:** Vollautomatischer E2E-Test-Runner mit Auto-Fix Loop und Self-Healing.

## Varianten

- `/e2e` - Alle Tests headless
- `/e2e login` - Nur Tests mit "login" im Namen
- `/e2e --headed` - Tests im sichtbaren Browser
- `/e2e --fix` - Bei Failures automatisch fixen (bis zu 3 Retries)
- `/e2e --report` - Detaillierten HTML-Report öffnen
- `/e2e --generate` - Neuen Test generieren (interaktiv)

## Workflow

### Phase 1: Voraussetzungen prüfen

```bash
# 1. Frontend Server Status
lsof -ti:5173 || echo "WARN: Frontend nicht auf :5173"

# 2. Backend Server Status
lsof -ti:3001 || echo "WARN: Backend nicht auf :3001"

# 3. Playwright installiert?
npx playwright --version || npx playwright install
```

**Wichtig:** Bei fehlenden Servern NICHT abbrechen - nur Warnung ausgeben.

### Phase 2: Tests ausführen

```bash
# Basis-Command
cd frontend && npx playwright test

# Mit Filter
cd frontend && npx playwright test [filter]

# Headed Mode
cd frontend && npx playwright test --headed

# Mit UI (für --report)
cd frontend && npx playwright test --ui
```

**Output Monitoring:**

- Bei `✓` oder `passed` → Success
- Bei `✗` oder `failed` → Trigger Auto-Fix (wenn --fix)
- Bei `skipped` → Info

### Phase 3: Auto-Fix Loop (nur mit --fix)

**Trigger:** Test failure detected

**Max Retries:** 3

**Loop:**

1. **Fehlertyp identifizieren** (aus Playwright Output)
2. **Fix anwenden** (siehe Fehlertyp-Mapping)
3. **Re-Run Test** (gleicher Filter)
4. **Repeat** bis Success oder Max Retries

**Abbruch:**

- Nach 3 Failures → Phase 4 (Fehler-Report)
- Bei Success → "✓ Test fixed after X retries"

## Fehlertyp-Mapping

### 1. Locator nicht gefunden

**Pattern:** `locator.*not found|waiting for locator.*failed`

**Fix-Strategie:**

```typescript
// 1. Screenshot analysieren (playwright-report/screenshots/)
// 2. Locator-Strategie anpassen (data-testid > role > text)
// 3. Wait-Timeout erhöhen (falls Element langsam lädt)

// Vor (anfällig):
await page.click('button:has-text("Submit")');

// Nach (robust):
await page.getByTestId("submit-button").click();
// oder
await page.getByRole("button", { name: "Submit" }).click();
```

**Dateien:**

- Test-File: `frontend/tests/**/*.spec.ts`
- App-Code: Nur wenn data-testid fehlt

### 2. Timeout

**Pattern:** `timeout.*exceeded|page.goto.*timeout`

**Fix-Strategie:**

```typescript
// 1. Timeout erhöhen (Netzwerk langsam?)
await page.goto("/", { timeout: 10000 });

// 2. Wait-Strategie verbessern
await page.waitForLoadState("networkidle");

// 3. API-Mock hinzufügen (wenn API langsam)
await page.route("**/api/slow-endpoint", (route) => {
  route.fulfill({ status: 200, body: "{}" });
});
```

**Dateien:**

- Test-File: `frontend/tests/**/*.spec.ts`

### 3. API 500 Error

**Pattern:** `500.*Internal Server Error|API.*failed.*500`

**Fix-Strategie:**

```typescript
// 1. Backend-Logs prüfen
// Bash: cd backend && npm run logs | grep ERROR

// 2. Test auf Mock umstellen (temporär)
await page.route("**/api/problematic-endpoint", (route) => {
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true }),
  });
});

// 3. Backend-Fix wenn nötig (Service-Layer)
```

**Dateien:**

- Test-File: Mock hinzufügen
- Backend: `backend/src/modules/**/service.ts` (nur bei echtem Bug)

### 4. Auth Failed

**Pattern:** `401.*Unauthorized|not authenticated|login.*failed`

**Fix-Strategie:**

```typescript
// 1. Auth-Helper nutzen (statt manueller Login-Flow)
import { login } from "./helpers/auth";
await login(page, "test@example.com", "password");

// 2. Session-Storage prüfen
const token = await page.evaluate(() => localStorage.getItem("token"));
expect(token).toBeTruthy();

// 3. Backend Auth-Middleware prüfen (falls Token ungültig)
```

**Dateien:**

- Test-File: `frontend/tests/helpers/auth.ts`
- Backend: `backend/src/middleware/auth.ts` (nur bei Middleware-Bug)

### 5. Assertion Failed

**Pattern:** `expect.*toBe.*failed|assertion.*failed`

**Fix-Strategie:**

```typescript
// 1. Timing-Problem? → waitFor verwenden
await expect(page.locator(".success-message")).toBeVisible();
// statt:
expect(await page.locator(".success-message").isVisible()).toBe(true);

// 2. Wert-Vergleich lockern
await expect(page.locator(".count")).toContainText("3");
// statt:
await expect(page.locator(".count")).toHaveText("Exactly 3 items");

// 3. Selector korrigieren (Screenshot prüfen)
```

**Dateien:**

- Test-File: Assertion-Logik anpassen

## Auto-Fix Pseudo-Code

```typescript
let retries = 0;
let testPassed = false;

while (!testPassed && retries < 3) {
  // Run test
  const result = await runPlaywrightTest(filter, options);

  if (result.passed) {
    testPassed = true;
    log(`✓ Test passed${retries > 0 ? " after " + retries + " retries" : ""}`);
    break;
  }

  // Parse error type
  const errorType = parseErrorType(result.output);

  // Apply fix
  const fixApplied = await applyFix(errorType, result.failedTest);

  if (!fixApplied) {
    log(`✗ No fix available for error: ${errorType}`);
    break;
  }

  retries++;
  log(`→ Retry ${retries}/3 after applying fix for: ${errorType}`);
}

if (!testPassed && retries >= 3) {
  // Phase 4: Detailed error report
  await generateErrorReport(lastResult);
}
```

## Phase 4: Fehler-Report (nach 3 Failures)

**Output-Format:**

```markdown
## E2E Test Failure Report

**Test:** [test-name]
**Retries:** 3/3
**Last Error:** [error-type]

### Error Details

[full stack trace]

### Screenshots

- Before: playwright-report/screenshots/[test]-before.png
- After Fix 1: playwright-report/screenshots/[test]-retry-1.png
- After Fix 2: playwright-report/screenshots/[test]-retry-2.png

### Applied Fixes

1. [Fix 1 description]
2. [Fix 2 description]
3. [Fix 3 description]

### Recommendation

[basierend auf Error-Pattern - z.B. "Backend Service prüfen", "Locator-Strategie überdenken"]

### Next Steps

1. Playwright Report öffnen: `cd frontend && npx playwright show-report`
2. Backend Logs prüfen: `cd backend && npm run logs`
3. Manuelle Reproduktion: `cd frontend && npx playwright test [test-name] --headed --debug`
```

**Speicherort:** `.claude/reports/e2e-failure-[timestamp].md`

## Implementation-Details

### Bash Tool Usage

**Wichtig:** Alle Commands via Bash(npx:\*) erlaubt - KEINE Permission-Prompts!

```bash
# Playwright installieren (falls nicht vorhanden)
npx playwright install --with-deps

# Tests ausführen (verschiedene Modi)
cd frontend && npx playwright test
cd frontend && npx playwright test --headed
cd frontend && npx playwright test auth.spec.ts
cd frontend && npx playwright test --grep "login"

# Report öffnen
cd frontend && npx playwright show-report

# Test generieren
cd frontend && npx playwright codegen http://localhost:5173
```

### Screenshot-Handling

**Bei Failure automatisch:**

```bash
# Screenshots sind bereits in playwright-report/
# Kein extra Command nötig - Playwright macht das automatisch
```

**Im Fehler-Report referenzieren:**

```markdown
![Screenshot](./../playwright-report/screenshots/[test-name]-[timestamp].png)
```

### File-Editing für Auto-Fix

**Strategie:**

1. **Test-Code zuerst** (90% der Fälle)
   - Locator anpassen
   - Wait-Strategien verbessern
   - Timeouts erhöhen

2. **App-Code nur wenn nötig** (10% der Fälle)
   - data-testid fehlt
   - Backend-Bug (500 Error)
   - Auth-Middleware-Bug

**Edit-Pattern:**

```typescript
// Read Test File
const testContent = await Read("frontend/tests/auth.spec.ts");

// Identify failed assertion
const failedLine = parseFailedAssertion(testContent, errorOutput);

// Apply Fix
await Edit({
  file_path: "frontend/tests/auth.spec.ts",
  old_string: `await page.click('button:has-text("Login")')`,
  new_string: `await page.getByRole('button', { name: 'Login' }).click()`,
});
```

## Beispiel-Flows

### Erfolgreicher Test

```bash
$ /e2e login

→ Prüfe Voraussetzungen...
  ✓ Frontend läuft auf :5173
  ✓ Backend läuft auf :3001
  ✓ Playwright installiert

→ Führe Tests aus: login
  ✓ tests/auth/login.spec.ts (3/3 passed)

✓ Alle Tests erfolgreich
```

### Auto-Fix Erfolg

```bash
$ /e2e --fix navigation

→ Prüfe Voraussetzungen...
  ✓ Frontend läuft auf :5173
  ✓ Backend läuft auf :3001

→ Führe Tests aus: navigation
  ✗ tests/navigation.spec.ts (1/3 failed)
    Error: Locator 'button:has-text("Next")' not found

→ Auto-Fix aktiviert (Retry 1/3)
  → Fehlertyp: Locator nicht gefunden
  → Fix: Ändere zu getByRole('button', { name: 'Next' })
  → Re-Run Test...
  ✓ tests/navigation.spec.ts (3/3 passed)

✓ Test fixed after 1 retry
```

### 3 Failures → Report

```bash
$ /e2e --fix api-integration

→ Führe Tests aus: api-integration
  ✗ tests/api/integration.spec.ts (0/5 passed)
    Error: API returned 500

→ Auto-Fix Retry 1/3
  → Fix: Mock API endpoint
  → Re-Run...
  ✗ Still failing (Assertion error)

→ Auto-Fix Retry 2/3
  → Fix: Adjust assertion timing
  → Re-Run...
  ✗ Still failing (Timeout)

→ Auto-Fix Retry 3/3
  → Fix: Increase timeout
  → Re-Run...
  ✗ Still failing

✗ Max retries erreicht. Generiere Fehler-Report...
  → Report gespeichert: .claude/reports/e2e-failure-20250211-143022.md

→ Next Steps:
  1. Report öffnen: /Users/.../reports/e2e-failure-20250211-143022.md
  2. Playwright Report: cd frontend && npx playwright show-report
  3. Backend Logs: cd backend && npm run logs | grep ERROR
```

## Spezial-Varianten

### /e2e --report

**Workflow:**

1. Öffnet letzten Playwright HTML-Report
2. Falls nicht vorhanden: Führe Tests aus → dann Report

```bash
cd frontend && npx playwright show-report
```

### /e2e --generate

**Workflow:**

1. Starte Playwright Codegen im headed mode
2. User interagiert mit App
3. Generierter Code wird in neue .spec.ts geschrieben

```bash
cd frontend && npx playwright codegen http://localhost:5173
```

**Nach Codegen:**

```
→ Test aufgenommen. Wo speichern?
  [User gibt Filename ein: z.B. "checkout-flow"]

→ Speichere unter: frontend/tests/checkout-flow.spec.ts
  ✓ Datei erstellt

→ Möchtest du den Test jetzt ausführen? [y/n]
```

## Permissions & Security

**Wichtig:** Command ist vollautomatisch - keine Prompts!

**Erlaubte Bash-Commands:**

- `npx playwright *` (alle Playwright-Commands)
- `cd frontend && *` (Frontend-Context)
- `cd backend && npm run logs` (Log-Analyse)
- `lsof -ti:*` (Port-Check)

**File-Operations:**

- Read: `frontend/tests/**/*.spec.ts`
- Edit: `frontend/tests/**/*.spec.ts` (Test-Code)
- Edit: `frontend/src/**/*.tsx` (nur wenn data-testid fehlt)
- Edit: `backend/src/**/*.ts` (nur bei echten Bugs)
- Write: `.claude/reports/e2e-failure-*.md` (Fehler-Reports)

**KEINE Permission-Prompts für:**

- Playwright installieren (`npx playwright install`)
- Tests ausführen
- Screenshots speichern
- Reports generieren

## Fehlerbehandlung

### Server nicht erreichbar

```bash
# Check läuft in Phase 1
lsof -ti:5173 || echo "⚠️  Frontend nicht auf :5173 - starte mit 'npm run dev'"
lsof -ti:3001 || echo "⚠️  Backend nicht auf :3001 - starte mit 'npm run dev --workspace=backend'"

# NICHT abbrechen - User kann Tests trotzdem ausführen (z.B. nur Backend-Tests)
```

### Playwright nicht installiert

```bash
# Auto-Install in Phase 1
npx playwright --version || {
  echo "→ Playwright nicht gefunden. Installiere..."
  npx playwright install --with-deps
}
```

### Test-File nicht gefunden

```bash
$ /e2e nonexistent-test

→ Führe Tests aus: nonexistent-test
  ⚠️  Keine Tests gefunden für Filter: "nonexistent-test"

→ Verfügbare Tests:
  - auth/login.spec.ts
  - auth/registration.spec.ts
  - navigation.spec.ts
  [...]

Tipp: Nutze /e2e --generate um einen neuen Test zu erstellen
```

## Performance

**Test-Parallelisierung:** Playwright nutzt automatisch alle CPU-Cores

**Optimierungen:**

- Headless Mode (default) ist 3x schneller als --headed
- Screenshots nur bei Failures (spart I/O)
- Auto-Fix Loop cached Test-Context (kein neu-Setup bei Retry)

**Typische Laufzeiten:**

- 1 Test: 2-5 Sekunden
- Full Suite (20 Tests): 15-30 Sekunden
- Mit --headed: 2-3x länger

## Monitoring & Logging

**Console Output:**

```
[12:34:56] → Prüfe Voraussetzungen...
[12:34:56]   ✓ Frontend läuft auf :5173
[12:34:56]   ✓ Backend läuft auf :3001
[12:34:57] → Führe Tests aus: login
[12:34:59]   ✓ auth/login.spec.ts (3/3)
[12:35:01] ✓ Tests abgeschlossen: 3 passed, 0 failed
```

**Log-Files:**

- Playwright: `frontend/test-results/` (automatisch)
- Fehler-Reports: `.claude/reports/e2e-failure-*.md`

## Integration mit anderen Commands

### Mit /test

```bash
# Unit-Tests → E2E-Tests
$ /test frontend
  ✓ All unit tests passed
$ /e2e
  ✓ All E2E tests passed

→ Full test suite passed!
```

### Mit /done

```bash
# Nach Feature-Implementierung
$ /done #123

→ Implementierung abgeschlossen
→ Führe E2E-Tests aus...
  [/e2e automatically triggered]
  ✓ All tests passed

→ Ready to commit
```

## Troubleshooting

### "Browser not found"

```bash
# Re-Install Playwright browsers
cd frontend && npx playwright install --with-deps
```

### "Port already in use"

```bash
# Frontend blockiert
lsof -ti:5173 | xargs kill -9
npm run dev

# Backend blockiert
lsof -ti:3001 | xargs kill -9
npm run dev --workspace=backend
```

### Tests hängen

```bash
# Mit Timeout abbrechen
cd frontend && timeout 60s npx playwright test

# Oder einzeln im Debug-Mode
cd frontend && npx playwright test --headed --debug
```

## Future Enhancements

- [ ] Visual Regression Testing (Screenshot-Diffs)
- [ ] Performance Metrics (Core Web Vitals)
- [ ] Accessibility Tests (axe-core Integration)
- [ ] Mobile Device Emulation
- [ ] Cross-Browser Testing (Firefox, Safari)
- [ ] CI/CD Integration (GitHub Actions)

---

**Version:** 1.0
**Last Updated:** 2026-02-11
