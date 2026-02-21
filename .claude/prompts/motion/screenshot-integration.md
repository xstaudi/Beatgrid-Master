# Screenshot Integration: App-Screenshots in Marketing-Videos

Best Practices für Screenshot-Capture und -Einbindung in Remotion Videos.

---

## Wann Screenshots verwenden?

| Video-Typ | Screenshot-Bedarf | Empfehlung |
|-----------|------------------|------------|
| **Product Showcase** | Hoch | Screenshots + Animation |
| **Feature Demo** | Hoch | Screenshots mit Highlighting |
| **Event Promotion** | Mittel | Hero-Screenshot + Text-Overlay |
| **Brand Awareness** | Niedrig | Meist nur Text/Animation |
| **Tutorial** | Sehr hoch | Step-by-Step Screenshots |

---

## Screenshot-Capture Workflow

### 1. Server starten

```bash
npm run dev  # App auf localhost:5173
```

### 2. Screenshots konfigurieren

In `video/scripts/capture-screenshots.ts`:

```typescript
const screenshots: ScreenshotConfig[] = [
  // Vollbild-Screenshot
  {
    name: "events-list",
    url: "/events",
    waitForTimeout: 3000,
    dismissCookies: true,
  },

  // Element-basiertes Cropping (z.B. Modal)
  {
    name: "event-modal",
    url: "/events",
    clickSelector: '[data-testid="event-card"]:first-child',
    waitForTimeout: 1000,
    selector: '[role="dialog"]',
    padding: 20,
  },

  // Preset-basiertes Cropping
  {
    name: "hero-section",
    url: "/",
    preset: "hero", // modal, card, menu, header, hero
  },

  // Manuelles Cropping
  {
    name: "sidebar-nav",
    url: "/dashboard",
    crop: { x: 0, y: 0, width: 320, height: 1920 },
    requiresAuth: true,
  },
];
```

### 3. Screenshots capturen

```bash
# Alle Screenshots
npm run screenshot:capture --workspace=video

# Einzelner Screenshot
npm run screenshot:capture --workspace=video -- --name=events-list
```

**Output:** `video/src/assets/screenshots/[name].png`

---

## Crop-Presets

| Preset | Bereich | Dimensionen (bei 1080x1920) | Verwendung |
|--------|---------|----------------------------|------------|
| `modal` | Zentriert | 800x1200 | Dialoge, Popups |
| `card` | Oben-Links | 1000x600 | Einzelne Cards |
| `menu` | Links | 320x1920 | Navigation, Sidebar |
| `header` | Oben | 1080x200 | App-Header |
| `hero` | Oben 60% | 1080x1152 | Hero-Sections, Landing |

---

## Screenshot in Composition einbinden

### Basis-Einbindung

```tsx
import { Img, staticFile } from 'remotion';

// Screenshot anzeigen
<Img
  src={staticFile('assets/screenshots/events-list.png')}
  style={{
    width: '100%',
    height: 'auto',
  }}
/>
```

### Mit Frame-basierter Animation

```tsx
import { Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfigs } from '../design-tokens';

const ScreenshotScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade In
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Scale mit Spring
  const scale = spring({
    frame,
    fps,
    config: springConfigs.smooth,
    from: 0.9,
    to: 1,
  });

  return (
    <Img
      src={staticFile('assets/screenshots/dashboard.png')}
      style={{
        opacity,
        transform: `scale(${scale})`,
        width: '100%',
      }}
    />
  );
};
```

---

## Animation-Patterns für Screenshots

### 1. Slide-In (von unten)

```tsx
const slideY = interpolate(frame, [0, 30], [100, 0], {
  extrapolateRight: 'clamp',
});

<Img
  src={staticFile('assets/screenshots/events-list.png')}
  style={{
    transform: `translateY(${slideY}px)`,
  }}
/>
```

### 2. Slide-In (von rechts)

```tsx
const slideX = interpolate(frame, [0, 30], [200, 0], {
  extrapolateRight: 'clamp',
});

<Img
  src={staticFile('assets/screenshots/profile.png')}
  style={{
    transform: `translateX(${slideX}px)`,
  }}
/>
```

### 3. Zoom-In (Scale)

```tsx
const scale = spring({
  frame,
  fps,
  config: springConfigs.smooth,
  from: 0.8,
  to: 1,
});

<Img
  src={staticFile('assets/screenshots/dashboard.png')}
  style={{
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  }}
/>
```

### 4. Pan (Ken Burns Effekt)

```tsx
const panX = interpolate(frame, [0, durationInFrames], [0, -50], {
  extrapolateRight: 'clamp',
});

<div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
  <Img
    src={staticFile('assets/screenshots/homepage.png')}
    style={{
      transform: `translateX(${panX}px) scale(1.1)`,
      width: '110%',
    }}
  />
</div>
```

### 5. Focus-Zoom (auf bestimmten Bereich)

```tsx
// Zoom auf obere Haelfte (z.B. Header)
const scale = interpolate(frame, [0, 60], [1, 1.5], {
  extrapolateRight: 'clamp',
});

const translateY = interpolate(frame, [0, 60], [0, -25], {
  extrapolateRight: 'clamp',
});

<Img
  src={staticFile('assets/screenshots/events-list.png')}
  style={{
    transform: `scale(${scale}) translateY(${translateY}%)`,
    transformOrigin: 'top center',
  }}
/>
```

### 6. Highlight-Effekt (Spotlight)

```tsx
// Spotlight auf einen Bereich
<div style={{ position: 'relative' }}>
  <Img src={staticFile('assets/screenshots/dashboard.png')} />

  {/* Dunkler Overlay mit Loch */}
  <div style={{
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(
      circle at 50% 30%,
      transparent 100px,
      rgba(0,0,0,0.7) 200px
    )`,
  }} />
</div>
```

---

## Responsive Scaling

### 9:16 (Vertikal - Instagram/TikTok)

```tsx
<Img
  src={staticFile('assets/screenshots/events-list.png')}
  style={{
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
  }}
/>
```

### 16:9 (Horizontal - YouTube/Landingpage)

```tsx
// Screenshot zentriert mit Padding
<div style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '5%',
}}>
  <Img
    src={staticFile('assets/screenshots/dashboard.png')}
    style={{
      maxWidth: '85%',
      maxHeight: '85%',
      borderRadius: 16,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}
  />
</div>
```

---

## Screenshot-Styling

### Geraete-Mockup (Phone Frame)

```tsx
// Screenshot im iPhone-Frame
<div style={{
  position: 'relative',
  width: 380,
  height: 820,
  borderRadius: 50,
  border: '12px solid #1a1a1a',
  overflow: 'hidden',
  boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
}}>
  <Img
    src={staticFile('assets/screenshots/events-list.png')}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }}
  />
</div>
```

### Schatten + Rounded Corners

```tsx
<Img
  src={staticFile('assets/screenshots/dashboard.png')}
  style={{
    borderRadius: 16,
    boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
  }}
/>
```

### Glow-Effekt (Brand Color)

```tsx
import { colors } from '../design-tokens';

<Img
  src={staticFile('assets/screenshots/profile.png')}
  style={{
    borderRadius: 16,
    boxShadow: `0 0 60px ${colors.primary}40`,
  }}
/>
```

---

## Cropping Best Practices

### DO

- ✅ Fokus auf Kernbereich (Modal statt ganze Page)
- ✅ Padding um Element (10-20px)
- ✅ Konsistente Crop-Größen für Serie
- ✅ Dark Mode für besseren Kontrast
- ✅ Warten bis Content geladen ist

### DON'T

- ❌ Zu viel leerer Raum
- ❌ Abgeschnittene UI-Elemente
- ❌ Light Mode bei dunklem Video-Background
- ❌ Screenshots mit Loading-States
- ❌ Screenshots mit offenen Dropdowns/Tooltips (ausser gewollt)

---

## Qualitäts-Checkliste

- [ ] Screenshot zeigt relevanten Content
- [ ] Kein Loading-State sichtbar
- [ ] Dark Mode aktiviert (falls Video dunkel)
- [ ] Cropping fokussiert auf Kernbereich
- [ ] Keine sensitiven Daten sichtbar
- [ ] staticFile() für Pfad verwendet
- [ ] Animation mit extrapolateRight: 'clamp'
- [ ] Responsive für Ziel-Aspect-Ratio
