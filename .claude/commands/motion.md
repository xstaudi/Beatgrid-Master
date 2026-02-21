# Motion Video Workflow

Multi-Agent-Workflow für Marketing-Videos mit Remotion.

**Wann einsetzen:**
- Marketing-Videos für Social Media erstellen
- Produkt-Demos, Feature-Showcases
- Event-Promotions, DJ-Profiles
- Dynamische Videos mit App-Daten

**Ziel:** Cinematic Marketing-Videos im theweekend.at Brand-Style.

## Usage

```
/motion                    # Startet Input-Wizard (8 Fragen)
/motion quick              # Verkuerzte Version (4 Kernfragen)
/motion template           # Zeigt verfügbare Templates
/motion render             # Nur Render (nach Implementierung)
```

## Input

**Interaktiver Wizard:** 8 Fragen mit Vorschlägen + Freifeld-Option

Der Wizard sammelt alle Informationen für den MotionBrief.

## Workflow-Phasen (9 Phasen)

### 0. CONTEXT-BUDGET PRUEFEN
**Ziel:** Context-Overflow verhindern vor Multi-Step-Workflow.

**Aufgaben:**
- Fuehre `/context` aus
- Wenn >80%: Warnung ausgeben + Empfehlung `/compact`
- Wenn >90%: Abbruch empfehlen (neuer Chat oder `/compact`)
- Wenn >95%: Automatischer Stop

**User-Feedback-Format:**
```markdown
⚠️ **Context-Budget Warning**
- Aktuell: X% Context-Usage
- Empfehlung: `/compact` vor Video-Erstellung, um optimale Performance zu sichern
- Alternative: Session neu starten (neuer Chat)
```

---

### 1. INPUT-WIZARD (8 Fragen)
**Ziel:** Strukturierte Erfassung aller Video-Parameter.

**Nutze AskUserQuestion-Tool für jede Frage:**

#### Frage 1: Produkt / Feature
```
Was soll das Video zeigen?
- A) Event-Listing
- B) DJ-Profil
- C) Booking-Flow
- Freifeld
```

#### Frage 2: Zielgruppe
```
Wer ist die Zielgruppe?
- A) DJs
- B) Veranstalter
- C) SaaS Nutzer
- Freifeld
```

#### Frage 3: Plattform
```
Für welche Plattform?
- A) Instagram Reel (9:16, max 30s)
- B) TikTok (9:16, optimal 60s)
- C) YouTube Shorts (9:16, max 60s)
- D) Landingpage (16:9, unbegrenzt)
```

#### Frage 4: Videolaenge
```
Wie lang soll das Video sein?
- A) 15 Sekunden
- B) 30 Sekunden
- C) 60 Sekunden
- Freifeld
```

#### Frage 5: Tone of Voice
```
Welcher Stil?
- A) Dark Tech
- B) Premium
- C) Club Culture
- Freifeld
```

#### Frage 6: Branding Farben
```
Welche Farbpalette?
- A) Weinrot-Standard (#6B1018)
- B) Petrol-Akzent (#4a6670)
- C) Mixed
- Freifeld (Custom)
```

#### Frage 7: Key Message
```
Was ist die Hauptbotschaft? (1 Satz, 10-200 Zeichen)
Freifeld
```

#### Frage 8: Call to Action
```
Welche Handlungsaufforderung?
- A) App downloaden
- B) Website besuchen
- C) Event anschauen
- Freifeld
```

**Output:** MotionBrief-Objekt mit allen Parametern

---

### 1.5 SCREENSHOT CAPTURE (optional)
**Ziel:** Screenshots von der App für Video-Einbindung.

**Wann relevant:** Bei Product Showcases, Feature Demos, UI-Fokus-Videos.

**Nutze AskUserQuestion-Tool für jede Frage:**

#### Frage S1: Screenshots benötigt?
```
Werden Screenshots von der App benoetigt?
- A) Ja, automatisch aus App (Empfohlen für Product Showcases)
- B) Nein, nur Text/Animation
- C) Eigene Bilder hochladen
```

**Wenn B oder C:** Überspringe zu Phase 2.

#### Frage S2: Welche Screens? (MultiSelect)
```
Welche Screens sollen gezeigt werden?
- [ ] Events-Liste
- [ ] Event-Detail
- [ ] DJ-Profil
- [ ] Booking-Flow
- [ ] Dashboard
- Freifeld (Route angeben, z.B. /clubs)
```

#### Frage S3: Cropping? (pro Screenshot)
```
Wie sollen die Screenshots zugeschnitten werden?
- A) Vollbild (Standard)
- B) Nur Modal/Dialog
- C) Nur Card/Komponente (via Selector)
- D) Hero-Bereich (obere 60%)
- E) Manuell (Koordinaten angeben)
```

**Capture ausführen:**
```bash
npm run screenshot:capture --workspace=video
# Oder für einzelnen Screenshot:
npm run screenshot:capture --workspace=video -- --name=events-list
```

**Screenshots werden gespeichert in:** `video/src/assets/screenshots/`

**ScreenshotConfig Schema:**
```typescript
interface ScreenshotConfig {
  name: string;           // Dateiname ohne Extension
  url: string;            // Route (z.B. /events)
  selector?: string;      // CSS-Selector für Element-Crop
  preset?: 'modal' | 'card' | 'menu' | 'header' | 'hero';
  crop?: { x: number; y: number; width: number; height: number };
  padding?: number;       // Padding um Selector (px)
  clickSelector?: string; // Vor Screenshot klicken (z.B. Modal oeffnen)
  waitForTimeout?: number;
  requiresAuth?: boolean;
}
```

**Output:** Screenshots in `video/src/assets/screenshots/` + Info für Story-Konzept

---

### 2. STORY-KONZEPT
**Agent:** `motion-story-architect`

**Input:** MotionBrief aus Phase 1

**Output:**
- **Sequenz-Übersicht mit eindeutigen IDs (SEQ-XX-NAME)**
- Hook (erste 3 Sekunden)
- Szenen-Timeline mit Timecodes
- Text-Copy für jede Szene
- Emotionaler Arc

**Sequenz-Naming-Schema:**
| Beispiel-ID | Bedeutung |
|-------------|-----------|
| `SEQ-01-HOOK` | Einstieg/Hook |
| `SEQ-02-PROBLEM` | Problem darstellen |
| `SEQ-03-SOLUTION` | Loesung zeigen |
| `SEQ-04-DEMO` | Features demonstrieren |
| `SEQ-05-BENEFIT` | Vorteile hervorheben |
| `SEQ-06-CTA` | Call to Action |

**Vorteil:** Einfache Referenzierung bei Änderungswuenschen (z.B. "Aendere SEQ-03-SOLUTION")

**FREIGABE ERFORDERLICH:** Story ok? (ja/nein/ändern)

---

### 3. MOTION DESIGN
**Agent:** `motion-designer`

**Input:** Story-Konzept aus Phase 2

**Output:**
- Animation-Specs pro Szene
- Easing-Kurven (Remotion Spring-Configs)
- Micro-Animations (Hover, Pulse, etc.)
- Transitions zwischen Szenen
- Optional: Beat-Sync-Markers

**FREIGABE ERFORDERLICH:** Motion Design ok? (ja/nein/ändern)

---

### 4. IMPLEMENTATION
**Agent:** `motion-developer`

**Input:** Story-Konzept + Motion Design

**Output:**
- `video/src/compositions/[VideoName].tsx` - Hauptkomposition
- `video/src/components/[VideoName]/` - Video-spezifische Komponenten
- Zod-Schema für Props
- Integration mit bestehenden Design-Tokens

**Regeln:**
- IMMER `video/src/design-tokens.ts` für Farben verwenden
- IMMER Remotion Best Practices aus `.claude/skills/remotion/`
- KEINE Hex-Farben hardcoden

---

### 5. PERFORMANCE CHECK
**Ziel:** Social-Media-Optimierung prüfen.

**Checkliste:**
- [ ] Hook in ersten 3 Sekunden
- [ ] Lesbare Texte (min. 48px für Mobile)
- [ ] Kontrast-Check (Text auf Background)
- [ ] Loop-fähig (wenn gewünscht)
- [ ] Keine Render-Fehler

---

### 6. BEAT SYNC (optional)
**Nur wenn Audio vorhanden ist.**

**Aufgaben:**
- BPM analysieren (wenn Audio-File angegeben)
- Key-Frames auf Beats legen
- Visual Accents auf Downbeats

---

### 7. CODE REVIEW + RENDER
**Agent:** `code-reviewer` (für Remotion-spezifische Prüfung)

**Aufgaben:**
1. Code-Review mit Fokus auf Remotion Performance
2. Preview im Studio: `npm run studio --workspace=video`
3. Render: `npm run render --workspace=video`
4. Output prüfen: `video/out/[VideoName].mp4`

---

## Quick-Modus (/motion quick)

Nur 4 Kernfragen, Rest mit Defaults:

**Fragen:**
1. Produkt / Feature
2. Zielgruppe
3. Key Message
4. Videolaenge

**Defaults:**
| Parameter | Default-Wert |
|-----------|--------------|
| Plattform | Instagram Reel (9:16) |
| Tone of Voice | Dark Tech |
| Branding Farben | Weinrot-Standard |
| Call to Action | Website besuchen |

---

## MotionBrief Schema

```typescript
interface MotionBrief {
  product: string;           // Was wird gezeigt
  audience: string;          // Zielgruppe
  platform: 'instagram' | 'tiktok' | 'youtube' | 'landingpage';
  duration: number;          // Sekunden
  tone: string;              // Stil
  colors: 'weinrot' | 'petrol' | 'mixed' | string;
  keyMessage: string;        // Hauptbotschaft
  cta: string;               // Call to Action
}
```

---

## Delegierte Agents

| Agent | Phase | Zweck |
|-------|-------|-------|
| `motion-story-architect` | 2 | Story-Struktur, Hook, Szenen |
| `motion-designer` | 3 | Animation-Specs, Easing |
| `motion-developer` | 4 | Remotion Code, Komponenten |
| `code-reviewer` | 7 | Code-Qualität, Performance |

---

## Prompt-Templates

Agents nutzen folgende Prompt-Templates aus `.claude/prompts/motion/`:

| Template | Zweck |
|----------|-------|
| `master-prompt.md` | Video-Architektur, Szenenstruktur |
| `cinematic-motion.md` | Animation-Qualität, Easing |
| `storytelling-hook.md` | Aufmerksamkeit, erste 3 Sekunden |
| `social-media-performance.md` | Plattform-Optimierung |
| `data-driven-videos.md` | Dynamische Props |
| `beat-sync.md` | BPM-Synchronisation |
| `code-quality.md` | Remotion Performance |
| `screenshot-integration.md` | Screenshot-Einbindung, Cropping, Animation |

---

## Bestehende Infrastruktur

**Nutzen (nicht ändern):**
- `video/src/design-tokens.ts` - Farben, Typography, Springs
- `video/src/compositions/` - Bestehende Compositions als Referenz
- `.claude/skills/remotion/` - 28 Rule-Files für Remotion
- `video/package.json` - NPM Scripts (studio, render)

---

## Quality Gates

- [ ] Design-Tokens verwendet (keine Hex-Farben)
- [ ] Hook in ersten 3 Sekunden
- [ ] Lesbare Texte (min. 48px)
- [ ] Korrekte Aspect Ratio (9:16 oder 16:9)
- [ ] Keine Render-Fehler
- [ ] Video in `video/out/` vorhanden

---

## Referenzen

- [design-tokens.ts](../../video/src/design-tokens.ts) - Farben, Typography
- [remotion Skill](../skills/remotion/SKILL.md) - Remotion Best Practices
- [styling-rules.md](../../docs/entwicklung/styling-rules.md) - Brand Guidelines

---

## Änderungen anfragen

Nach Story-Konzept oder Implementation kannst du Änderungen über Sequenz-IDs anfragen:

**Beispiele:**
| Anfrage | Bedeutung |
|---------|-----------|
| "Aendere SEQ-03-SOLUTION" | Loesung-Szene anpassen |
| "Mach SEQ-01-HOOK laenger" | Hook-Dauer erhöhen |
| "Tausche SEQ-04-DEMO und SEQ-05-BENEFIT" | Reihenfolge ändern |
| "Fuege nach SEQ-02-PROBLEM eine neue Szene ein" | Neue Sequenz hinzufügen |
| "Entferne SEQ-05-BENEFIT" | Sequenz löschen |
| "Transition SEQ-03 → SEQ-04 soll glitch sein" | Übergang ändern |

**Hinweis:** Die Sequenz-IDs sind in allen Phasen konsistent (Story-Konzept, Motion-Design, Code).

---

## Siehe auch

- `/figma` - Für UI-Komponenten aus Figma
- `/feature` - Für komplette Feature-Entwicklung
- `/review` - Für Code-Review nach Implementation
