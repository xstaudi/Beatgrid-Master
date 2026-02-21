# Social Media Performance: Plattform-Optimierung

Optimierung für maximale Performance auf Social Media.

---

## Plattform-Spezifikationen

### Instagram Reels
| Parameter | Wert |
|-----------|------|
| Aspect Ratio | 9:16 |
| Resolution | 1080x1920 |
| Max Duration | 90s |
| Optimal Duration | 15-30s |
| Safe Zone | 250px oben/unten |
| Text Size Min | 48px |

### TikTok
| Parameter | Wert |
|-----------|------|
| Aspect Ratio | 9:16 |
| Resolution | 1080x1920 |
| Optimal Duration | 21-34s |
| Safe Zone | 300px oben, 200px unten |
| Text Size Min | 48px |

### YouTube Shorts
| Parameter | Wert |
|-----------|------|
| Aspect Ratio | 9:16 |
| Resolution | 1080x1920 |
| Max Duration | 60s |
| Safe Zone | 200px oben/unten |
| Text Size Min | 42px |

### Landingpage (16:9)
| Parameter | Wert |
|-----------|------|
| Aspect Ratio | 16:9 |
| Resolution | 1920x1080 |
| Duration | Unbegrenzt |
| Auto-Play | Muted |
| Loop | Ja |

---

## Safe Zones

```
┌─────────────────────────┐
│      SAFE ZONE          │  ← 250-300px (UI-Elemente)
│      (nicht hier)       │
├─────────────────────────┤
│                         │
│                         │
│      CONTENT ZONE       │  ← Hauptinhalt hier
│                         │
│                         │
├─────────────────────────┤
│      SAFE ZONE          │  ← 150-250px (Captions, UI)
│      (nicht hier)       │
└─────────────────────────┘
```

---

## Text-Regeln für Mobile

### Mindestgrößen
| Text-Typ | Min Size | Empfohlen |
|----------|----------|-----------|
| Headline | 48px | 64-80px |
| Body | 32px | 40-48px |
| Caption | 24px | 32px |

### Lesbarkeit
- **Kontrast:** Min 4.5:1 (WCAG AA)
- **Hintergrund:** Immer mit Overlay wenn auf Bild
- **Dauer:** Min 2s pro Text-Block

---

## Loop-Optimierung

**Für Landingpage/Loop-Videos:**

```
Letzter Frame ≈ Erster Frame
Sanfter Übergang (kein harter Cut)
CTA bleibt waehrend Loop sichtbar
```

---

## Engagement-Trigger

### Für Algorithmus-Boost
| Trigger | Wirkung |
|---------|---------|
| Hook <3s | Retention steigt |
| Text-Overlays | Accessibility + Watch Time |
| Motion im Thumbnail | Scrollstopper |
| Loop-Point | Re-watches |

### Für User-Aktion
| Trigger | Platzierung |
|---------|-------------|
| CTA | Letzte 5-10s |
| Swipe-Up Hinweis | Letzte 3s |
| "Save für später" | Mitte des Videos |

---

## Thumbnail-Optimierung

**Automatisch generiert aus erstem Frame!**

- Hook-Frame muss Thumbnail-tauglich sein
- Text lesbar auch in kleiner Vorschau
- Keine Überlappung mit Play-Button (Mitte)

---

## Audio-Hinweise

| Plattform | Audio-Status |
|-----------|--------------|
| Instagram | Meist mit Sound |
| TikTok | Meist mit Sound |
| LinkedIn | Meist muted |
| Landingpage | Immer muted (Autoplay) |

**Regel:** Video muss auch ohne Ton funktionieren (Untertitel/Text).

---

## Performance-Metriken

| Metrik | Ziel | Bedeutung |
|--------|------|-----------|
| 3s View Rate | >70% | Hook funktioniert |
| Watch Time | >50% | Content relevant |
| Completion Rate | >30% | Story spannend |
| Save Rate | >2% | Wert für User |

---

## Checkliste vor Upload

- [ ] Aspect Ratio korrekt (9:16 oder 16:9)
- [ ] Safe Zones eingehalten
- [ ] Text min. 48px (Mobile)
- [ ] Kontrast ausreichend (4.5:1)
- [ ] Hook in ersten 3s
- [ ] CTA in letzten 5-10s
- [ ] Funktioniert ohne Ton
- [ ] Thumbnail-Frame ansprechend
