# Art Deco Design System - Beatgrid Master

## Design Philosophy

"Gatsby meets DJ Software" - Art Deco Aesthetic mit warmer Kupfer/Bronze-Palette.
Mechanisch, geometrisch, theatralisch. Inspiriert von 1920er Art Deco Architektur,
angewendet auf eine moderne DJ Library Analyse-App.

---

## Farbpalette (Warm Night Mode)

| Token | Hex | Verwendung |
|-------|-----|------------|
| **Primary (Kupfer)** | `#c17d53` | Akzente, Borders, Icons, CTAs |
| **Secondary (Dunkelbraun)** | `#7e5138` | Sekundaere Akzente, Hover-States |
| **Tertiary (Tiefbraun)** | `#503628` | Tertiaere Elemente |
| **Surface Elevated** | `#2e221c` | Muted, Secondary BG |
| **Card Background** | `#1d1511` | Cards, Popovers |
| **Page Background** | `#0d0c0c` | Body Background |
| **Foreground** | `#F2F0E4` | Champagne Cream Text |
| **Muted Text** | `#888888` | Pewter/Grau |

### Kupfer-Opacity Skala

- `rgba(193, 125, 83, 0.03)` - Background Patterns
- `rgba(193, 125, 83, 0.2)` - Input Borders
- `rgba(193, 125, 83, 0.3)` - Card Borders
- `rgba(193, 125, 83, 0.35)` - Hover Glow
- `#c17d53` - Full Kupfer (Active/Focus)

---

## Typography

| Element | Font | Stil |
|---------|------|------|
| **Headings** | Marcellus (Serif) | `uppercase`, `letter-spacing: 0.15em` |
| **Body** | Josefin Sans (Geometric Sans) | Normal weight, clean |
| **Mono** | System Monospace | Metriken, Zahlen |

### Heading-Regeln

- IMMER `text-transform: uppercase`
- IMMER `letter-spacing: 0.15em`
- Farbe: `var(--primary)` (Kupfer)
- Font: `var(--font-heading)` (Marcellus)

---

## Radius & Borders

| Regel | Wert |
|-------|------|
| **Border Radius** | `0px` (Sharp Edges - NIEMALS rounded!) |
| **Card Border** | `1px solid rgba(193, 125, 83, 0.3)` |
| **Card Hover Border** | `1px solid #c17d53` |
| **Divider** | Kupfer 40% Opacity |

---

## Art Deco Signature Elements

### Corner Decorations

Jede Card hat `::before` und `::after` Pseudo-Elemente:
- Top-Left: 2px Border Top + Left, 16x16px
- Bottom-Right: 2px Border Bottom + Right, 16x16px
- Opacity: 0.5 -> 1.0 bei Hover
- Farbe: `var(--primary)`

### Crosshatch Background

Body hat subtiles Kreuzschraffur-Pattern:
- 45deg und -45deg `repeating-linear-gradient`
- Kupfer 3% Opacity
- 12px Spacing

### Diamond Icon Container

Icons in um 45deg rotiertem Container (Raute):
- Kupfer Border
- Transparent Background
- Glow bei Hover

### Section Dividers

Dekorative Trennlinien mit Kupfer-Linien + Text:
```
────── SECTION TITLE ──────
```

---

## Component Styling Rules

### Cards

- `bg-card` (Dark Brown)
- Sharp Edges (radius: 0)
- Kupfer Border 30%
- Corner Decorations
- Hover: Border 100%, `-translate-y-0.5`, Glow
- Transition: `500ms` (theatralisch)

### Buttons

- Default: Transparent BG, Kupfer Border, Kupfer Text
- Hover: Kupfer BG, Schwarzer Text, Glow
- `uppercase`, `letter-spacing: 0.1em`
- Sharp Edges

### Tabs

- TabsList: Transparent BG, Kupfer Bottom-Border
- TabsTrigger: `uppercase`, `tracking-wide`
- Active: Kupfer Underline
- Kein Hintergrund-Wechsel bei Active

### Inputs

- Kupfer Border 20%
- Focus: Kupfer Border 100% + Ring
- Sharp Edges

---

## Glow statt Shadow

NIEMALS `box-shadow` mit schwarzen Schatten. Stattdessen:
- Default: `box-shadow: 0 0 15px rgba(193, 125, 83, 0.2)`
- Hover: `box-shadow: 0 0 25px rgba(193, 125, 83, 0.35)`

---

## Animation Philosophy

| Eigenschaft | Wert |
|-------------|------|
| **Duration** | 300-500ms (theatralisch, nicht schnell) |
| **Easing** | `ease-in-out` (mechanisch) |
| **Hover Lift** | `-translate-y-0.5` (subtil) |
| **Opacity Transitions** | 500ms (langsam einblenden) |

---

## Layout & Spacing

| Element | Spacing |
|---------|---------|
| **Page Padding** | `p-6 md:p-10` |
| **Section Gap** | `space-y-6` |
| **Card Gap** | `gap-6` |
| **Max Width** | `max-w-7xl` (Report), `max-w-6xl` (Modal) |

---

## Accessibility (WCAG 2.1 AA)

| Anforderung | Wert |
|-------------|------|
| **Kontrast (Text)** | >= 4.5:1 (`#F2F0E4` auf `#0d0c0c` = 16.4:1) |
| **Kontrast (UI)** | >= 3:1 (`#c17d53` auf `#0d0c0c` = 5.2:1) |
| **Touch Targets** | >= 44px |
| **Focus States** | Kupfer Ring (sichtbar) |
| **ARIA-Labels** | Pflicht fuer Icons-only |
| **Keyboard Navigation** | Tab-Focus auf alle interaktiven Elemente |
