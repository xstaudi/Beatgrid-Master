# Code Quality: Remotion Performance

Best Practices für performanten Remotion-Code.

---

## Golden Rules

1. **Keine Side Effects** - Kein useEffect für Animationen
2. **Keine State** - Kein useState für Frame-basierte Werte
3. **Deterministic Rendering** - Gleiches Frame = Gleiches Bild
4. **Memoization** - useMemo für teure Berechnungen
5. **Keine CSS Animations** - CSS transitions/animations sind VERBOTEN
6. **Keine Tailwind Animations** - `animate-*` Classes funktionieren nicht

---

## Anti-Patterns

### ❌ useState für Animationen

```tsx
// FALSCH
const [opacity, setOpacity] = useState(0);
useEffect(() => {
  setOpacity(frame / 30);
}, [frame]);

// RICHTIG
const opacity = interpolate(frame, [0, 30], [0, 1]);
```

### ❌ useEffect für Side Effects

```tsx
// FALSCH
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

// RICHTIG: Daten als Props übergeben
// oder mit calculateMetadata laden
```

### ❌ Random ohne Seed

```tsx
// FALSCH - Nicht deterministisch
const offset = Math.random() * 100;

// RICHTIG - Deterministisch mit Frame
const offset = (frame * 13) % 100;

// ODER: random() von Remotion
import { random } from 'remotion';
const offset = random(frame) * 100;
```

---

## Performance-Optimierung

### useMemo für Berechnungen

```tsx
// Teure Berechnung nur einmal
const processedData = useMemo(() => {
  return items.map(item => ({
    ...item,
    position: calculatePosition(item),
  }));
}, [items]);
```

### useCallback für Handler (selten nötig)

```tsx
// Nur wenn Handler als Prop weitergegeben wird
const handleClick = useCallback(() => {
  // ...
}, [dependency]);
```

### Komponenten-Splitting

```tsx
// RICHTIG: Szenen als eigene Komponenten MIT premountFor
<Sequence from={0} durationInFrames={90} premountFor={30}>
  <Hook />
</Sequence>
<Sequence from={90} durationInFrames={150} premountFor={30}>
  <Scene1 />
</Sequence>

// FALSCH: Alles in einer Komponente oder ohne premountFor
```

**WICHTIG:** Immer `premountFor` verwenden! Das laedt die Komponente vor dem Abspielen.

---

## interpolate Best Practices

### Immer extrapolate setzen

```tsx
// RICHTIG
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

// FALSCH - Kann über 1 oder unter 0 gehen
const opacity = interpolate(frame, [0, 30], [0, 1]);
```

### Mehrere Keyframes

```tsx
// Scale: 0 → 1.1 → 1 (Overshoot)
const scale = interpolate(
  frame,
  [0, 20, 30],
  [0, 1.1, 1],
  { extrapolateRight: 'clamp' }
);
```

---

## spring Best Practices

### Config aus design-tokens.ts

```tsx
import { springConfigs } from '../design-tokens';

const value = spring({
  frame,
  fps,
  config: springConfigs.snappy,
});
```

### Delay via Frame-Offset

```tsx
// Animation startet bei Frame 30
const value = spring({
  frame: frame - 30,
  fps,
  config: springConfigs.snappy,
});
```

---

## Assets laden

### Bilder

```tsx
import { Img, staticFile } from 'remotion';

// Statische Bilder
<Img src={staticFile('logo.png')} />

// Dynamische URLs (als Props)
<Img src={props.imageUrl} />
```

### Videos

```tsx
import { Video, OffthreadVideo, staticFile } from 'remotion';

// Für Rendering (performanter)
<OffthreadVideo src={staticFile('background.mp4')} />

// Für Studio-Preview
<Video src={staticFile('background.mp4')} />
```

### Fonts

```tsx
import { staticFile, continueRender, delayRender } from 'remotion';

// In Root.tsx oder useEffect
const waitForFont = delayRender();
const font = new FontFace('Space Grotesk', `url(${staticFile('fonts/SpaceGrotesk.woff2')})`);
font.load().then(() => {
  document.fonts.add(font);
  continueRender(waitForFont);
});
```

---

## Composition-Setup

```tsx
// Root.tsx
<Composition
  id="VideoName"
  component={VideoName}
  durationInFrames={900}
  fps={30}
  width={1080}
  height={1920}
  schema={videoNameSchema}
  defaultProps={defaultVideoNameProps}
/>
```

### calculateMetadata (für dynamische Duration)

```tsx
export const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  props,
}) => {
  // Dynamische Duration basierend auf Props
  const duration = props.scenes.length * 150;

  return {
    durationInFrames: duration,
    fps: 30,
    width: 1080,
    height: 1920,
  };
};
```

---

## Debugging

### Visual Frame Counter

```tsx
{process.env.NODE_ENV === 'development' && (
  <div style={{
    position: 'absolute',
    top: 10,
    right: 10,
    color: 'white',
    fontSize: 12,
  }}>
    Frame: {frame} / {durationInFrames}
  </div>
)}
```

### Console Logging (nur Studio)

```tsx
if (process.env.NODE_ENV === 'development') {
  console.log('Current frame:', frame);
}
```

---

## Render-Kommandos

```bash
# Studio starten
npm run studio --workspace=video

# Render (Standard)
npm run render --workspace=video

# Spezifische Composition
npm run render --workspace=video -- --composition=VideoName

# Mit Props
npm run render --workspace=video -- --props='{"eventName":"Test"}'

# Qualitaet
npm run render --workspace=video -- --crf=18  # Niedrigerer CRF = Bessere Qualitaet
```

---

## Qualitäts-Checkliste

- [ ] Keine useState für Frame-basierte Werte
- [ ] Keine useEffect für Animationen
- [ ] useMemo für teure Berechnungen
- [ ] extrapolate bei allen interpolate-Calls
- [ ] Springs aus design-tokens.ts
- [ ] Deterministic Rendering (random() mit Seed)
- [ ] Assets via staticFile() geladen
- [ ] Composition in Root.tsx registriert
- [ ] premountFor bei allen Sequences
- [ ] Keine CSS/Tailwind Animations
