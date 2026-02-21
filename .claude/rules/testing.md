---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
---

# Testing Rules

## Test-Typen (verbindlich)

### Unit Tests
- Testen **eine** Funktion oder Komponente
- Keine echten API-Calls
- Keine echten DB-Zugriffe
- Mocks erlaubt (sparsam)

### Integration Tests
- Zusammenspiel mehrerer Module
- Echter API-Client mit Mock-Server (MSW)
- Kein echtes Netzwerk, keine echte DB

### E2E Tests
- Echter Browser
- Echter Backend-Stack
- Keine Mocks (Ausnahme: externe Services)

## Test-Struktur

- **Unit Tests** neben der Datei: `component.test.tsx`
- **Integration Tests** in `__tests__/` Ordner
- **E2E Tests** in `e2e/` Ordner

## Naming

- `describe` Block: Komponenten-/Funktionsname
- `it` Block: "should [expected behavior]"

**Beispiel:**
```typescript
describe('LoginForm', () => {
  it('should submit credentials and show success message', async () => {
    // ...
  });
});
```

## Best Practices

- **Arrange-Act-Assert Pattern** (AAA)
- **Keine Implementation Details testen** (keine classNames, keine internen State-Namen)
- **User-Perspektive bevorzugen** (Testing Library)
- **Mocks sparsam einsetzen**

## React Testing Regeln

**Kein Testen interner State-Namen:**
```typescript
// ❌ Implementation Details
expect(component.state.isOpen).toBe(true);

// ✅ User-sichtbare Änderungen
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

**Keine Suche nach classNames:**
```typescript
// ❌ Fragil (Styling-Änderungen brechen Test)
screen.getByClassName('modal-open');

// ✅ Semantisch (Zugänglichkeits-basiert)
screen.getByRole('dialog');
```

**Queries bevorzugt (Priorität):**
1. `getByRole` (meist beste Option)
2. `getByLabelText` (für Form-Fields)
3. `getByText` (für visuellen Text)
4. `getByTestId` nur als letzte Option (und nur mit `data-testid`)

**Beispiel:**
```typescript
// ✅ Role-basiert
screen.getByRole('button', { name: /login/i });
screen.getByRole('textbox', { name: /email/i });

// ✅ Label-basiert (Forms)
screen.getByLabelText(/email/i);

// ❌ TestId als erstes (zu spät, versuche semantische Queries)
screen.getByTestId('submit-button');
```

## Async Testing

**Regeln:**
- Immer `await` bei async UI-Updates
- Keine `setTimeout`-basierten Tests
- `waitFor` nur wenn notwendig (React Query, Animationen)

**Beispiel:**
```typescript
// ✅ Async richtig
await waitFor(() => {
  expect(screen.getByText(/erfolg/i)).toBeInTheDocument();
});

// ❌ setTimeout (fragil, Timing-abhängig)
setTimeout(() => {
  expect(screen.getByText(/erfolg/i)).toBeInTheDocument();
}, 100);
```

## Mocking Regeln

**Keine Mocks für eigene Business-Logik:**
```typescript
// ❌ Eigene Business-Logik mocken
jest.mock('@/services/calculationService');

// ✅ Business-Logik echt testen
// Nur externe Dependencies mocken
```

**API-Calls → MSW statt jest.mock:**
```typescript
// ❌ Hook komplett mocken
jest.mock('@/features/x/hooks/useX');

// ✅ API Response mocken (MSW)
server.use(
  rest.get('/api/x/:id', (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, name: 'Test' }));
  })
);
```

**Zeit/Random → explizit mocken:**
```typescript
// Zeit mocken (wenn nötig)
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01'));

// Random mocken (wenn nötig)
jest.spyOn(Math, 'random').mockReturnValue(0.5);
```

**Keine Snapshot-Mocks von komplexen Objekten:**
```typescript
// ❌ Komplexes Objekt mocken (fragil)
const mockEvent = { ... }; // 50 Zeilen

// ✅ Minimal Mock (nur benötigte Felder)
const mockEvent = { id: '123', name: 'Test Event' };
```

## Coverage

**Regeln (keine harte Prozent-Grenze pro Datei):**
- Kritische Business-Logik **MUSS** getestet sein
- UI-Komponenten: Happy Path + Error Path
- **Optional (CI-tauglich):** Global Coverage Ziel: 70%
- **Regel:** Neue Features dürfen Coverage nicht senken

**Was testen:**
- ✅ Positive Cases (Happy Path)
- ✅ Error Cases (Validation, API-Fehler)
- ✅ Edge Cases (leere Listen, null/undefined)
- ❌ Triviale Code-Pfade (getter/setter ohne Logik)

## Test-Stabilität

**Flaky Tests:**
- Flaky Tests sofort fixen oder deaktivieren
- Kein Retry als Lösung für kaputte Tests
- E2E: Screenshots + Video bei Failure speichern

**Diagnostik:**
- Fehlende Mocks? → Error-Message klar, Setup prüfen
- Timing-Probleme? → `waitFor` statt `setTimeout`
- Unstabile Selektoren? → Semantische Queries (`getByRole`) statt `getByTestId`

---

## Gold Standard Test-Beispiel

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/msw/server';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should submit credentials and show success message', async () => {
    // Arrange
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm />
      </QueryClientProvider>
    );

    // Act
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    expect(await screen.findByText(/willkommen/i)).toBeInTheDocument();
  });

  it('should show error message on invalid credentials', async () => {
    // Arrange
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
      })
    );
    
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm />
      </QueryClientProvider>
    );

    // Act
    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    expect(await screen.findByText(/ungültige anmeldedaten/i)).toBeInTheDocument();
  });
});
```

---

## Commands

```bash
npm run test           # Unit Tests
npm run test:coverage  # Mit Coverage
npm run test:e2e       # E2E Tests
npm run test:watch     # Watch Mode
```

---

## Referenz

Testing Library Docs: https://testing-library.com/react
React Query Testing: https://tanstack.com/query/latest/docs/react/guides/testing
MSW (Mock Service Worker): https://mswjs.io/
**Naming-Konventionen:** @docs/entwicklung/naming-conventions.md
