# Cinematic Motion: Animation-Qualität

Prinzipien für professionelle Animationen in Remotion.

---

## Golden Rule

**Keine linearen Animationen.** Alles muss Easing haben.

```
❌ Linear: Roboterhaft, billig
✅ Easing: Natuerlich, hochwertig
```

---

## Remotion Springs

### Wann welche Spring?

| Spring | Damping | Stiffness | Wirkung | Verwendung |
|--------|---------|-----------|---------|------------|
| smooth | 200 | - | Sanft, elegant | Logos, Backgrounds |
| snappy | 20 | 200 | Schnell, praezise | Text, CTAs |
| bouncy | 8 | - | Verspielt | Cards, Icons |
| heavy | 15 | 80 | Gewichtig | Impact-Momente |

### Code-Pattern

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfigs } from '../design-tokens';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const value = spring({
  frame,
  fps,
  config: springConfigs.snappy,
});
```

---

## Animation-Prinzipien

### 1. Anticipation
Kurze Gegenbewegung vor der Hauptbewegung.

```tsx
// Scale: erst kleiner, dann größer
const scale = interpolate(
  frame,
  [0, 5, 20],
  [1, 0.95, 1.1],
  { extrapolateRight: 'clamp' }
);
```

### 2. Overshoot
Über das Ziel hinausschiessen, dann zurück.

```tsx
const scale = spring({
  frame,
  fps,
  config: { damping: 8 }, // bouncy = overshoot
});
```

### 3. Squash & Stretch
Nicht in Videos nötig, aber Scale-Variationen helfen.

### 4. Stagger
Elemente nacheinander animieren.

```tsx
const staggerDelay = 5; // 5 Frames zwischen Items
items.map((item, i) => {
  const itemFrame = frame - (i * staggerDelay);
  // ...
});
```

---

## Timing-Regeln

| Animation | Dauer (Frames @ 30fps) | Sekunden |
|-----------|------------------------|----------|
| Fade In | 10-20 | 0.3-0.7s |
| Scale In | 15-25 | 0.5-0.8s |
| Slide In | 15-30 | 0.5-1.0s |
| Text Reveal | 10-15 | 0.3-0.5s |
| Transition | 15-25 | 0.5-0.8s |

---

## Easing-Kurven (wenn nicht Spring)

```tsx
import { Easing } from 'remotion';

// Ease Out (empfohlen für Enter)
const value = interpolate(frame, [0, 30], [0, 1], {
  easing: Easing.out(Easing.cubic),
});

// Ease In Out (für Loops)
const value = interpolate(frame, [0, 60], [0, 1], {
  easing: Easing.inOut(Easing.quad),
});
```

---

## Performance-Impact

**DO:**
- Springs für natuerliche Bewegungen
- `extrapolateRight: 'clamp'` immer setzen
- Animationen in Szenen-Komponenten isolieren

**DON'T:**
- Zu viele gleichzeitige Springs (>10 kann laggen)
- Sehr niedrige Damping-Werte (<5)
- Animationen auf dem Root-Element

---

## Qualitäts-Check

- [ ] Keine linearen Animationen
- [ ] Springs aus design-tokens.ts
- [ ] Timing passt zur Plattform
- [ ] Stagger für Listen/Gruppen
- [ ] Keine abgehackten Bewegungen
