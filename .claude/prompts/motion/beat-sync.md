# Beat Sync: Audio-Video-Synchronisation

Animationen mit dem Musik-Beat synchronisieren.

---

## Konzept

Beat-Sync verbindet visuelle Akzente mit musikalischen Beats für mehr Impact und Professionalitaet.

---

## BPM-Berechnung

```typescript
// Frames pro Beat
const framesPerBeat = (60 / bpm) * fps;

// Beispiele @ 30fps:
// 120 BPM = 15 Frames/Beat
// 128 BPM = 14.06 Frames/Beat
// 140 BPM = 12.86 Frames/Beat

// Beat-Zeitpunkte
const beatFrames = Array.from(
  { length: Math.floor(totalFrames / framesPerBeat) },
  (_, i) => Math.round(i * framesPerBeat)
);
```

---

## Beat-Typen

| Beat-Typ | Frequenz | Visual-Reaktion |
|----------|----------|-----------------|
| Downbeat | Jeder 4. Beat | Starke Reaktion (Transition, Flash) |
| Beat | Jeder Beat | Mittlere Reaktion (Scale, Movement) |
| Offbeat | Zwischen Beats | Subtile Reaktion (Opacity, Color) |

---

## Visual-Akzente auf Beats

### Downbeat (stark)
```tsx
// Transition, Flash, Scale Bump
const isDownbeat = beatFrames
  .filter((_, i) => i % 4 === 0)
  .includes(frame);

const scale = isDownbeat ? 1.1 : 1;
```

### Beat (mittel)
```tsx
// Subtle movement, glow
const beatProgress = (frame % framesPerBeat) / framesPerBeat;
const glowIntensity = 1 - beatProgress; // Fade out bis nächster Beat
```

### Offbeat (subtil)
```tsx
// Color shift, opacity pulse
const offbeatFrame = frame + (framesPerBeat / 2);
```

---

## Implementation Pattern

```tsx
interface BeatSyncProps {
  bpm: number;
  audioOffset?: number; // Falls Audio nicht bei Frame 0 startet
}

export const useBeatSync = ({ bpm, audioOffset = 0 }: BeatSyncProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const framesPerBeat = (60 / bpm) * fps;
  const adjustedFrame = frame - audioOffset;

  // Aktueller Beat-Index
  const beatIndex = Math.floor(adjustedFrame / framesPerBeat);

  // Ist aktueller Frame ein Beat?
  const isBeat = Math.abs(adjustedFrame % framesPerBeat) < 1;

  // Ist aktueller Frame ein Downbeat (jeder 4. Beat)?
  const isDownbeat = isBeat && beatIndex % 4 === 0;

  // Progress innerhalb des aktuellen Beats (0-1)
  const beatProgress = (adjustedFrame % framesPerBeat) / framesPerBeat;

  return { beatIndex, isBeat, isDownbeat, beatProgress, framesPerBeat };
};
```

---

## Beat-Sync Komponente

```tsx
export const BeatPulse: React.FC<{ bpm: number; children: React.ReactNode }> = ({
  bpm,
  children,
}) => {
  const { beatProgress, isDownbeat } = useBeatSync({ bpm });

  // Scale pulsiert mit Beat
  const scale = interpolate(beatProgress, [0, 0.3, 1], [1.05, 1, 1]);

  // Glow auf Downbeat
  const glowOpacity = isDownbeat ? 0.8 : interpolate(beatProgress, [0, 0.5, 1], [0.3, 0, 0]);

  return (
    <div style={{ transform: `scale(${scale})` }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: shadows.primaryGlow,
          opacity: glowOpacity,
        }}
      />
      {children}
    </div>
  );
};
```

---

## Transitions auf Beats

```tsx
// Transition genau auf Downbeat
const transitionFrame = beatFrames.find((f, i) => i % 4 === 0 && f >= targetFrame);

<Sequence from={transitionFrame}>
  <NextScene />
</Sequence>
```

---

## Audio-Analyse (optional)

```tsx
import { getAudioData, useAudioData } from '@remotion/media-utils';

// Audio-Daten laden
const audioData = useAudioData(staticFile('music.mp3'));

// Amplitude bei aktuellem Frame
if (audioData) {
  const amplitude = audioData.getAmplitude(frame);
  // amplitude: 0-1, kann für dynamische Skalierung genutzt werden
}
```

---

## Genre-typische BPMs

| Genre | BPM-Range | Typisch |
|-------|-----------|---------|
| House | 120-130 | 125 |
| Techno | 130-150 | 140 |
| Drum & Bass | 160-180 | 174 |
| Downtempo | 90-110 | 100 |
| Hip-Hop | 80-100 | 90 |

---

## Qualitäts-Checks

- [ ] BPM korrekt ermittelt
- [ ] Visueller Akzent auf Downbeats
- [ ] Keine Verzoegerung/Drift
- [ ] Audio-Offset beruecksichtigt
- [ ] Transitions auf Beats ausgerichtet
