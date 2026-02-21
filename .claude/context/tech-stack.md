# Tech Stack

Quick-Reference für Architektur-Entscheidungen.

---

## System-Architektur

```
Browser (Client)
├── Frontend: Next.js (TypeScript) on Vercel
├── Audio Processing: WASM Modules in Web Workers
│   ├── Audio Decoder (FFmpeg WASM / Web Audio API)
│   ├── Beat Detection (Aubio WASM)
│   ├── Key Detection (Essentia.js WASM)
│   ├── Fingerprinting (Chromaprint WASM)
│   └── Clipping Analysis (Custom, lightweight)
├── XML Parser: Browser-native DOMParser
│   ├── Rekordbox XML Adapter
│   └── Traktor NML Adapter
└── State Management: Zustand / Jotai

Backend (Minimal - kein Audio-Processing)
├── Auth: Supabase Auth
├── Database: Supabase (Postgres)
│   ├── User Accounts
│   ├── Analysis History (nur Metadata, kein Audio)
│   ├── Subscription Status
│   └── Saved Reports
├── Payments: Stripe
└── Hosting: Vercel (Frontend) + Supabase (Backend)
```

### Processing Pipeline

```
Audio File (lokal)
    │
    ▼
┌──────────────┐    ┌─────────────────┐
│ WASM Decoder │───▶│ PCM Float32     │
│ (Web Worker) │    │ Buffer          │
└──────────────┘    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Beat     │  │ Key      │  │ Clipping │
        │ Detector │  │ Detector │  │ Detector │
        │ (Worker) │  │ (Worker) │  │ (Worker) │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │              │              │
             ▼              ▼              ▼
        ┌─────────────────────────────────────┐
        │        Results Aggregator            │
        │   (Main Thread / SharedArrayBuffer)  │
        └──────────────────┬──────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Report + Fixes  │
                  │  (XML Mutation)  │
                  └──────────────────┘
```

---

## Frontend Stack

| Komponente | Technologie |
|------------|-------------|
| **Framework** | Next.js (App Router) + TypeScript |
| **State** | Zustand / Jotai |
| **Routing** | Next.js App Router |
| **Styling** | Tailwind CSS |
| **Validation** | Zod |

---

## Backend Stack

| Komponente | Technologie |
|------------|-------------|
| **Auth** | Supabase Auth |
| **Database** | Supabase (Postgres) |
| **Payments** | Stripe |
| **Hosting** | Vercel (Frontend) + Supabase (Backend) |

---

## WASM Module

| Modul | Basis-Library | Größe (gzip) | Funktion |
|-------|---------------|--------------|----------|
| Audio Decoder | FFmpeg (stripped) | ~2-4 MB | MP3/FLAC/WAV/AAC → PCM |
| Beat Detection | Aubio | ~200 KB | Onset + Beat Tracking |
| Key Detection | Essentia.js | ~1.5 MB | Chromagram → Key |
| Fingerprint | Chromaprint | ~300 KB | Audio Fingerprinting |
| Clipping | Custom | ~10 KB | Peak/Clip Analysis |

**Lazy Loading:** Module werden erst geladen wenn der jeweilige Check aktiviert ist.

---

## XML Schema Handling

### Rekordbox XML

```xml
<DJ_PLAYLISTS>
  <COLLECTION>
    <TRACK TrackID="123" Name="..." Artist="..."
           Tonality="Am" AverageBpm="126.00" ...>
      <TEMPO Inizio="0.123" Bpm="126.00" Metro="4/4" Battito="1"/>
    </TRACK>
  </COLLECTION>
</DJ_PLAYLISTS>
```

### Traktor NML

```xml
<NML>
  <COLLECTION>
    <ENTRY TITLE="..." ARTIST="...">
      <MUSICAL_KEY VALUE="0"/>  <!-- 0-23 Mapping -->
      <TEMPO BPM="126.000000" BPM_QUALITY="100"/>
      <CUE_V2 NAME="Grid" TYPE="4" START="123.456"/>
    </ENTRY>
  </COLLECTION>
</NML>
```

**Strategie:** Adapter Pattern - ein Track-Interface, je ein Adapter für Rekordbox XML und Traktor NML.

---

## Architektur-Prinzipien

| Prinzip | Regel |
|---------|-------|
| **Client-Side Processing** | Audio verlässt nie den Rechner - alle Analyse via WASM in Web Workers |
| **Adapter Pattern** | Ein Track-Interface, je ein Adapter für Rekordbox XML und Traktor NML |
| **WASM Worker Pipeline** | Decode → parallel (Beat + Key + Clipping) → Results Aggregator |
| **Privacy-First** | Kein Audio-Upload, Backend nur für Auth/Subscriptions/History |
| **Lazy Loading** | WASM-Module erst laden wenn jeweiliger Check aktiviert |
