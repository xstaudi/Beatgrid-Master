# Modul-Struktur (Backend)

Quick-Reference für Backend Modul-Organisation.

**Detail-Docs:** `docs/entwicklung/module-structure.md`

---

## Pflicht-Struktur

```
modules/[module]/
├── controller.ts         # HTTP Handler (dünn!)
├── service.ts            # Business Logic + DB-Zugriff
├── routes.ts             # Express Routes
├── dtos.ts               # Zod Validation Schemas
└── types.ts              # TypeScript Types
```

---

## Sub-Services (>500 LOC)

```
modules/[module]/
├── services/
│   ├── index.ts              # Re-exports
│   ├── [module]-crud.service.ts
│   ├── [module]-query.service.ts
│   └── [module]-admin.service.ts
└── ...
```

---

## Responsibility Matrix

| Layer | Verantwortung |
|-------|---------------|
| **routes.ts** | HTTP-Routing, Auth-Middleware |
| **controller.ts** | Input-Parsing, Response |
| **service.ts** | Business-Logik, DB-Zugriff |
| **dtos.ts** | Zod Input-Validation |

---

## Verboten

- ❌ DB-Zugriff in Controllern
- ❌ Business-Logik in Routes
- ❌ Response-Handling in Services
- ❌ Logik in routes.ts

---

## Checkliste: Neues Modul

- [ ] `routes.ts` mit Express Router
- [ ] `controller.ts` (Request/Response)
- [ ] `service.ts` (Business-Logik)
- [ ] `dtos.ts` mit Zod Schemas
- [ ] `types.ts` mit TypeScript Types
- [ ] Routes registriert in `routes/index.ts`

---

**Siehe auch:** `feature-structure.md` (Frontend), `naming-conventions.md`
