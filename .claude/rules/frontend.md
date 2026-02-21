---
paths:
  - frontend/**/*.tsx
  - frontend/**/*.ts
  - frontend/**/*.css
---

# Frontend Rules (React + TanStack Query + Tailwind)

## Architektur
- **Pages:** Route-Komponenten in `features/[feature]/pages/`
- **Components:** Feature-UI in `features/[feature]/components/`
- **Hooks:** React Query Wrapper in `features/[feature]/hooks/`
- **Services:** API-Client in `features/[feature]/services/*.api.ts`

## Verboten

- ❌ **Keine direkten fetch/axios Calls** - immer über API-Client
- ❌ **Keine globalen UI-Komponenten duplizieren** (`components/ui/`)
- ❌ **Keine inline-Styles** - Tailwind verwenden
- ❌ **Kein Server-State in useState** - immer React Query
- ❌ **Keine klickbaren `div`s** - immer `button`/`link`
- ❌ **Keine Fokus-States entfernen** - A11y Pflicht
- ❌ **Kein `refetch()` in Components** - Mutations invalidieren explizit

## API-Client Pattern
```typescript
import { apiClient } from '@/lib/api-client';
export const xApi = {
  get: (id: string) => apiClient.get<XType>(`/api/x/${id}`),
};
```

## React Query Patterns

### Query-Key Konvention (Pflicht!)

**Regel:** Jeder Feature-Bereich hat ein eigenes `*QueryKeys` Objekt. Keine "inline" QueryKeys in Hooks.

**Pattern:**
```typescript
// QueryKeys definieren
export const xQueryKeys = {
  all: ['x'] as const,
  list: (filters: Filters) => [...xQueryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...xQueryKeys.all, 'detail', id] as const,
};

// Hook Pattern
import { useQuery } from '@tanstack/react-query';
export function useX(id: string) {
  return useQuery({
    queryKey: xQueryKeys.detail(id),
    queryFn: () => xApi.get(id),
  });
}
```

**Warum:** Konsistenz, einfache Invalidation, besseres Refactoring.

### Loading & Error Handling (Pflicht)

**Regel:** Jede Query-Komponente MUSS Loading- und Error-State behandeln.

```typescript
export function XComponent({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useX(id);

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorState error={error} />;

  return <div>{data.name}</div>;
}
```

**Regel:** `isLoading`, `isError` dürfen nicht ignoriert werden.

### Mutation Pattern

**Regel:** Mutations invalidieren immer explizit. Kein `refetch()` in Components.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateX() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: xApi.update,
    onSuccess: (_, variables) => {
      // Invalidation explizit
      qc.invalidateQueries({ queryKey: xQueryKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: xQueryKeys.all });
    },
  });
}
```

## Batch-Loading Pattern (N+1 Prevention) (#802)

**Problem:** Listen mit Status-Abfragen (Follow, Save, Like) machen N+1 API-Calls.

**Lösung:** Batch-Provider Pattern mit Context + Fallback

### Wann verwenden?
- Listen mit >5 Items die individuellen Status haben
- Wiederholte gleiche API-Calls für verschiedene IDs
- Komponenten die in Listen verwendet werden (Cards, Rows)

### Pattern
```typescript
// 1. Provider um die Liste wrappen
<XStatusProvider targetIds={items.map(i => i.id)} targetType="X">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</XStatusProvider>

// 2. Komponente mit Context + Fallback
const batchContext = useXStatusContext();
const singleQuery = useQuery({
  queryKey: ['x-status', id],
  queryFn: () => api.getStatus(id),
  enabled: !batchContext && isAuthenticated,
});
const status = batchContext?.getStatus(id) ?? singleQuery.data;
```

### Beispiel: FollowStatusProvider
```typescript
import { FollowStatusProvider } from '@/features/social/context/FollowStatusContext';

// In Directory Page
<FollowStatusProvider targetIds={clubs.map(c => c.id)} targetType="CLUB">
  <div className="grid ...">
    {clubs.map(club => <ClubCard key={club.id} club={club} />)}
  </div>
</FollowStatusProvider>
```

### Checkliste für neue Batch-Provider
- [ ] Backend Batch-Endpoint existiert oder erstellen
- [ ] API-Client Methode hinzufügen (`xApi.getStatusBatch`)
- [ ] Hook erstellen (`useXStatusBatch`)
- [ ] Context-Provider erstellen (`XStatusContext`)
- [ ] Komponente mit Fallback-Pattern updaten
- [ ] Cache-Invalidation für beide Keys (batch + single)

---

## State Management Regeln

**Kein State für Derived Data:**
```typescript
// ❌ State für Derived
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${firstName} ${lastName}`), [firstName, lastName]);

// ✅ Direkt berechnen
const fullName = `${firstName} ${lastName}`;
```

**useState nur für:**
- UI-Zustand (`open`, `selected`, `hovered`)
- Form-State (lokal, vor Submit)

**Server-State immer React Query:**
- API-Daten → `useQuery`
- Mutations → `useMutation`
- Kein `useState` für Server-Daten

## Performance

**Regeln:**
- Lists > 20 Items → memoized Item-Komponenten (`memo()`)
- Callbacks an Childs → `useCallback` (wenn messbar hilfreich)
- Expensive Berechnungen → `useMemo`
- Lazy Loading für Heavy Components (siehe Lazy-Loading Guide)

**Beispiel:**
```typescript
// Lists mit memo
export const Item = memo(function Item({ data }: Props) {
  return <div>{data.name}</div>;
});

// Callbacks mit useCallback
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);

// Expensive Berechnungen mit useMemo
const filtered = useMemo(
  () => items.filter(i => i.active),
  [items]
);
```

## Accessibility (Pflicht)

**Regeln:**
- Keine klickbaren `div`s → immer `button`/`link`
- Fokus-States dürfen nicht entfernt werden (immer sichtbar, mind. 2px Ring)
- Modals/Overlays nur über Dialog/Sheet Komponenten
- Touch Targets ≥ 44×44px (Buttons, Icons, Chips)

**Siehe:** @frontend/docs/focus-trap-guide.md

**Beispiel:**
```tsx
// ❌ Klickbarer div
<div onClick={handleClick}>Click me</div>

// ✅ Button
<button type="button" onClick={handleClick}>Click me</button>
```

## Styling

**Tailwind-First:**
- Design Tokens aus `tailwind.config.ts`
- Dark Mode: `dark:` Prefix
- Keine inline-Styles

**Custom CSS nur für:**
- Komplexe Animations-Keyframes (wenn Tailwind `@keyframes` nicht reicht)
- 3rd-party Overrides (z. B. external library styling)
- Immer dokumentieren, warum Tailwind nicht reicht

**Regel:** Custom CSS immer mit Kommentar begründen.

## Dateien

**File Size Regel (Soft Limit):**
- < 250 Zeilen pro Komponente (Soft Limit)
- Komplexe Komponenten in Subkomponenten splitten

## Imports & Exports

**Aliasing (Pflicht):**
- Imports immer über `@/` Alias
- Keine `../../..` Pfade

**Beispiel:**
```typescript
// ✅ Alias
import { Button } from '@/components/ui/button';
import { useEvents } from '@/features/events/hooks/useEvents';

// ❌ Relative Pfade
import { Button } from '../../../components/ui/button';
```

**Barrel Exports (erlaubt):**
- `index.ts` pro Feature erlaubt/erwünscht
- Exportiert nur öffentliche API (Components, Hooks, Types)
- Keine internen Details exportieren

**Beispiel:**
```typescript
// features/events/index.ts
export { EventsPage } from './pages/EventsPage';
export { useEvents } from './hooks/useEvents';
export type { Event } from './types';
```

---

## Do/Don't Beispiele

### ✅ Query mit QueryKeys + Loading/Error
```typescript
const { data, isLoading, isError, error } = useEvent(id);
if (isLoading) return <Skeleton />;
if (isError) return <ErrorState error={error} />;
return <EventCard event={data} />;
```

### ✅ Mutation mit Invalidation
```typescript
const update = useUpdateEvent();
update.mutate(data, {
  onSuccess: () => {
    // Invalidation automatisch via Hook
  },
});
```

### ❌ Don't: Inline QueryKeys, kein Loading/Error
```typescript
// ❌ Inline QueryKey
useQuery({ queryKey: ['event', id], ... });

// ❌ Kein Loading/Error Handling
const { data } = useEvent(id);
return <EventCard event={data} />; // data könnte undefined sein!
```

---

---

## Feature Organization & Barrel Exports (Pflicht!)

**Standard:** @docs/entwicklung/feature-structure.md

### Pflicht-Struktur

```
features/[feature]/
├── index.ts              # Feature barrel export (PFLICHT)
├── types.ts              # Feature-spezifische Types
├── components/
│   ├── index.ts          # Barrel export
│   └── [Component].tsx
├── hooks/
│   └── use[Feature].ts
└── services/
    └── [feature].api.ts  # API Client
```

### Import-Regeln (Pflicht)

**Regel:** Alle Imports via Feature-Root `index.ts` (Barrel Export)

```typescript
// ✅ RICHTIG: Barrel Import
import { TicketCard, useMyTickets } from '@/features/ticketing';

// ❌ VERBOTEN: Deep Import
import { TicketCard } from '@/features/ticketing/components/TicketCard';
```

**ESLint:** `no-restricted-imports` aktiv für Deep Imports

### Subdirectory-Pattern (Rolle-spezifisch)

Bei Features mit Rolle-spezifischen Komponenten (Organizer, Admin):

```
components/
├── index.ts              # Public Components
└── organizer/            # Organizer-spezifisch
    ├── index.ts          # Barrel für Organizer
    └── [Component].tsx
```

**Export im Feature-Root:**
```typescript
// features/ticketing/index.ts
export { TicketCard } from './components';
export { EventTicketingTab } from './components/organizer';
```

### Checkliste: Neues Feature

- [ ] `index.ts` im Feature-Root erstellt
- [ ] `components/index.ts` erstellt
- [ ] Alle Exports im Feature-Root gesammelt
- [ ] Keine Deep Imports von außerhalb

---

## Referenz

Styling-Details: @docs/entwicklung/styling-rules.md
App-Layout/Routes: @docs/produkt/app-layout.md
Focus Trap Guide: @frontend/docs/focus-trap-guide.md
Lazy-Loading Guide: @frontend/docs/lazy-loading-guide.md
**Feature-Struktur:** @docs/entwicklung/feature-structure.md
**Naming-Konventionen:** @docs/entwicklung/naming-conventions.md
