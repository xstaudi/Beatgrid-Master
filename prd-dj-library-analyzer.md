# PRD: DJ Library Analyzer

> **Status:** Draft v1.1 (Research-Validated)
> **Datum:** 21. Februar 2026
> **Author:** Martin

---

## 1. Vision & Problem Statement

### Problem
DJs verbringen Stunden damit, ihre Libraries manuell auf Fehler zu prüfen – falsche Beatgrids, inkorrekte BPM-Werte, fehlende Metadata, Clipping. Bestehende Tools wie Mixed In Key sind Desktop-only, teuer (einmalig ~$60) und lösen nur einen Teil des Problems (primär Key Detection). Es gibt kein Tool, das eine **vollständige Library-Diagnose** bietet und Probleme auch direkt fixt.

### Vision
Ein browser-basiertes SaaS-Tool, das DJ-Libraries analysiert, Probleme identifiziert und automatisch korrigierte Export-Dateien generiert. Processing passiert vollständig client-seitig – kein Upload, keine Privacy-Bedenken, keine Server-Kosten für Audio-Processing.

### Unique Selling Points
- **Privacy-First:** Audio-Files verlassen nie den Rechner (Client-Side WASM Processing)
- **All-in-One:** Beatgrid, BPM, Key, Clipping, Duplicates, Metadata – ein Tool statt fünf
- **Auto-Fix:** Nicht nur Diagnose, sondern direkte Korrektur via XML-Export
- **Cross-Platform:** Rekordbox + Traktor ab MVP, kein Desktop-Download nötig
- **SaaS-Preisvorteil:** ~$5-10/Monat vs. $60 einmalig für Mixed In Key (das weniger kann)

---

## 2. Target Audience

### Primär: Semi-Pro & Pro DJs
- Spielen regelmäßig Gigs (Club, Festival, Private Events)
- Library von 500–50.000+ Tracks
- Nutzen Rekordbox oder Traktor als primäre DJ-Software
- Pain Point: Vor Gigs unsicher ob Beatgrids/Keys stimmen
- Zahlungsbereit für Tools die Zeit sparen

### Sekundär: Bedroom DJs & Einsteiger
- Bauen gerade ihre Library auf
- Wollen von Anfang an saubere Metadata
- Preissensitiver, aber guter Freemium-Funnel

---

## 3. Competitive Landscape

### 3.1 Feature-Matrix

| Feature | Mixed In Key | Lexicon DJ | MIXO | Djoid | Rekordbox | Traktor | **Unser Tool** |
|---|---|---|---|---|---|---|---|
| Key Detection | ✅ (Core) | ❌ | ❌ | ❌ | ✅ (Basic) | ✅ (Basic) | ✅ |
| BPM Analysis | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Beatgrid Check | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Clipping Detection | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Duplicate Detection | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Metadata Audit | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Auto-Fix Export | ❌ | ❌ | ❌ | ❌ | — | — | ✅ |
| Library Sync | ❌ | ✅ (Core) | ✅ (Core) | ❌ | — | — | ❌ |
| AI Curation | ❌ | ❌ | ❌ | ✅ (Core) | ❌ | ❌ | ❌ |
| Browser-basiert | ❌ | ❌ | ✅ (Cloud) | ❌ | ❌ | ❌ | ✅ |
| Privacy (kein Upload) | — (Desktop) | — | ❌ (Cloud) | ❌ | — | — | ✅ |
| Preis | $58 einmalig | Free + Abo | $7/mo | €29/mo | Inkl. | Inkl. | Freemium |
| Multi-Software | ✅ | ✅ (6 Apps) | ✅ (5 Apps) | ✅ | Nur RB | Nur Traktor | ✅ |

### 3.2 Competitor-Profil

**Mixed In Key ($58 einmalig, $99 Pro):** Marktführer Key Detection. Keine Beatgrid-Analyse, kein Clipping, keine Duplikate, kein Auto-Fix. Desktop-only. Student-Discount ~30%, Sale-Preise bis $34.

**Lexicon DJ (Free + Paid Tiers, Lifetime-Option):** Stärkster Competitor für Library Management. Bulk-Editing, Duplicate Removal, Sync zwischen 6 DJ-Apps (RB 5/6/7, Serato, Traktor 3/4, VirtualDJ, Engine DJ). Direkte DB-Writes. Aber: keine Audio-Analyse (kein Beatgrid Check, kein BPM Verify, kein Key, kein Clipping).

**MIXO ($7/mo):** Cloud-basierte Library-Organisation. Cross-Platform (inkl. iOS/Android). Import/Export zwischen DJ-Apps. Keine Audio-Analyse.

**Djoid (€29/mo, Berlin-based):** AI-basierte Curation, Energy-Block-Planning, Graph-Playlists. Gewann GEMA-Preis Mai 2025. Fokus auf Set-Vorbereitung, nicht Library-Health.

### 3.3 White Space

**Kein Tool kombiniert:** Library-Audio-Analyse + Auto-Fix + Browser-basiert + Privacy-First.
- Mixed In Key analysiert nur Keys
- Lexicon managed, analysiert aber kein Audio
- MIXO synct, analysiert nichts
- Djoid kuratiert, prüft keine Qualität

**Markt-Insight:** DJ-Markt bevorzugt One-Time-Purchase (MIK $58, Lexicon Lifetime). Subscription + Lifetime-Option anbieten.

---

## 4. MVP Feature Scope

### 4.1 Beatgrid Check ⭐ Core
**Was:** Verifiziert ob das Beatgrid korrekt auf den Downbeat aligned ist und ob der Grid-Drift über den Track hinweg akzeptabel bleibt.

**Wie (technisch):**
- Audio dekodieren via wasm-audio-decoders (MP3/FLAC/Ogg) oder ffmpeg.audio.wasm (AAC/M4A)
- Onset Detection via **Aubio WASM** (`aubiojs`) – kausal, streambar, etablierter Standard
- Input: Mono PCM, downsampled auf 22050 Hz
- Detected Beats vs. Beatgrid aus XML vergleichen
- Toleranz: <10ms Offset = OK, 10-30ms = Warning, >30ms = Error
- Half/Double-Tempo Validation: BPM-Ergebnis gegen erwarteten Range (60-200 BPM) prüfen

**Auto-Fix:** Korrigiertes Beatgrid in die Export-XML schreiben (erster Downbeat-Position + BPM).

**Output:**
- Confidence Score pro Track (0-100%)
- Visualisierung: Waveform mit Beatgrid-Overlay (detected vs. stored)
- Drift-Graph über Tracklänge

**Bekannte Limitierungen:**
- Accuracy degradiert bei Live-Recordings, Vinyl-Rips, Tempo-Changes
- Variable BPM Tracks automatisch flaggen (BPM-Varianz >2% = "Variable BPM")

---

### 4.2 BPM Verification
**Was:** Vergleicht den in der DJ-Software gespeicherten BPM-Wert mit einer unabhängigen Analyse.

**Wie (technisch):**
- BPM-Detection via **Aubio WASM** `tempo` Object (Autocorrelation + Onset-basiert)
- Vergleich: Stored BPM vs. Detected BPM
- Toleranz: ±0.05 BPM = OK, ±0.05–0.5 = Warning, >0.5 = Error
- Half/Double-Tempo Guard: Wenn Detected BPM ≈ 2× oder 0.5× Stored → Warning statt Error
- **Variable BPM Detection:** BPM-Varianz über Track-Segmente berechnen; >2% Varianz = "Variable BPM" Flag
- Edge Cases: Live-Recordings, Vinyl-Rips, Transitions in DJ-Mixes

**Auto-Fix:** Korrigierter BPM-Wert in Export-XML. Kein Auto-Fix bei Variable-BPM Tracks.

---

### 4.3 Key Detection
**Was:** Unabhängige Tonart-Erkennung und Vergleich mit gespeichertem Key.

**Wie (technisch):**
- HPCP-basierte Key Detection via **Essentia.js WASM** (oder lizenzfreie Alternative, siehe Lizenz-Sektion)
- Key-Profil: **`edmm`** (optimiert für Electronic Dance Music)
- `pcpSize: 36` für höhere harmonische Auflösung (statt Default 12)
- Full-Track-Analyse nötig (kein Snippet-Sampling – zu ungenau)
- Vergleich mit Stored Key aus XML
- Camelot/Open Key Notation Support
- Relative Key Detection (z.B. Am vs. C – harmonisch kompatibel, aber technisch unterschiedlich)

**Auto-Fix:** Korrekter Key-Wert in Export-XML. User kann wählen: Camelot, Open Key oder Musical Notation.

> **⚠️ Lizenz-Risiko:** Essentia.js ist **AGPL-3.0** lizenziert. WASM-Distribution an Browser gilt als Code-Distribution und triggert AGPL-Pflichten (Open-Source des gesamten Client-Codes). **Vor MVP-Start: Commercial License bei MTG/UPF anfragen oder Alternative evaluieren** (siehe Sektion 9.2).

---

### 4.4 Clipping Detection
**Was:** Erkennt digitales Clipping (Samples die an 0dBFS abgeschnitten werden).

**Wie (technisch):**
- PCM-Daten analysieren: Consecutive Samples bei ±1.0 (Float) oder ±32767 (16-bit)
- Threshold: >3 aufeinanderfolgende Samples bei Max = Clip
- Severity: Anzahl Clips × Dauer pro Clip
- True Peak Detection für inter-sample Clipping

**Auto-Fix:** Kein direkter Fix möglich (Clipping ist destruktiv). Stattdessen: Empfehlung für Gain-Reduction + Flagging im Report.

**Output:**
- Clip-Count und Positionen (Timecodes)
- Severity Rating (Minor/Moderate/Severe)
- Peak Level in dBFS

---

### 4.5 Duplicate Detection
**Was:** Findet doppelte Tracks in der Library – gleicher Track, verschiedene Files.

**Wie (technisch):**
- **Level 1 – Metadata Match:** Artist + Title Fuzzy Matching (Levenshtein Distance) + Duration-Vergleich
- **Level 2 – Audio Fingerprint:** **Chromaprint WASM** (`@unimusic/chromaprint`, LGPL-2.1) für Audio-basierte Erkennung
- Input für Fingerprint: Mono PCM, 16-bit, 11025 Hz (Chromaprint-Standard)
- Match-Threshold: ~80% Fingerprint-Similarity = Duplikat
- Erkennt: exakte Duplikate, verschiedene Encodings (MP3 vs. FLAC), verschiedene Edits/Remixes
- Gruppierung: Cluster von Duplikaten mit Empfehlung welches File zu behalten (höchste Qualität)

**Performance-Optimierung (wichtig bei großen Libraries):**
- Pairwise Fingerprint-Vergleich ist O(N²) – bei 10.000+ Tracks problematisch
- **Blocking-Strategie:** Erst Metadata-Grouping (Artist + Duration ±5s), dann Fingerprint nur innerhalb der Gruppen
- Alternativ: Locality-Sensitive Hashing (LSH) für Sub-Linear Fingerprint-Lookup

**Auto-Fix:** User wählt "Keep" pro Gruppe → Duplikate werden aus Export-XML entfernt.

---

### 4.6 Missing Metadata
**Was:** Audit der Metadata-Vollständigkeit pro Track.

**Checks:**
- Artist (leer oder "Unknown Artist")
- Title (leer oder Filename als Title)
- Genre
- Album/Label
- Year
- Artwork (embedded Cover Art vorhanden?)
- Key (leer)
- Comment/Energy Level

**Output:** Completeness Score pro Track + Library-weite Statistik.

**Auto-Fix:** Kein Auto-Fix für fehlende Metadata (woher nehmen?). Stattdessen: Export-Liste der Tracks mit fehlenden Feldern + Bulk-Edit Suggestion.

---

## 5. User Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. LANDING PAGE                                         │
│     → CTA: "Analyze Your Library"                        │
│     → Kein Account nötig für Free Tier                   │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. IMPORT                                               │
│     → DJ-Software wählen (Rekordbox / Traktor)           │
│     → XML-File droppen ODER File Picker                  │
│     → Anleitung: "So exportierst du deine Library"       │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. AUDIO ACCESS                                         │
│     → File System Access API (Chromium)                  │
│     → Fallback: Manueller Ordner-Upload                  │
│     → Matching: XML-Pfade ↔ lokale Files                 │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. ANALYSE-KONFIGURATION                                │
│     → Checkboxen: Welche Checks aktivieren?              │
│       ☑ Beatgrid Check                                   │
│       ☑ BPM Verification                                 │
│       ☑ Key Detection                                    │
│       ☑ Clipping Detection                               │
│       ☑ Duplicate Detection                              │
│       ☑ Missing Metadata                                 │
│     → Free Tier: Max 25 Tracks (upsell Banner)           │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. PROCESSING                                           │
│     → Progress Bar pro Track + Gesamt                    │
│     → Live-Ergebnisse: Tracks erscheinen sobald fertig   │
│     → Estimated Time Remaining                           │
│     → "Analyzing Track 47/1.203 – BPM Check..."          │
│     → Tab kann im Hintergrund bleiben (Web Worker)       │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. REPORT DASHBOARD                                     │
│     → Library Health Score (Overall)                     │
│     → Breakdown per Check-Kategorie                      │
│     → Track-Liste: sortierbar, filterbar                 │
│     → Severity: 🟢 OK  🟡 Warning  🔴 Error              │
│     → Detail-View pro Track (Waveform, Beatgrid etc.)    │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  7. AUTO-FIX & EXPORT                                    │
│     → "Fix All" Button (alle auto-fixable Issues)        │
│     → Oder: Einzeln pro Track Fixes an/abwählen          │
│     → Preview: Vorher/Nachher Vergleich                  │
│     → Export: Korrigierte XML downloaden                  │
│     → Anleitung: "So importierst du zurück"              │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Technical Architecture

### 6.1 High-Level Stack

```
Browser (Client)
├── Frontend: Next.js (TypeScript) on Vercel
├── Audio Decoding: 2-Tier Strategie (Web Workers)
│   ├── Primär: wasm-audio-decoders (MP3/FLAC/Ogg – klein, kein SAB nötig)
│   └── Fallback: ffmpeg.audio.wasm (AAC/M4A/WAV – braucht SharedArrayBuffer)
├── Audio Analysis: WASM Modules (Web Workers)
│   ├── Beat/BPM Detection (Aubio WASM via aubiojs) [GPL – Lizenz klären]
│   ├── Key Detection (Essentia.js WASM) [AGPL – Lizenz klären!]
│   ├── Fingerprinting (Chromaprint WASM via @unimusic/chromaprint) [LGPL ✅]
│   └── Clipping Analysis (Custom, ~10 KB) [Eigener Code ✅]
├── XML Parser: Browser-native DOMParser
│   ├── Rekordbox XML Schema (v6 + v7 kompatibel)
│   └── Traktor NML Schema
├── File Access: browser-fs-access (Ponyfill mit Auto-Fallback)
└── State Management: Zustand

Backend (Minimal)
├── Auth: Clerk / Supabase Auth
├── User Data: Supabase (Postgres)
│   ├── User accounts
│   ├── Analysis history (metadata only, no audio)
│   ├── Subscription status
│   └── Saved reports
├── Payments: Stripe
└── Hosting: Vercel (Frontend) + Supabase (Backend)
```

**Vercel Config (COOP/COEP Headers):** Für SharedArrayBuffer (ffmpeg.wasm) müssen in `vercel.json` folgende Headers gesetzt werden:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```
**Achtung:** COEP blockiert Cross-Origin Embeds ohne CORS. Alle externen Ressourcen müssen CORS-Headers haben.

### 6.2 Client-Side Processing Pipeline

```
Audio File (local)
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

### 6.3 WASM Module Strategy

| Module | Basis-Library | Größe (gzip) | Lizenz | Funktion |
|---|---|---|---|---|
| Audio Decoder (Primär) | wasm-audio-decoders | ~50-200 KB/Codec | BSD-like ✅ | MP3/FLAC/Ogg → PCM (inline WASM, kein SAB) |
| Audio Decoder (Fallback) | ffmpeg.audio.wasm | ~3 MB | LGPL ✅ | AAC/M4A/WAV → PCM (braucht SAB + COOP/COEP) |
| Beat Detection | Aubio (aubiojs) | ~200 KB | **GPL** ⚠️ | Onset + Beat Tracking + BPM |
| Key Detection | Essentia.js | ~3-5 MB | **AGPL** 🔴 | HPCP → Key (edmm Profil) |
| Fingerprint | Chromaprint (@unimusic) | ~300 KB | LGPL ✅ | Audio Fingerprinting (Duplikate) |
| Clipping | Custom | ~10 KB | Eigener Code ✅ | Peak/Clip Analysis |

**Lazy Loading:** Module werden erst geladen wenn der jeweilige Check aktiviert ist. Total initial Bundle: nur Frontend + XML Parser.

**Memory Budget:** Jedes WASM-Modul reserviert 16-64 MB Heap. Bei 4 Modulen parallel = 64-256 MB. Module sequenziell laden und nach Nutzung entladen. Memory-Monitoring via `performance.memory`.

**Worker Pool:** Feste Größe basierend auf `navigator.hardwareConcurrency`. PCM-Daten als `Transferable` (zero-copy via `postMessage` mit Transfer-Liste), nicht serialisieren.

### 6.4 XML Schema Handling

**Rekordbox XML:**
```xml
<DJ_PLAYLISTS>
  <COLLECTION>
    <TRACK TrackID="123" Name="..." Artist="..." 
           Tonality="Am" AverageBpm="126.00" ...>
      <TEMPO Inizio="0.123" Bpm="126.00" Metro="4/4" Battito="1"/>
      <!-- Beatgrid: Inizio = first downbeat position in seconds -->
    </TRACK>
  </COLLECTION>
</DJ_PLAYLISTS>
```

**Traktor NML:**
```xml
<NML>
  <COLLECTION>
    <ENTRY TITLE="..." ARTIST="...">
      <MUSICAL_KEY VALUE="0"/>  <!-- 0-23 mapping -->
      <TEMPO BPM="126.000000" BPM_QUALITY="100"/>
      <CUE_V2 NAME="Grid" TYPE="4" START="123.456"/>
    </ENTRY>
  </COLLECTION>
</NML>
```

**Strategie:** Adapter Pattern – ein Interface für Track-Daten, je ein Adapter für Rekordbox XML und Traktor NML der parst und zurückschreibt.

**Rekordbox XML Erkenntnisse (Research-validiert):**
- XML-Format stabil zwischen Rekordbox 6 und 7 – kein Breaking Change im Schema
- `Location` nutzt URL-Encoded `file://localhost/` Pfade – korrekt dekodieren
- Offizielles Schema-PDF: [rekordbox.com/en/support/developer/](https://rekordbox.com/en/support/developer/)
- **Import-Bug (v5/v6/v7):** Bestehende Tracks updaten nicht wenn nur Playlists importiert werden. Workaround: Tracks einzeln importieren. In unserer Import-Anleitung dokumentieren.
- Star-Ratings und Play-Counts übertragen nicht via XML Import
- Referenz-Implementation: [pyrekordbox](https://github.com/dylanljones/pyrekordbox) (Python) für undokumentierte Attribute

**Parsing-Strategie:**
- `DOMParser` für Standard-Libraries (<50.000 Tracks)
- Bei Bedarf: Streaming XML Parser (sax-js) für sehr große Collections um Memory Spikes zu vermeiden
- **Beim Zurückschreiben:** Nur geänderte Attribute mutieren, Original-Struktur beibehalten (kein Full Re-Serialize)

### 6.5 File System Access

**Browser-Kompatibilität (Stand Feb 2026):**

| Browser | File System Access API | `<input webkitdirectory>` | Status |
|---|---|---|---|
| Chrome/Edge (Chromium) | ✅ Voll (seit v86) | ✅ | Primäre Zielgruppe |
| Safari | ⚠️ Nur OPFS, kein `showDirectoryPicker` | ✅ (seit 11.1) | Fallback-Modus |
| Firefox | ❌ Nicht supported, keine Pläne | ✅ (seit v50) | Fallback-Modus |

**Empfohlen:** [`browser-fs-access`](https://github.com/nickvdp/browser-fs-access) als Ponyfill – erkennt automatisch die beste verfügbare API und fällt auf `<input>` zurück.

```typescript
// Primary: File System Access API (Chrome/Edge)
const dirHandle = await window.showDirectoryPicker();
// Rekursiv durch Music-Ordner, Match mit XML-Pfaden

// Fallback: <input type="file" webkitdirectory>
// Für Firefox/Safari – weniger elegant, aber funktional
// Feature-Detect: if ('showDirectoryPicker' in window)

// Export (Fallback): Blob + <a download> für korrigierte XML
```

**Path Matching Challenge:** Rekordbox speichert absolute Pfade (`file://localhost/Users/.../track.mp3`) mit URL-Encoding. User's lokaler Pfad kann anders sein. → Matching-Strategie:
1. Exakter Pfad-Match (nach URL-Decode)
2. Fallback: Filename + Dateigröße
3. Letzter Fallback: Nur Filename (mit Warnung bei Mehrdeutigkeit)

---

## 7. Pricing Model

> **Research-Insight:** Freemium-to-Paid Conversion liegt bei 2-5% (Durchschnitt), Top-Quartile bei 8-15%. Kritisches Fenster: Conversion passiert primär in den ersten 30 Tagen. Time-to-Value ist entscheidend – User müssen den Report sofort nach dem ersten Scan sehen. DJ-Markt bevorzugt Lifetime-Purchases.

### Free Tier
- **50 Tracks** pro Analyse (statt 25 – besserer Time-to-Value, höhere Conversion laut Benchmarks)
- Alle Check-Typen verfügbar
- Report-Ansicht im Browser (volle Sichtbarkeit als Conversion-Treiber)
- Kein Export / kein Auto-Fix
- Kein Account nötig
- **Contextual Upsell:** "Du hast 50/50 Free-Tracks analysiert. Upgrade für deine komplette Library (2.847 Tracks)"

### Pro – $8/Monat (oder $69/Jahr)
- **Unlimited Tracks**
- Auto-Fix + XML Export
- Analyse-History (letzte 10 Analysen gespeichert)
- Priority Processing (Web Workers mit höherer Prio)
- Detaillierte Waveform-Visualisierungen

### Pro Lifetime – $149 einmalig
- Alle Pro-Features, keine laufenden Kosten
- Positionierung: ~2.5× MIK-Preis, aber deutlich mehr Features
- Adressiert DJ-Markt-Präferenz für One-Time-Purchase

### Mögliche Future Tiers
- **Team/Label:** Shared Libraries, Team-Reports
- **API Access:** Für Entwickler die eigene Tools bauen

---

## 8. MVP Milestones

### Phase 0: Lizenz-Klärung & Projekt-Bootstrap (Woche 0–1) 🔴 Blocker
- [ ] **Essentia.js Commercial License anfragen** (MTG/UPF kontaktieren)
- [ ] **Aubio Commercial License anfragen** (oder GPL-Isolation evaluieren)
- [ ] Lizenz-Entscheidung dokumentieren → beeinflusst Tech-Stack
- [ ] Git Repo initialisieren + GitHub Setup
- [ ] Next.js + TypeScript + ESLint + Vitest Scaffolding
- [ ] Vercel Deployment + COOP/COEP Headers
- [ ] Dependencies installieren (Zustand, browser-fs-access, etc.)

### Phase 1: Foundation (Woche 2–4)
- [ ] Landing Page + Brand Identity
- [ ] Rekordbox XML Parser + Track Data Model
- [ ] Traktor NML Parser + Adapter
- [ ] File System Access Integration (browser-fs-access Ponyfill)
- [ ] Basic UI Shell (Import → Processing → Report)
- [ ] **Metadata Audit** (kein WASM nötig, rein XML-basiert – schneller erster Mehrwert)

### Phase 2: Core Analysis (Woche 5–8)
- [ ] WASM Audio Decoder Integration (wasm-audio-decoders primär, ffmpeg.audio.wasm Fallback)
- [ ] Web Worker Pool Setup (navigator.hardwareConcurrency)
- [ ] Beatgrid Check Implementation (Aubio WASM)
- [ ] BPM Verification Implementation (Aubio WASM)
- [ ] Key Detection Integration (abhängig von Phase 0 Lizenz-Entscheidung)
- [ ] Processing Progress UI

### Phase 3: Extended Analysis (Woche 9–10)
- [ ] Clipping Detection (Custom, leichtgewichtig)
- [ ] Duplicate Detection (Metadata-Blocking + Chromaprint Fingerprint)
- [ ] Report Dashboard mit Filtering/Sorting
- [ ] Track Detail-View (Waveform, Beatgrid Overlay)

### Phase 4: Auto-Fix & Export (Woche 11–12)
- [ ] XML Mutation Engine (Rekordbox) – nur geänderte Attribute mutieren
- [ ] XML Mutation Engine (Traktor NML)
- [ ] Fix Preview (Vorher/Nachher)
- [ ] Korrigierte XML Export + Import-Anleitung (inkl. Rekordbox Import-Bug Workaround)

### Phase 5: Monetarisierung & Launch (Woche 13–15)
- [ ] Auth (Clerk/Supabase)
- [ ] Stripe Integration (inkl. Lifetime-Option)
- [ ] Free Tier Limits (50 Tracks + Contextual Upsell)
- [ ] Analyse-History für Pro Users
- [ ] SEO + Launch Marketing

---

## 9. Key Risks & Mitigations

### 9.1 Technische Risiken

| Risiko | Impact | Mitigation |
|---|---|---|
| WASM-Performance auf schwachen Geräten | High – Analyse dauert zu lang → User bricht ab | Worker Pool Größe an Hardware anpassen, schnelle Checks zuerst (Metadata, Clipping), Estimated Time vor Start |
| Memory Budget (4 WASM-Module = 64-256 MB) | High – Browser-Tab crasht | Module sequenziell laden/entladen, Memory-Monitoring, Warnung bei niedrigem RAM |
| File System Access API nur Chromium (~70% Markt) | Medium – 30% User im Fallback-Modus | browser-fs-access Ponyfill, webkitdirectory Fallback, "Chrome empfohlen" Banner |
| COOP/COEP Headers blockieren Cross-Origin Embeds | Medium – Externe Ressourcen ohne CORS brechen | Alle Assets self-hosted oder mit CORS, Vercel Headers konfigurieren |
| Beatgrid-Accuracy bei Variable-BPM Tracks | Medium – Falsches Vertrauen in Auto-Fix | BPM-Varianz-Detection, kein Auto-Fix bei >2% Varianz, Confidence Scores |
| Half/Double-Tempo Detection | Medium – BPM als 64 statt 128 erkannt | Range-Validation (60-200 BPM für EDM), Vergleich mit Stored BPM |
| Rekordbox Import-Bug (Tracks updaten nicht) | Low – User verwirrt nach Re-Import | Klare Anleitung: "Tracks importieren, nicht nur Playlists", Workaround dokumentieren |
| O(N²) Fingerprint-Vergleich bei großen Libraries | Medium – 10k+ Tracks = Minuten | Metadata-Blocking vor Fingerprint, LSH-Indexing als Optimierung |
| Audio-Codec Support | Low – Seltene Formate nicht decodierbar | 2-Tier Decoding (wasm-audio-decoders + ffmpeg.audio.wasm), klare Fehlermeldung |

### 9.2 Lizenz-Risiken 🔴

| Library | Lizenz | Risiko | Mitigation |
|---|---|---|---|
| **Essentia.js** | AGPL-3.0 | **Critical** – WASM-Distribution = Code-Distribution → AGPL erzwingt Open-Source des gesamten Client-Codes | **Option A:** Commercial License bei MTG/UPF (empfohlen). **Option B:** Open-Source Client (Business-Value im Backend/SaaS). **Option C:** Alternative Library (siehe unten) |
| **Aubio** | GPL-3.0 | **High** – GPL ohne AGPL Network-Clause, aber WASM-Distribution ist trotzdem Distribution | **Option A:** Commercial License anfragen. **Option B:** Strikte Worker-Isolation als "separate work" (rechtlich grau). **Option C:** Eigene Beat-Detection (aufwändig) |
| **Chromaprint** | LGPL-2.1 | **Low** – LGPL erlaubt dynamisches Linken in proprietary Code | WASM als separates Modul laden (nicht in Bundle kompilieren) = LGPL-konform |
| **FFmpeg** | LGPL/GPL (build-abhängig) | **Low** – ffmpeg.audio.wasm nutzt LGPL-Build | LGPL-Build verwenden, keine GPL-Codecs aktivieren |
| **wasm-audio-decoders** | MIT/BSD-like | **Keine** | Frei nutzbar |

**Essentia.js Alternativen (falls keine Commercial License):**
- Aubio für BPM/Beat (hat auch rudimentäre Pitch-Detection, aber keine Key Detection auf Essentia-Level)
- Eigene HPCP-basierte Key Detection implementieren (Web Audio API + Pitch Detection + Key Profile Matching)
- [Meyda](https://meyda.js.org/) (MIT) – Audio Feature Extraction in JS, aber weniger akkurat als Essentia für Key Detection
- **Empfehlung:** Commercial License anfragen ist der sauberste Weg. Kosten verhandeln.

### 9.3 Business-Risiken

| Risiko | Impact | Mitigation |
|---|---|---|
| Rekordbox/Traktor XML Schema Changes | Medium – Parser bricht bei Major Updates | Schema Versioning, Graceful Degradation, pyrekordbox als Referenz monitoren |
| Lexicon DJ erweitert um Audio-Analyse | High – Stärkster Competitor mit bestehender User-Base | First-Mover-Advantage nutzen, Browser-basiert als Differenzierung halten |
| DJ-Markt lehnt Subscription ab | Medium – Preference für One-Time-Purchase | Lifetime-Option anbieten ($149), Freemium als Einstieg |

---

## 10. Success Metrics

| Metrik | Target (3 Monate nach Launch) |
|---|---|
| Registered Users | 1.000 |
| Free → Pro Conversion | 5–8% |
| Tracks Analyzed (total) | 500.000 |
| Average Tracks per Session | 200+ |
| NPS | >50 |
| Churn Rate (Pro) | <8% monatlich |

---

## 11. Future Roadmap (Post-MVP)

- **Serato DJ Pro Support** (Library-Format: Crate Files + SQLite DB)
- **Engine DJ Support** (Denon Ecosystem)
- **Loudness Normalization Check** (LUFS-Analyse)
- **Silence/Intro-Outro Detection**
- **Harmonic Mixing Suggestions** (Playlist-Analyse: Key-Kompatibilität)
- **Rekordbox Cloud Library Sync** (wenn Rekordbox API verfügbar)
- **Batch Re-Analysis** (nur geänderte Tracks re-analysieren)
- **Desktop Companion App** (Electron/Tauri) für bessere File Access
- **Community Features:** Anonymisierte Library-Stats, Benchmarks

---

## 12. Open Questions

1. **Brand Name?** – Braucht einen starken, merkbaren Namen. Vorschläge: GridCheck, TrackDoctor, DeckHealth, BeatAudit, CrateCheck
2. ~~**Essentia.js Lizenz:**~~ → **GEKLÄRT (Risiko bestätigt):** AGPL-3.0 ist ein echtes Problem. WASM-Distribution = Code-Distribution. **Aktion: Commercial License bei MTG/UPF anfragen (Phase 0 Blocker).** Alternativen: Aubio (auch GPL), eigene Implementation, oder Client open-sourcen. Siehe Sektion 9.2.
3. ~~**Rekordbox 7 vs. 6 XML Kompatibilität:**~~ → **GEKLÄRT:** XML-Format ist stabil zwischen v6 und v7. Kein Breaking Schema Change. Bekannter Import-Bug: Tracks updaten nicht bei Playlist-Import (Workaround in Anleitung dokumentieren). Offizielles Schema-PDF: rekordbox.com/en/support/developer/
4. ~~**Variable BPM Handling:**~~ → **GEKLÄRT:** BPM-Varianz über Track-Segmente berechnen. >2% Varianz = "Variable BPM" Flag. Kein Auto-Fix für Variable-BPM Tracks. Aubio-Accuracy degradiert bei diesen Tracks – Confidence Score entsprechend niedrig setzen.
5. **Mobile Support:** Sinnvoll für Report-Ansicht, aber Processing unrealistisch. Separate Betrachtung?
6. **NEU: Aubio GPL Lizenz** – Aubio ist GPL (nicht AGPL), aber WASM-Distribution triggert trotzdem GPL-Pflichten. Commercial License anfragen oder strikte Worker-Isolation als "separate work" argumentieren?
7. **NEU: Lifetime Pricing** – $149 als Lifetime-Preis angemessen? Vergleich: MIK $58 (weniger Features), Lexicon hat auch Lifetime-Option.
8. **NEU: State Management** – Zustand vs. Jotai? Empfehlung: Zustand (größere Community, einfacher für diesen Use Case).

---

## 13. Referenzen & Quellen (Research Feb 2026)

### Offizielle Specs
- [Rekordbox XML Format Spec (PDF)](https://cdn.rekordbox.com/files/20200410160904/xml_format_list.pdf)
- [Rekordbox Developer Support](https://rekordbox.com/en/support/developer/)
- [File System Access API (Chrome)](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [Essentia.js Dokumentation](https://mtg.github.io/essentia.js/)
- [Essentia Licensing](https://essentia.upf.edu/licensing_information.html)

### Libraries & Tools
- [wasm-audio-decoders](https://github.com/eshaz/wasm-audio-decoders) – Lightweight per-codec WASM Decoder (MIT)
- [ffmpeg.audio.wasm](https://github.com/JorenSix/ffmpeg.audio.wasm) – Audio-focused FFmpeg WASM Build
- [aubiojs](https://github.com/qiuxiang/aubiojs) – Aubio WASM Bindings
- [Chromaprint / @unimusic/chromaprint](https://github.com/acoustid/chromaprint) – Audio Fingerprinting (LGPL)
- [browser-fs-access](https://github.com/nickvdp/browser-fs-access) – File System Access Ponyfill
- [pyrekordbox](https://github.com/dylanljones/pyrekordbox) – Python Referenz für RB XML/DB
- [Meyda](https://meyda.js.org/) – Audio Feature Extraction (MIT, Key Detection Alternative)

### Competitor Research
- [Mixed In Key](https://mixedinkey.com/) – $58 einmalig, Key Detection Focus
- [Lexicon DJ](https://www.lexicondj.com/) – Library Management, Multi-App Sync
- [MIXO](https://www.mixo.dj/) – Cloud-basierte Library Organisation
- [Djoid](https://www.djoid.io/) – AI-basierte DJ Curation (Berlin)

### Architecture Patterns
- [Audio Worklet Design Pattern (Chrome)](https://developer.chrome.com/blog/audio-worklet-design-pattern/)
- [workerpool](https://github.com/josdejong/workerpool) – Worker Pool Library
- [AGPL Compliance Guide](https://vaultinum.com/blog/essential-guide-to-agpl-compliance-for-tech-companies)
