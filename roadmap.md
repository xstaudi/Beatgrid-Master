# Roadmap: Beatgrid Master

> **Status:** Pre-Development | **Sprints:** 10 x 2 Wochen (20 Wochen MVP)
> **Ansatz:** Features First, Infra Last – lokal lauffähig und testbar ab Sprint 1
> **Stack:** Next.js + TypeScript + WASM (Aubio, Essentia.js, Chromaprint, FFmpeg) in Web Workers

---

## Sprint-Übersicht

| Sprint | Wochen | Fokus | Ergebnis |
|--------|--------|-------|----------|
| **0** | W1–2 | Next.js Bootstrap + XML Parser | Rekordbox/Traktor XML einlesen, Tracks anzeigen |
| **1** | W3–4 | UI Shell + Metadata Audit | Import → Report Flow, erster Check ohne WASM |
| **2** | W5–6 | WASM Audio Decoder + Worker Pipeline | Audio Files lokal dekodieren, PCM Pipeline steht |
| **3** | W7–8 | Beatgrid Check + BPM Verification | Aubio-basierte Analyse, Ergebnisse im Report |
| **4** | W9–10 | Key Detection + Clipping Detection | Essentia.js / Alternative + Custom Clipping |
| **5** | W11–12 | Duplicate Detection | Metadata-Blocking + Chromaprint Fingerprint |
| **6** | W13–14 | Report Dashboard | Filtering, Sorting, Track Detail, Waveform |
| **7** | W15–16 | XML Mutation Engine + Auto-Fix | Fix Preview, Export, Import-Anleitung |
| **8** | W17–18 | Auth + Stripe + Free Tier | Supabase/Clerk, Payments, Limits |
| **9** | W19–20 | Git, Vercel, Lizenz, Launch-Prep | Deployment, SEO, Lizenz-Klärung, Polish |

---

## Sprint 0 — Next.js Bootstrap + XML Parser

**Ziel:** Lokales Projekt das Rekordbox/Traktor XML einliest und Tracks anzeigt.

**Deliverables:**
- [ ] Next.js + TypeScript + ESLint + Vitest Scaffolding
- [ ] Zustand Store für Track-State
- [ ] Rekordbox XML Parser (`src/lib/adapters/rekordbox.ts`)
- [ ] Traktor NML Parser (`src/lib/adapters/traktor.ts`)
- [ ] Gemeinsames Track-Interface (`src/types/track.ts`)
- [ ] Adapter Pattern: einheitliche API für beide Formate
- [ ] Basis-Tests: XML Parsing mit Fixture-Dateien
- [ ] Dev Server läuft auf `localhost:3000`

**Kritische Dateien:**
```
src/
├── types/track.ts              # Track Data Model
├── lib/adapters/rekordbox.ts   # Rekordbox XML → Track[]
├── lib/adapters/traktor.ts     # Traktor NML → Track[]
├── lib/adapters/index.ts       # Adapter Interface + Factory
└── stores/track-store.ts       # Zustand Store
```

**Risiken:** Rekordbox URL-Encoding (`file://localhost/...`) korrekt dekodieren. Traktor Key-Mapping (0–23) muss gemappt werden.

**Definition of Done:** `npm run dev` zeigt importierte Tracks in einer Liste. Tests grün.

---

## Sprint 1 — UI Shell + Metadata Audit

**Ziel:** Vollständiger Import → Processing → Report Flow mit erstem Check (Metadata Audit, kein WASM nötig).

**Deliverables:**
- [ ] Landing Page mit "Analyze Your Library" CTA
- [ ] DJ-Software Auswahl (Rekordbox / Traktor)
- [ ] XML File Drop / File Picker
- [ ] File System Access Integration (`browser-fs-access`)
- [ ] Analyse-Konfiguration (Check-Auswahl via Checkboxen)
- [ ] Metadata Audit Feature (rein XML-basiert)
  - Artist, Title, Genre, Key, Year, Album prüfen
  - Completeness Score pro Track + Library-Statistik
- [ ] Basis Report-View: Track-Liste mit Severity (OK/Warning/Error)

**Kritische Dateien:**
```
src/
├── app/page.tsx                          # Landing Page
├── app/analyze/page.tsx                  # Import + Konfiguration
├── app/report/page.tsx                   # Report Dashboard
├── features/metadata/
│   ├── services/metadata-audit.ts        # Audit-Logik
│   ├── components/MetadataReport.tsx     # Report-Ansicht
│   └── index.ts
├── components/FileImport.tsx             # XML + Audio Import
├── components/AnalysisConfig.tsx         # Check-Auswahl
└── lib/audio/file-access.ts             # browser-fs-access Wrapper
```

**Risiken:** File System Access API nur Chromium – Fallback für Firefox/Safari testen. Path Matching (XML-Pfade ↔ lokale Files).

**Definition of Done:** User kann XML importieren, Metadata Audit laufen lassen, Ergebnisse im Report sehen. Komplett lokal, kein Backend.

---

## Sprint 2 — WASM Audio Decoder + Worker Pipeline

**Ziel:** Audio-Dateien lokal im Browser dekodieren, PCM-Daten stehen für Analyse bereit.

**Deliverables:**
- [ ] WASM Loader mit Lazy Loading (`src/wasm/loader.ts`)
- [ ] Web Worker Pool basierend auf `navigator.hardwareConcurrency`
- [ ] Audio Decoder Worker: wasm-audio-decoders (MP3/FLAC/Ogg)
- [ ] Fallback Decoder: ffmpeg.audio.wasm (AAC/M4A/WAV)
- [ ] COOP/COEP Headers in `next.config.js` (für SharedArrayBuffer)
- [ ] PCM Pipeline: Decode → Mono → Downsample → Buffer
- [ ] Processing Progress UI (Track-Fortschritt + Gesamt)
- [ ] Memory-Monitoring (WASM Heap Budget)

**Kritische Dateien:**
```
src/
├── wasm/loader.ts                    # Lazy WASM Module Loader
├── workers/decode-worker.ts          # Audio Decode Worker
├── workers/pipeline.ts               # Worker Pipeline Orchestrator
├── lib/audio/pcm-utils.ts           # Mono, Downsample, Buffer Utils
└── components/ProcessingProgress.tsx  # Progress UI
```

**Risiken:** SharedArrayBuffer braucht COOP/COEP – das kann Third-Party-Embeds brechen (lokal erstmal egal). Memory Budget bei großen Files (>10min Tracks). Worker-Kommunikation via Transferable Objects testen.

**Definition of Done:** Ein Audio-File wird im Browser dekodiert, PCM-Daten sind als Float32Array verfügbar. Progress wird angezeigt.

---

## Sprint 3 — Beatgrid Check + BPM Verification

**Ziel:** Aubio-basierte Beat/BPM-Analyse mit Vergleich gegen XML-Daten.

**Deliverables:**
- [ ] Aubio WASM Integration (aubiojs)
- [ ] Beat Detection Worker (`src/workers/beat-worker.ts`)
- [ ] Beatgrid Check: Detected Beats vs. Stored Grid
  - Toleranz: <10ms OK, 10–30ms Warning, >30ms Error
  - Confidence Score (0–100%)
- [ ] BPM Verification: Detected BPM vs. Stored BPM
  - Toleranz: ±0.05 OK, ±0.5 Warning, >0.5 Error
  - Half/Double-Tempo Guard
- [ ] Variable BPM Detection (>2% Varianz = Flag)
- [ ] Ergebnisse in Report integriert

**Kritische Dateien:**
```
src/
├── wasm/aubio.ts                         # Aubio WASM Bindings
├── workers/beat-worker.ts                # Beat/BPM Worker
├── features/beatgrid/
│   ├── services/beatgrid-check.ts        # Grid-Vergleich Logik
│   ├── components/BeatgridReport.tsx     # Report-Ansicht
│   └── index.ts
├── features/bpm/
│   ├── services/bpm-verification.ts      # BPM-Vergleich Logik
│   ├── components/BpmReport.tsx
│   └── index.ts
```

**Risiken:** Aubio Accuracy bei Live-Recordings/Vinyl-Rips. Half/Double-Tempo ist der häufigste False-Positive. Input muss Mono 22050Hz sein.

**Definition of Done:** Beatgrid + BPM Checks laufen durch, Ergebnisse korrekt im Report. Variable BPM Tracks werden geflaggt.

---

## Sprint 4 — Key Detection + Clipping Detection

**Ziel:** Key-Analyse (Essentia.js oder Alternative) und Clipping-Erkennung.

**Deliverables:**
- [ ] Key Detection Integration
  - Essentia.js WASM (HPCP, edmm Profil, pcpSize: 36)
  - ODER Alternative (Meyda / eigene Implementation)
- [ ] Key Worker (`src/workers/key-worker.ts`)
- [ ] Camelot / Open Key / Musical Notation Support
- [ ] Relative Key Detection (Am vs. C)
- [ ] Clipping Detection (Custom, ~10 KB)
  - Consecutive Samples bei ±1.0 = Clip
  - Severity: Clip-Count x Dauer
  - Peak Level in dBFS
- [ ] Clipping Worker (`src/workers/clip-worker.ts`)

**Kritische Dateien:**
```
src/
├── wasm/essentia.ts                      # Essentia WASM Bindings
├── workers/key-worker.ts                 # Key Detection Worker
├── workers/clip-worker.ts                # Clipping Detection Worker
├── features/key/
│   ├── services/key-detection.ts
│   ├── components/KeyReport.tsx
│   └── index.ts
├── features/clipping/
│   ├── services/clipping-detection.ts
│   ├── components/ClippingReport.tsx
│   └── index.ts
```

**Risiken:** Essentia.js ist 3–5 MB – Lazy Loading kritisch. AGPL-Lizenz (erstmal ignorieren für lokalen Prototyp, vor Launch klären). Clipping Detection ist simpel, aber True Peak braucht Inter-Sample Detection.

**Definition of Done:** Key + Clipping Checks laufen, Ergebnisse im Report. Alle 4 Audio-Checks (Beat, BPM, Key, Clipping) funktionieren parallel.

---

## Sprint 5 — Duplicate Detection

**Ziel:** Duplikate finden via Metadata-Matching + Audio Fingerprint.

**Deliverables:**
- [ ] Level 1: Metadata Match (Artist + Title Fuzzy + Duration)
- [ ] Blocking-Strategie: Metadata-Gruppen bilden, Fingerprint nur innerhalb
- [ ] Level 2: Chromaprint WASM Integration (@unimusic/chromaprint)
- [ ] Fingerprint Worker (`src/workers/fingerprint-worker.ts`)
- [ ] Match-Threshold: ~80% Similarity = Duplikat
- [ ] Duplikat-Gruppierung mit Quality-Empfehlung (höchste Bitrate behalten)
- [ ] Duplikat-Report mit Gruppen-Ansicht

**Kritische Dateien:**
```
src/
├── wasm/chromaprint.ts                       # Chromaprint WASM Bindings
├── workers/fingerprint-worker.ts             # Fingerprint Worker
├── features/duplicates/
│   ├── services/metadata-matcher.ts          # Fuzzy Matching
│   ├── services/fingerprint-matcher.ts       # Chromaprint Vergleich
│   ├── components/DuplicateReport.tsx        # Gruppen-Ansicht
│   └── index.ts
```

**Risiken:** O(N^2) Fingerprint-Vergleich bei großen Libraries – Blocking-Strategie ist essentiell. Chromaprint Input: Mono 16-bit 11025Hz (anderes Format als Aubio!).

**Definition of Done:** Duplikate werden erkannt (Metadata + Fingerprint), in Gruppen angezeigt, mit Empfehlung welches File behalten.

---

## Sprint 6 — Report Dashboard

**Ziel:** Professionelles Report Dashboard mit allen Check-Ergebnissen.

**Deliverables:**
- [ ] Library Health Score (Overall, gewichtet)
- [ ] Breakdown per Check-Kategorie (Donut/Bar Charts)
- [ ] Track-Liste: sortierbar nach Name, Severity, Check-Typ
- [ ] Filter: nach Severity (OK/Warning/Error), Check-Typ, Search
- [ ] Track Detail-View
  - Waveform Visualization (Canvas/WebGL)
  - Beatgrid Overlay (Detected vs. Stored)
  - Drift-Graph über Tracklänge
  - Alle Check-Ergebnisse pro Track
- [ ] Responsive Layout (Desktop-First, Mobile für Report-Ansicht)

**Kritische Dateien:**
```
src/
├── app/report/page.tsx                   # Report Dashboard
├── components/HealthScore.tsx            # Library Health Score
├── components/TrackTable.tsx             # Sortierbare Track-Liste
├── components/TrackDetail.tsx            # Detail-View
├── components/Waveform.tsx               # Waveform + Beatgrid Overlay
├── components/DriftGraph.tsx             # BPM Drift Visualization
└── components/FilterBar.tsx              # Filter + Search
```

**Risiken:** Waveform-Rendering Performance bei langen Tracks. Canvas vs. WebGL Entscheidung. Große Track-Listen brauchen Virtualisierung (react-window o.ä.).

**Definition of Done:** Dashboard zeigt alle Checks, filtert/sortiert, Track-Details mit Waveform. Fühlt sich wie ein fertiges Produkt an.

---

## Sprint 7 — XML Mutation Engine + Auto-Fix

**Ziel:** Erkannte Probleme automatisch fixen und als korrigierte XML exportieren.

**Deliverables:**
- [ ] XML Mutation Engine (`src/lib/xml/mutation-engine.ts`)
  - Nur geänderte Attribute mutieren, Original-Struktur beibehalten
  - Rekordbox XML Writer
  - Traktor NML Writer
- [ ] Fix Preview: Vorher/Nachher Vergleich pro Track
- [ ] "Fix All" Button (alle auto-fixable Issues)
- [ ] Einzeln pro Track Fixes an/abwählen
- [ ] Korrigierte XML Download (Blob + `<a download>`)
- [ ] Import-Anleitung (inkl. Rekordbox Import-Bug Workaround)
- [ ] Duplikat-Fix: User wählt "Keep" → Rest aus Export entfernt

**Kritische Dateien:**
```
src/
├── lib/xml/mutation-engine.ts    # Core Mutation Engine
├── lib/adapters/rekordbox.ts     # + Writer-Methoden
├── lib/adapters/traktor.ts       # + Writer-Methoden
├── components/FixPreview.tsx     # Vorher/Nachher
├── components/ExportPanel.tsx    # Export + Anleitung
└── app/export/page.tsx           # Export Page
```

**Risiken:** XML-Mutation darf bestehende Daten nicht korrumpieren – ausgiebig testen. Rekordbox Import-Bug beachten. Star-Ratings/Play-Counts transferieren nicht via XML.

**Definition of Done:** User kann Fixes reviewen, an/abwählen, exportierte XML in Rekordbox/Traktor importieren. Roundtrip getestet.

---

## Sprint 8 — Auth + Stripe + Free Tier

**Ziel:** Monetarisierung – Accounts, Payments, Tier-Limits.

**Deliverables:**
- [ ] Auth Integration (Supabase Auth oder Clerk)
- [ ] Supabase Postgres: Users, Subscriptions, Analysis History
- [ ] Stripe Integration
  - Pro Monthly: $8/mo
  - Pro Yearly: $69/year
  - Pro Lifetime: $149 einmalig
- [ ] Free Tier Limits: 50 Tracks, kein Export/Auto-Fix
- [ ] Contextual Upsell ("Upgrade für deine komplette Library")
- [ ] Analyse-History für Pro Users (letzte 10 Analysen)

**Kritische Dateien:**
```
src/
├── app/api/stripe/              # Stripe Webhooks
├── lib/supabase/client.ts       # Supabase Client
├── lib/supabase/schema.sql      # DB Schema
├── features/auth/
│   ├── components/AuthModal.tsx
│   └── hooks/useAuth.ts
├── features/subscription/
│   ├── components/PricingTable.tsx
│   ├── components/UpsellBanner.tsx
│   └── hooks/useSubscription.ts
```

**Risiken:** Stripe Webhook-Handling korrekt (Race Conditions). Free Tier Enforcement client-seitig = umgehbar (akzeptabel für MVP, Server-Check als Enhancement).

**Definition of Done:** User kann Account erstellen, Pro kaufen, Free Tier wird enforced, History wird gespeichert.

---

## Sprint 9 — Deployment, Lizenz, Launch

**Ziel:** Production-Ready – Deployment, Lizenz-Klärung, Polish.

**Deliverables:**
- [ ] Git Repo Setup + GitHub
- [ ] Vercel Deployment + COOP/COEP Headers in `vercel.json`
- [ ] Essentia.js Commercial License anfragen (MTG/UPF)
- [ ] Aubio Commercial License anfragen
- [ ] Lizenz-Entscheidung dokumentieren
- [ ] SEO: Meta Tags, OG Images, Sitemap
- [ ] Performance-Optimierung (Bundle Size, WASM Loading)
- [ ] Error Monitoring (Sentry o.ä.)
- [ ] Bug-Fixes aus allen vorherigen Sprints
- [ ] Launch-Checklist abarbeiten

**Risiken:** Lizenz-Verhandlungen können dauern – parallel starten. COOP/COEP kann Third-Party-Embeds (Analytics, Chat-Widgets) brechen.

**Definition of Done:** App live auf eigener Domain, alle Checks funktionieren, Payments laufen, Lizenzen geklärt oder Alternative implementiert.

---

## Post-MVP Roadmap

### Phase A — Weitere DJ-Software (nach Launch + 4 Wochen)
- Serato DJ Pro Support (Crate Files + SQLite DB)
- Engine DJ Support (Denon Ecosystem)

### Phase B — Advanced Analysis
- Loudness Normalization Check (LUFS)
- Silence / Intro-Outro Detection
- Harmonic Mixing Suggestions (Key-Kompatibilität in Playlists)
- Batch Re-Analysis (nur geänderte Tracks)

### Phase C — Platform Expansion
- Desktop Companion App (Tauri) für nativen File Access
- Community Features: Anonymisierte Library-Stats, Benchmarks
- Team/Label Tier: Shared Libraries, Team-Reports
- API Access für Entwickler

---

## Risiken & Blocker

| Risiko | Impact | Sprint | Mitigation |
|--------|--------|--------|------------|
| WASM Memory (4 Module = 64–256 MB) | High | S2–S5 | Sequentiell laden/entladen, Memory-Monitoring |
| Essentia.js AGPL Lizenz | Critical | S9 | Lokal erstmal nutzen, vor Launch Commercial License oder Alternative |
| Aubio GPL Lizenz | High | S9 | Lokal erstmal nutzen, vor Launch klären |
| File System Access nur Chromium | Medium | S1 | browser-fs-access Ponyfill, Fallback testen |
| O(N^2) Fingerprint-Vergleich | Medium | S5 | Metadata-Blocking, bei Bedarf LSH |
| Beatgrid Accuracy (Variable BPM) | Medium | S3 | Varianz-Detection, kein Auto-Fix bei >2% |
| COOP/COEP bricht Embeds | Low | S2 | Lokal egal, vor Deployment alle Assets prüfen |
| XML Mutation korrumpiert Daten | High | S7 | Roundtrip-Tests, Original-Backup empfehlen |

---

## Erfolgsmetriken

| Metrik | Target (3 Monate nach Launch) |
|--------|-------------------------------|
| Registered Users | 1.000 |
| Free → Pro Conversion | 5–8% |
| Tracks Analyzed (total) | 500.000 |
| Avg Tracks per Session | 200+ |
| NPS | >50 |
| Churn Rate (Pro) | <8% monatlich |
