# CLAUDE.md - Beatgrid Master

## Über mich

Ich bin Solo-Entwickler und Gründer. Meine Erwartung an KI-Assistenz:
- Auf Augenhöhe mitdenken, nicht erklären
- Direkt und ohne Floskeln
- Vorschläge machen statt Rückfragen zu Basics
- UX soll userfreundlich und sinnvoll sein

## Planning vs Implementation

- Wenn ein Plan-Dokument existiert → direkt implementieren, nicht nochmal explorieren
- Explizit sagen wenn nur Plan gewünscht ist, sonst wird implementiert
- Kein Session-Ende mit "nur Plan" wenn Implementation erwartet wird

## Projekt-Essenz

DJ Library Analyzer SaaS | Beatgrid Check, BPM Verification, Key Detection, Clipping Detection, Duplicate Detection, Missing Metadata Audit | Client-Side Processing (Privacy-First) | Auto-Fix via XML Export
**Stack:** Next.js + TypeScript + Vercel | WASM (Aubio, Essentia.js, Chromaprint, FFmpeg) in Web Workers | Supabase (Auth + Postgres) | Stripe | Zustand/Jotai

## Struktur

```
src/
├── app/              # Next.js App Router (Pages, Layouts, API Routes)
├── features/         # Feature-Module (beatgrid, bpm, key, clipping, duplicates, metadata)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── index.ts
├── components/       # Shared UI Components
├── lib/              # Utilities, API-Client, XML Parser, Adapters
│   ├── adapters/     # Rekordbox XML + Traktor NML Adapter
│   ├── xml/          # XML Parser + Mutation Engine
│   └── audio/        # Audio Utils, File System Access
├── workers/          # Web Worker Entry Points (Decode, Beat, Key, Clip, Fingerprint)
└── wasm/             # WASM Module Loader + Bindings (Aubio, Essentia, Chromaprint, FFmpeg)
```

## Getting Started

```bash
npm install
npm run dev          # Next.js Dev Server (localhost:3000)
```

## Key Entry Points

| Datei | Zweck |
| ----- | ----- |
| `src/app/page.tsx` | Landing Page + Import Flow |
| `src/app/analyze/page.tsx` | Analyse-Konfiguration + Processing |
| `src/app/report/page.tsx` | Report Dashboard |
| `src/lib/adapters/rekordbox.ts` | Rekordbox XML Parser + Writer |
| `src/lib/adapters/traktor.ts` | Traktor NML Parser + Writer |
| `src/lib/xml/mutation-engine.ts` | XML Auto-Fix Engine |
| `src/workers/pipeline.ts` | Worker Pipeline Orchestrator |
| `src/wasm/loader.ts` | WASM Module Lazy Loader |

## Visual Development

### Design Principles
- Art Deco Design System in `.claude/context/design-principles.md`
- Warm Kupfer Night Mode Palette
- Bei visuellen Aenderungen IMMER gegen Design Principles pruefen

### Quick Visual Check
NACH jeder Frontend-Aenderung:
1. Betroffene Pages identifizieren
2. Via Browser navigieren und visuell pruefen
3. Screenshot bei Desktop Viewport (1440px)
4. Gegen Design Principles vergleichen
5. Console auf Fehler pruefen

## Architektur-Prinzipien

| Prinzip | Regel |
| ------- | ----- |
| **Client-Side Processing** | Audio verlässt nie den Rechner - alle Analyse via WASM in Web Workers |
| **Adapter Pattern** | Ein Track-Interface, je ein Adapter für Rekordbox XML und Traktor NML |
| **WASM Worker Pipeline** | Decode → parallel (Beat + Key + Clipping) → Results Aggregator |
| **Privacy-First** | Kein Audio-Upload, Backend nur für Auth/Subscriptions/History |
| **Lazy Loading** | WASM-Module erst laden wenn jeweiliger Check aktiviert |
| **Type Safety** | Strikte TypeScript-Typen für Audio-Daten, XML-Schemas, Worker Messages |

## Gotchas

| Thema | Details |
| ----- | ------- |
| **WASM Lazy Loading** | Module erst bei Check-Aktivierung laden, nicht im Initial Bundle |
| **File System Access API** | Nur Chromium - Fallback auf `<input webkitdirectory>` für Firefox/Safari |
| **Rekordbox XML** | Absolute Pfade (`file://localhost/...`) - Matching via Filename + Dateigröße |
| **Traktor NML** | Key als numerischer Wert (0-23), BPM mit 6 Dezimalstellen |
| **Essentia.js Lizenz** | AGPL - SaaS-Nutzung muss geklärt werden |
| **Variable BPM** | Live-Recordings/Vinyl-Rips erkennen und flaggen, kein Auto-Fix |

## Scope Discipline

- NUR ändern was explizit beschrieben/geplant ist
- Kein Feature-Creep über Issue-Scope hinaus
- Bei Redirect: SOFORT stoppen und neue Richtung folgen

## Commands

```bash
npm run dev          # Next.js Dev Server (localhost:3000)
npm run build        # Production Build
npm run lint         # ESLint
npm run test         # Vitest
npm run type-check   # tsc --noEmit
```

## Commit Workflow

- Default: EIN Commit pro Task (nicht splitten)
- Pre-Commit-Hook Fehler an unrelated Files: 1x Retry, dann --no-verify
- npx tsc --noEmit IMMER vor Commit (wird durch TaskCompleted-Hook erzwungen)

## Debugging-Regel

- Root Cause identifizieren BEVOR Fix implementiert wird
- Keine Band-Aid Lösungen (Timeouts statt echtem Fix)
- Eigene Änderungen als Ursache prüfen bevor pre-existing Issues untersucht werden

## Task-Abschluss

- Docs aktualisieren wenn betroffen
- CHANGELOG.md nur bei Major/Breaking/Security (1 Zeile!)
- **NIEMALS selbstständig committen** - Commits nur durch `/done`, `/ship` oder `/commit`

## Kritische Rules

### Clean Code

- Keine unbenutzten Imports/Variablen
- < 250 Zeilen/Datei
- Keine `any` ohne Kommentar
- Input validieren (Zod)
- **Feature-Ordner:** `components/`, `hooks/`, `services/` + je `index.ts` (Barrel Exports)
- **Neue Features:** Strukturiert in Feature-Ordner - nie alles flach in einen Ordner

### Systemweites Denken (Impact-First)

**Regel:** Keine Punktlösungen - immer systemweite Auswirkungen prüfen!

**Vor JEDER Änderung:**

| Frage | Aktion |
|-------|--------|
| Wo wird diese Funktion/Komponente noch verwendet? | Grep / Symbol-Suche |
| Gibt es ähnliche Stellen mit gleichem Problem? | Codebase durchsuchen |
| Existiert bereits ein Pattern/Utility dafür? | Shared-Module prüfen |
| Welche Tests könnten betroffen sein? | Test-Suche vor Änderung |

**Nach JEDER Änderung:**

- Alle Verwendungsstellen prüfen (nicht nur die eine)
- Ähnliche Patterns konsistent anpassen
- Bei wiederholtem Code → Utility/Hook extrahieren

### Token-Optimierung

- Nur relevante Dateien/Diffs laden
- Keine Build-Artefakte (node_modules, dist)
- Globale Refactors nur mit Freigabe

### GitHub Issues

**Issue-First:** Immer erst Issue erstellen, dann arbeiten.

```bash
gh issue create --title "Titel ohne Emojis" \
  --label "typ:feature,prio:high,bereich:frontend,model:opus"
```

**Pflicht-Labels:** typ:*, prio:*, bereich:*, model:*
**Models:** opus (komplex), sonnet (einfach)

**Model-Label Entscheidung:**

- `model:opus` - Architektur, Audio-Algorithmen, Web Workers, Security, Epics
- `model:sonnet` - UI-Komponenten, Bug-Fixes, Styling, Docs, Refactoring

### Security-First Commits

**Regel:** Nur Dateien mit echten Secrets in `.gitignore` - Config/Tools committen!
**Details:** Siehe `.claude/rules/git.md`

## Workflow-Regeln

| Regel | Details |
| ----- | ------- |
| **Plan-First** | IMMER planen vor Code. `/plan`, `/feature`, `/work` erzwingen Plan-Phase |
| **Agent Teams** | Bei "Team"/"--team" Anfrage IMMER Agent Teams spawnen, nie Single-Context |
| **Multi-Sprint Pläne** | Pläne mit Sprints, Dateien, Risiken. Keine vagen Optionen |
| **TypeScript Gate** | `tsc --noEmit` muss vor Task-Abschluss bestehen (Hook: TaskCompleted) |
| **Phasen-Suche** | Web-Suchen in Phasen (breit→spezifisch). Max 8 Queries pro Phase |

## Claude Code Erweiterungen

**Claude Code:** `.claude/README.md` (Agents, Commands, Skills, Workflows)

## Referenzen

- Issue-Template: `.claude/prompts/issue-gold-standard-template.md`
- Context: `.claude/context/` (Tech-Stack, Glossary, Naming)

**Version:** 1.0 | **Updated:** 2026-02-21
