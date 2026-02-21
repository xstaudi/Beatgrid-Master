# Data-Driven Videos: Dynamische Props

Videos mit dynamischen Daten aus der App.

---

## Konzept

Remotion-Videos können Props empfangen, die zur Render-Zeit injiziert werden. Das ermöglicht personalisierte Videos.

---

## Anwendungsfaelle

| Use Case | Props | Beispiel |
|----------|-------|----------|
| Event-Promo | eventName, date, lineup | "TECHNO NIGHT - 15.03.2025" |
| DJ-Profile | djName, genres, bookings | "DJ Shadow - 127 Bookings" |
| Stats-Video | totalEvents, activeUsers | "10.000 Events diesen Monat" |
| Recap | userEvents, favoriteArtists | "Deine 2024 Highlights" |

---

## Zod-Schema Pattern

```tsx
import { z } from 'zod';

// Event-Promo Schema
export const eventPromoSchema = z.object({
  eventName: z.string().min(1).max(50),
  date: z.string(), // ISO Date
  venue: z.string(),
  lineup: z.array(z.string()).max(5),
  ticketPrice: z.number().optional(),
  coverImage: z.string().url().optional(),
});

export type EventPromoProps = z.infer<typeof eventPromoSchema>;
```

---

## Default Props für Studio

```tsx
export const defaultEventPromoProps: EventPromoProps = {
  eventName: 'TECHNO NIGHT',
  date: '2025-03-15T22:00:00Z',
  venue: 'Club XYZ',
  lineup: ['DJ Shadow', 'Amelie Lens', 'Charlotte de Witte'],
  ticketPrice: 25,
};
```

---

## Daten-Quellen

### 1. API-Fetch (vor Render)
```bash
# Props als JSON übergeben
npm run render -- --props='{"eventName":"TECHNO NIGHT"}'
```

### 2. Programmatisch (Node.js)
```typescript
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

// Props aus Datenbank laden
const eventData = await db.query.events.findFirst({ ... });

await renderMedia({
  composition: await selectComposition({ ... }),
  serveUrl: bundled,
  outputLocation: `out/${eventData.id}.mp4`,
  inputProps: {
    eventName: eventData.name,
    date: eventData.date.toISOString(),
    lineup: eventData.lineup.map(a => a.name),
  },
});
```

---

## Komponenten mit dynamischen Daten

```tsx
// EventPromo.tsx
export const EventPromo: React.FC<EventPromoProps> = ({
  eventName,
  date,
  venue,
  lineup,
}) => {
  const frame = useCurrentFrame();
  const formattedDate = new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <h1 style={{
        fontSize: typography.sizes['5xl'],
        color: colors.foreground,
      }}>
        {eventName}
      </h1>

      <p style={{ color: colors.mutedForeground }}>
        {formattedDate} @ {venue}
      </p>

      {lineup.map((artist, i) => (
        <ArtistCard key={artist} name={artist} index={i} />
      ))}
    </AbsoluteFill>
  );
};
```

---

## Bilder/Assets mit Props

```tsx
// Cover-Bild aus URL
const coverImage = props.coverImage || staticFile('default-cover.jpg');

<Img src={coverImage} style={{ width: '100%', height: 'auto' }} />
```

---

## Validation bei Render

```tsx
// In Composition
export const EventPromo: React.FC<unknown> = (props) => {
  // Zod validiert zur Runtime
  const validatedProps = eventPromoSchema.parse(props);

  return <EventPromoContent {...validatedProps} />;
};
```

---

## Batch-Rendering

```typescript
// Mehrere Videos mit unterschiedlichen Props
const events = await db.query.events.findMany({ limit: 10 });

for (const event of events) {
  await renderMedia({
    // ...
    outputLocation: `out/event-${event.id}.mp4`,
    inputProps: {
      eventName: event.name,
      date: event.date.toISOString(),
      // ...
    },
  });
}
```

---

## Qualitäts-Checks

- [ ] Zod-Schema für alle Props
- [ ] Default-Props für Studio-Preview
- [ ] Validation bei ungültigen Daten
- [ ] Fallbacks für optionale Props
- [ ] Max-Laengen für Texte (Overflow vermeiden)
