---
name: ui-ux-design-expert
description: UI/UX Design Best Practices. Verwenden bei Komponenten, Styling, Layout, Farben, Typografie, Buttons, Cards, Forms, Icons, Animation, Design Systems.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# UI/UX Design Expert

## Wann aktiv

Bei UI-Komponenten, Styling, Layout, Design System Fragen.

**Projekt-spezifisches Design System:** Siehe styling-rules.md

---

## Verbindlichkeit

- **"Pflicht"** = Abweichung muss begründet werden
- **"Empfehlung"** = Best Practice, Abweichung erlaubt

**Beispiele:**
- Komponenten-States → **Pflicht**
- Animation-Timing → **Empfehlung**
- Breakpoints → **Pflicht**

---

## Grundprinzipien

1. **Konsistenz** - Design Tokens, gleiche Patterns
2. **Hierarchie** - Visuelle Wichtigkeit, ein Primary CTA pro View
3. **Feedback** - Alle States, Loading, Erfolg/Fehler
4. **Accessibility** - Kontrast, Fokus, Touch-Targets

---

## Golden Path (für Reviews)

1. Tokens statt Hardcodes
2. Alle States vorhanden
3. Fokus sichtbar & erreichbar
4. Mobile zuerst prüfen
5. Loading + Empty + Error vorhanden

---

## Design Tokens (Pflicht)

- **Farben:** `bg-background`, `text-foreground`, `border-border`, `primary`, `secondary`, `destructive`, `muted`
- **Spacing:** `gap-*`, `p-*`, `m-*` (8px Grid)
- **Radius:** `rounded-none` (Default)
- **Shadows:** `shadow-none` | `shadow-sm` (sparsam)

❌ **Keine Hardcodes:** `zinc-900`, `#ffffff`, `12px`, etc.

---

## Komponenten-States (Pflicht)

| State | Wann |
|-------|------|
| default | Ruhezustand |
| hover | Maus darüber |
| focus | Tastatur-Fokus (SICHTBAR!) |
| active | Gedrueckt |
| disabled | Nicht verfügbar |
| loading | In Bearbeitung |
| error | Fehlerzustand |

### Focus (Pflicht)

- Immer sichtbar (kein `outline: none`)
- Mind. 2px Ring
- Kontrast ≥ 3:1
- Beispiel: `focus:ring-2 focus:ring-primary focus:ring-offset-2`

---

## Spacing (8px Grid)

```
4px=gap-1  8px=gap-2  12px=gap-3  16px=gap-4
24px=gap-6  32px=gap-8  48px=gap-12  64px=gap-16
```

---

## Farben (Semantisch)

| Zweck | Verwendung |
|-------|------------|
| Primary | Hauptaktionen |
| Secondary | Sekundaere Aktionen |
| Destructive | Löschen, Fehler |
| Muted | Hilfstexte |

---

## Patterns

### Buttons

**Varianten:**
- Primary: Max 1 pro View
- Secondary: Outline/Ghost
- Destructive: Nur für gefaehrliche Aktionen

**States:**
- **disabled:** Nicht klickbar, kein Hover, reduced opacity
- **loading:** Klickbar = false, Label bleibt sichtbar, Spinner ersetzt Icon

### Forms

**Grundlagen:**
- Label + Input + Error (nie nur Placeholder)
- Validation Messages konkret
- Submit disabled während Loading

**Error State (Pflicht):**
- Error-Text unter Input
- Input mit `error-border` (nicht nur Farbe)
- Error via `aria-describedby` verknüpft

### Loading (A11y)

**Visuell:**
- Skeleton für Content
- Spinner für Aktionen

**Accessibility (Pflicht):**
- Container: `aria-busy="true"` während async load
- Buttons: `aria-disabled="true"` bei loading

### Empty States

**Struktur:**
- Icon + Titel + Beschreibung + CTA

**CTA-Regel:**
- Max. 1 Primary CTA
- Secondary Actions optional
- Kein Empty ohne Erklärung

---

## Animation

**Timing (Empfehlung):**
- 150-300ms für UI
- ease-out Enter, ease-in Exit
- Subtil und funktional
- Keine Bounce ohne Grund

**Performance (Pflicht):**
- Keine Animation auf Layout-affecting Properties (`width`, `height`, `top`)
- Nur `transform` + `opacity`

---

## Responsive

**Breakpoints (Pflicht):**
- Mobile-First (Basis = Mobile)
- `sm:640` `md:768` `lg:1024` `xl:1280`

**Touch Targets (Pflicht):**
- Min. 44×44px (Buttons, Icons, Chips)
- Ausnahme nur bei rein dekorativen Icons

---

## Anti-Patterns

- Inkonsistente Spacing/Farben
- Fehlende States
- Hardcoded Farben statt Tokens
- Magic Numbers
- Zu kleine Touch Targets
- Nur Farbe für Information

---

## Checkliste

- [ ] Alle States vorhanden (default, hover, focus, active, disabled, loading, error)
- [ ] Design Tokens verwendet (keine Hardcodes)
- [ ] Focus sichtbar & erreichbar (mind. 2px Ring, Kontrast ≥ 3:1)
- [ ] Responsive getestet (Mobile zuerst)
- [ ] Touch Targets ≥ 44×44px
- [ ] Kontrast geprüft (WCAG AA)
- [ ] Loading/Empty/Error States vorhanden
- [ ] A11y-Attribute (`aria-busy`, `aria-describedby`, `aria-disabled`)
