---
name: e2e-testing-expert
description: Playwright E2E Testing Experte für theweekend.at - POM Pattern, Self-Healing Locators, Test-Daten Seeding
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
disable-model-invocation: true
---

# E2E Testing Expert - theweekend.at

Expert für Playwright E2E-Tests mit Page Object Model Pattern, Self-Healing Locators und theweekend.at-spezifischen Konventionen.

## Projekt-Kontext

**Platform:** theweekend.at - Electronic Music Event Platform (DACH)
**Stack:** Express + React + Drizzle ORM + PostgreSQL
**Test Framework:** Playwright
**Test-Verzeichnis:** `frontend/tests/e2e/`
**Base URL:** `http://localhost:5173` (Dev-Server)
**Backend API:** `http://localhost:3001` (proxied via Vite)

## Test-User & Rollen

### Test User Credentials (alle Passwort: `test123`)

| Email                 | Role      | Use Case                          |
| --------------------- | --------- | --------------------------------- |
| donstaudi@gmail.com   | MEMBER    | Main Test User (Fordtransit2021!) |
| djpulse@test.com      | DJ        | DJ-spezifische Tests              |
| matjosh@test.com      | DJ        | Multi-DJ Tests                    |
| felixp@test.com       | DJ        | Booking Tests                     |
| postgarage@test.com   | CLUB      | Venue Management Tests            |
| domimberg@test.com    | CLUB      | Multi-Venue Tests                 |
| viennanights@test.com | ORGANIZER | Event Organizer Tests             |

### Rollen-System

- **MEMBER** - Standard User, kann Events buchen, DJs followen
- **DJ** - Kann Profil pflegen, Gigs verwalten, zu Events applien
- **CLUB** - Kann Venues verwalten, Events hosten
- **ORGANIZER** - Kann Multi-Location Events organisieren
- **Rollenswitch:** Via `/api/auth/switch-role` (User kann mehrere Rollen haben)

## Page Object Model (POM) Pattern

### Struktur

```
frontend/tests/e2e/
  pages/                    # Page Objects
    BasePage.ts             # Gemeinsame Methoden (navigation, waitFor)
    LoginPage.ts            # Login-spezifische Locators/Actions
    EventsPage.ts           # Event-Liste
    EventDetailPage.ts      # Event-Detail
    BookingPage.ts          # Booking-Flow
    ProfilePage.ts          # User/DJ/Club Profile
    DashboardPage.ts        # Role-spezifische Dashboards
  fixtures/                 # Test-Daten Factories
    auth.fixture.ts         # Auth State Setup
    event.fixture.ts        # Event Test-Daten
    user.fixture.ts         # User Test-Daten
  auth.spec.ts              # Login, Register, Logout
  events.spec.ts            # Event Browse, Filter, Detail
  bookings.spec.ts          # Booking Flow
  checkins.spec.ts          # QR-Code Checkin
  profiles.spec.ts          # Profil ansehen, bearbeiten
  navigation.spec.ts        # Hauptnavigation, Rollenswitch
```

### BasePage Pattern

```typescript
// frontend/tests/e2e/pages/BasePage.ts
import { Page, Locator } from "@playwright/test";

export class BasePage {
  readonly page: Page;
  readonly baseURL = "http://localhost:5173";

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(`${this.baseURL}${path}`);
  }

  async waitForNavigation(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }

  // Self-Healing Helper: Try multiple locator strategies
  async findElement(selectors: string[]): Promise<Locator> {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if ((await element.count()) > 0) {
        return element;
      }
    }
    throw new Error(
      `Element mit Selektoren ${selectors.join(", ")} nicht gefunden`,
    );
  }
}
```

### Example: LoginPage

```typescript
// frontend/tests/e2e/pages/LoginPage.ts
import { BasePage } from "./BasePage";
import { expect } from "@playwright/test";

export class LoginPage extends BasePage {
  // Locators (Multiple Strategies für Self-Healing)
  get emailInput() {
    return this.page.locator(
      '[data-testid="email-input"], [name="email"], input[type="email"]',
    );
  }

  get passwordInput() {
    return this.page.locator(
      '[data-testid="password-input"], [name="password"], input[type="password"]',
    );
  }

  get submitButton() {
    return this.page.locator(
      '[data-testid="login-submit"], button[type="submit"]:has-text("Anmelden")',
    );
  }

  get errorMessage() {
    return this.page.locator('[role="alert"], .error-message');
  }

  // Actions
  async login(email: string, password: string) {
    await this.goto("/login");
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.waitForNavigation(/\/(dashboard|events)/);
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/\/(dashboard|events)/);
  }

  async expectLoginError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}
```

## Locator-Strategie (Self-Healing)

### Prioritäts-Reihenfolge

1. **data-testid** - Explizit für Tests (ideal, stabil)
2. **role + accessible-name** - Accessibility-basiert (semantisch, stabil)
3. **name** - Form-Attribute (semi-stabil)
4. **text** - Sichtbarer Text (fragil bei i18n)
5. **CSS-Klassen** - Nur als letzter Ausweg (sehr fragil)

### Self-Healing Pattern

```typescript
// Statt hartem Locator:
await page.locator("button.submit-btn").click();

// Self-Healing mit Fallbacks:
const submitBtn = await this.findElement([
  '[data-testid="submit-button"]', // Preferred
  'button[type="submit"]', // Semantic
  'button:has-text("Absenden")', // Text-based
  ".submit-btn", // Fallback
]);
await submitBtn.click();
```

### Playwright Best Practices

```typescript
// ❌ Schlecht: Harter Wait
await page.waitForTimeout(2000);

// ✅ Gut: Conditional Wait
await page.locator('[data-testid="event-card"]').waitFor({ state: "visible" });

// ❌ Schlecht: Fragiler Selektor
await page.locator(".css-abc123 > div:nth-child(2)").click();

// ✅ Gut: Semantischer Selektor
await page.getByRole("button", { name: "Event buchen" }).click();
```

## Test-Daten via API Seeding

**Prinzip:** Nutze Backend-APIs direkt um Test-Daten zu erstellen (schneller als UI-Flow).

### Auth State Wiederverwendung

```typescript
// frontend/tests/e2e/fixtures/auth.fixture.ts
import { test as base, request } from "@playwright/test";

export const test = base.extend({
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login via API statt UI
    const response = await context.request.post(
      "http://localhost:3001/api/auth/login",
      {
        data: {
          email: "donstaudi@gmail.com",
          password: "Fordtransit2021!",
        },
      },
    );

    const { accessToken } = await response.json();

    // Auth-State in Context speichern
    await context.addCookies([
      {
        name: "auth-token",
        value: accessToken,
        domain: "localhost",
        path: "/",
      },
    ]);

    await use(context);
    await context.close();
  },
});
```

### Event Seeding via API

```typescript
// frontend/tests/e2e/fixtures/event.fixture.ts
import { APIRequestContext } from "@playwright/test";

export async function createTestEvent(
  apiContext: APIRequestContext,
  data: Partial<Event>,
) {
  const response = await apiContext.post("http://localhost:3001/api/events", {
    data: {
      title: data.title || "Test Event",
      date: data.date || new Date().toISOString(),
      venueId: data.venueId || 1,
      ...data,
    },
  });

  return response.json();
}

export async function cleanupTestEvents(
  apiContext: APIRequestContext,
  eventIds: number[],
) {
  for (const id of eventIds) {
    await apiContext.delete(`http://localhost:3001/api/events/${id}`);
  }
}
```

### Usage in Tests

```typescript
import { test } from "./fixtures/auth.fixture";
import { createTestEvent, cleanupTestEvents } from "./fixtures/event.fixture";

test.describe("Event Booking", () => {
  let eventId: number;

  test.beforeEach(async ({ authenticatedContext }) => {
    const page = await authenticatedContext.newPage();
    const apiContext = authenticatedContext.request;

    // Event via API erstellen (schneller als UI)
    const event = await createTestEvent(apiContext, {
      title: "Techno Night",
      date: new Date("2026-03-15").toISOString(),
    });
    eventId = event.id;
  });

  test.afterEach(async ({ authenticatedContext }) => {
    // Cleanup
    await cleanupTestEvents(authenticatedContext.request, [eventId]);
  });

  test("sollte Event buchen können", async ({ authenticatedContext }) => {
    const page = await authenticatedContext.newPage();
    await page.goto(`/events/${eventId}`);
    await page.getByRole("button", { name: "Jetzt buchen" }).click();
    // ... rest of test
  });
});
```

## Prioritäts-Flows (nach Business-Impact)

### P0 - Kritisch (Revenue-Impact)

1. **Auth Flow**
   - Login → Dashboard → Logout
   - Registration → Email-Verifikation → Login

2. **Event Discovery**
   - Landing → Events-Liste → Filter (Genre, Datum, Ort) → Event-Detail

3. **Booking Flow**
   - Event-Detail → Buchen → Payment → Bestätigung
   - Ticket-Download (QR-Code)

### P1 - Wichtig (User-Retention)

4. **DJ Onboarding**
   - Register → Profil-Setup (Bio, Links, Genres) → Role Application → Approval

5. **Club Dashboard**
   - Login als Club → Venue verwalten → Event erstellen → Event bearbeiten

6. **Checkin Flow**
   - Ticket mit QR-Code → Scanner-View → Scan → Bestätigung

### P2 - Nice-to-have (Engagement)

7. **Social Features**
   - Profil besuchen → Follow → Unfollow
   - Event teilen (Social-Share)

8. **Search**
   - Suche (Events/DJs/Clubs) → Ergebnisse → Navigation

9. **Settings**
   - Einstellungen ändern (Notifications, Privacy) → Speichern

## Test-Konventionen

### Naming

```typescript
// ✅ Gut: Deutsch, beschreibend, Use-Case-orientiert
test.describe("Event Booking", () => {
  test("sollte Event mit gültiger Payment-Methode buchen", async ({ page }) => {
    // ...
  });

  test("sollte Fehler bei ausverkauftem Event zeigen", async ({ page }) => {
    // ...
  });
});

// ❌ Schlecht: Englisch, technisch, unklar
test.describe("Booking", () => {
  test("creates booking", async ({ page }) => {
    // ...
  });
});
```

### Struktur

```typescript
test.describe("Feature Name", () => {
  // Setup
  test.beforeEach(async ({ page }) => {
    // Shared setup (z.B. Login, Navigation)
  });

  // Cleanup
  test.afterEach(async ({ page }) => {
    // Cleanup (z.B. Test-Daten löschen)
  });

  // Happy Path
  test("sollte Haupt-Flow erfolgreich ausführen", async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });

  // Error Cases
  test("sollte Fehler bei ungültiger Eingabe zeigen", async ({ page }) => {
    // ...
  });

  // Edge Cases
  test("sollte korrekt verhalten bei Grenzfall", async ({ page }) => {
    // ...
  });
});
```

### Assertions

```typescript
// ✅ Gut: Spezifisch, klare Erwartung
await expect(page.getByRole("heading", { name: "Techno Night" })).toBeVisible();
await expect(page.getByText("Buchung erfolgreich")).toContainText(
  "erfolgreich",
);
await expect(page).toHaveURL(/\/events\/\d+\/success/);

// ❌ Schlecht: Vage, schwer zu debuggen
await expect(page.locator(".title")).toBeVisible();
await expect(page.locator("div")).toContainText("erfolgreich");
```

## Playwright Config

```typescript
// frontend/playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["html"],
    ["list"],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Optional: Multi-Browser Testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Debugging

### Lokales Debugging

```bash
# UI Mode (interaktiv, visuell)
npx playwright test --ui

# Debug Mode (einzelner Test)
npx playwright test auth.spec.ts --debug

# Headed Mode (Browser sichtbar)
npx playwright test --headed

# Einzelner Test
npx playwright test -g "sollte Login erlauben"
```

### Trace Viewer

```bash
# Nach fehlgeschlagenem Test
npx playwright show-report
npx playwright show-trace test-results/trace.zip
```

### VS Code Integration

```json
// .vscode/settings.json
{
  "playwright.testDir": "frontend/tests/e2e",
  "playwright.showTrace": true,
  "playwright.runOptions": {
    "headed": false,
    "workers": 1
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e --workspace=frontend
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Regeln & Best Practices

| Regel                                      | Begründung                                   |
| ------------------------------------------ | -------------------------------------------- |
| **Tests unabhängig**                       | Kein shared state, Tests parallel ausführbar |
| **Cleanup in afterEach**                   | Keine Seiteneffekte für folgende Tests       |
| **Keine hardcoded Waits**                  | Flaky Tests, nutze `waitFor` / `toBeVisible` |
| **Screenshots nur bei Fehlern**            | CI-Performance, Speicherplatz                |
| **Test-Daten via API**                     | Schneller als UI-Flow, reproduzierbarer      |
| **Auth State wiederverwenden**             | Nicht jeden Test neu einloggen               |
| **Page Object Model**                      | DRY, Wartbarkeit, Self-Healing Locators      |
| **data-testid bevorzugen**                 | Stabil, explizit für Tests                   |
| **Deutsch in Beschreibungen**              | Team-Konvention, bessere Lesbarkeit          |
| **CI: retries=2, headed=false, workers=1** | Stabilität in CI-Umgebung                    |

## Verwendung

```bash
# Skill aufrufen (auto-invokable)
/e2e-testing-expert

# Oder manuell mit Kontext
Erstelle E2E-Test für [Flow-Name] mit folgenden Szenarien:
- Happy Path: [Beschreibung]
- Error Case: [Beschreibung]
- Edge Case: [Beschreibung]

Rolle: [MEMBER/DJ/CLUB/ORGANIZER]
Test-File: frontend/tests/e2e/[name].spec.ts
```

## Output-Format

Der Skill erstellt:

1. Page Object(s) in `frontend/tests/e2e/pages/`
2. Fixture(s) falls nötig in `frontend/tests/e2e/fixtures/`
3. Test-File in `frontend/tests/e2e/[name].spec.ts`
4. Kurze README-Sektion mit Run-Anleitung

## Checkliste vor Abschluss

- [ ] Page Objects nutzen POM-Pattern
- [ ] Locators nutzen Self-Healing (multiple Strategien)
- [ ] Test-Daten via API erstellt (kein UI-Flow)
- [ ] Auth State wiederverwendet (kein redundanter Login)
- [ ] Deutsche Beschreibungen (test.describe, test())
- [ ] Cleanup in afterEach
- [ ] Keine hardcoded Waits (nur waitFor/toBeVisible)
- [ ] Screenshots nur bei Fehlern (Config)
- [ ] Test erfolgreich lokal ausgeführt (`npm run test:e2e`)
