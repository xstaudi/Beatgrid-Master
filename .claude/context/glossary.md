# Glossary

Domain-Begriffe für DJ Library Analyzer.

---

## Audio-Analyse

| Begriff | Beschreibung |
|---------|--------------|
| **BPM** | Beats Per Minute - Tempo eines Tracks |
| **Beatgrid** | Raster das Beats auf die Timeline legt. Definiert durch ersten Downbeat + BPM |
| **Downbeat** | Erster Schlag eines Takts (die "1"). Referenzpunkt für Beatgrid |
| **Grid Drift** | Abweichung des Beatgrids über die Tracklänge - entsteht bei leicht falschem BPM |
| **Onset Detection** | Erkennung von Noten-/Beat-Anfängen im Audiosignal via Spectral Flux |
| **Key / Tonality** | Tonart eines Tracks (z.B. Am, C, F#m) |
| **Camelot Wheel** | Numerisches System für Key-Kompatibilität (z.B. 8A, 11B). Benachbarte Werte = harmonisch mischbar |
| **Open Key** | Alternatives numerisches Key-System (ähnlich Camelot) |
| **Chromagram** | Spektrale Darstellung der 12 Halbtöne über die Zeit - Basis für Key Detection |
| **Clipping** | Digitale Verzerrung wenn Signal 0dBFS überschreitet und abgeschnitten wird |
| **True Peak** | Inter-Sample Peak der über 0dBFS liegt - Clipping das erst nach DA-Wandlung hörbar wird |
| **dBFS** | Decibels Full Scale - digitale Lautstärke-Einheit. 0dBFS = Maximum |
| **PCM** | Pulse Code Modulation - unkomprimiertes digitales Audioformat (Float32 oder Int16) |
| **Audio Fingerprint** | Kompakter Hash eines Audiosignals für Wiedererkennung (z.B. via Chromaprint) |

---

## DJ-Software

| Begriff | Beschreibung |
|---------|--------------|
| **Rekordbox** | Pioneer DJ Software. Library-Export als XML (`DJ_PLAYLISTS` Schema) |
| **Rekordbox XML** | Export-Format mit `<TRACK>`, `<TEMPO>` (Beatgrid), `Tonality` (Key) |
| **Traktor** | Native Instruments DJ Software. Library als NML-Datei |
| **Traktor NML** | XML-Format mit `<ENTRY>`, `<MUSICAL_KEY>` (0-23), `<CUE_V2>` (Beatgrid) |
| **Crate** | DJ-Playlist / Sammlung von Tracks |
| **Library** | Gesamte Track-Sammlung eines DJs (typisch 500-50.000+ Tracks) |

---

## Technisch

| Begriff | Beschreibung |
|---------|--------------|
| **WASM** | WebAssembly - Kompiliertes Binärformat das im Browser near-native Performance bietet |
| **Web Worker** | Browser-Thread für Background-Processing ohne UI-Blocking |
| **SharedArrayBuffer** | Shared Memory zwischen Main Thread und Workers für Zero-Copy Datentransfer |
| **Aubio** | C-Library für Audio-Analyse (Beat Detection, Onset Detection). Als WASM kompiliert |
| **Essentia.js** | JavaScript/WASM Port der Essentia Audio-Analyse Library. Für Key Detection. AGPL-Lizenz |
| **Chromaprint** | Audio-Fingerprinting Library (AcoustID). Als WASM für Duplicate Detection |
| **FFmpeg WASM** | Stripped FFmpeg Build für Audio-Decoding im Browser (MP3, FLAC, WAV, AAC → PCM) |
| **File System Access API** | Chromium API für direkten Dateisystem-Zugriff. Fallback: `<input webkitdirectory>` |
| **Adapter Pattern** | Ein gemeinsames Track-Interface, je ein Adapter für Rekordbox XML und Traktor NML |
| **XML Mutation Engine** | Schreibt korrigierte Werte (BPM, Key, Beatgrid) zurück in die XML/NML-Datei |

---

## Business

| Begriff | Beschreibung |
|---------|--------------|
| **Free Tier** | 25 Tracks/Analyse, alle Checks, kein Export/Auto-Fix |
| **Pro Tier** | $8/Monat - Unlimited Tracks, Auto-Fix, XML Export, History |
| **Auto-Fix** | Automatische Korrektur von BPM, Key, Beatgrid via XML-Export |
| **Library Health Score** | Gesamt-Score (0-100%) über alle Checks einer Library |
| **Confidence Score** | Vertrauenswert (0-100%) für einzelne Analyse-Ergebnisse |
