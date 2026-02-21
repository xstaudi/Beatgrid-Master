# Feature-Struktur (Frontend)

Quick-Reference für Frontend Feature-Organisation.

**Detail-Docs:** `docs/entwicklung/feature-structure.md`

---

## Pflicht-Struktur

```
features/[feature]/
├── index.ts              # Feature barrel export (PFLICHT)
├── types.ts              # Feature-Types
├── components/
│   ├── index.ts          # Barrel export
│   └── [Component].tsx
├── hooks/
│   └── use[Feature].ts
└── services/
    └── [feature].api.ts  # API Client
```

---

## Optional (bei Bedarf)

```
├── pages/                # Nur bei eigenen Routes
├── context/              # Nur bei React Context
├── constants/            # Feature-Konstanten
└── utils/                # Feature-spezifische Utils
```

---

## Import-Regeln

```typescript
// ✅ RICHTIG: Barrel Import
import { TicketCard, useMyTickets } from '@/features/ticketing';

// ❌ VERBOTEN: Deep Import
import { TicketCard } from '@/features/ticketing/components/TicketCard';
```

**ESLint:** `no-restricted-imports` aktiv für Deep Imports

---

## Subdirectory-Pattern

Bei Rolle-spezifischen Komponenten (Organizer, Admin):

```
components/
├── index.ts              # Public Components
└── organizer/
    ├── index.ts          # Barrel für Organizer
    └── [Component].tsx
```

---

## Checkliste: Neues Feature

- [ ] `index.ts` im Feature-Root
- [ ] `components/index.ts` vorhanden
- [ ] API-Client in `services/[feature].api.ts`
- [ ] Hooks wrappen React Query
- [ ] Keine Deep Imports von außerhalb

---

**Siehe auch:** `module-structure.md` (Backend), `naming-conventions.md`
