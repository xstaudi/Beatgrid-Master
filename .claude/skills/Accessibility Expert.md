---
name: accessibility-expert
description: WCAG 2.1 AA Accessibility. Verwenden bei ARIA, Keyboard-Navigation, Screen Reader, Fokus-Management, Kontrast, Touch-Targets, Semantisches HTML.
allowed-tools: Read, Grep, Glob, Edit
---

# Accessibility Expert

## Wann aktiv

Bei ARIA, Keyboard, Focus, Screen Reader, Kontrast, Touch-Targets.

---

## WCAG 2.1 AA Checkliste

### Perceivable
- [ ] Bilder haben alt-Text
- [ ] Kontrast >= 4.5:1 (Text), >= 3:1 (UI)
- [ ] Info nicht nur durch Farbe

### Operable
- [ ] Alles per Tastatur erreichbar
- [ ] Fokus sichtbar
- [ ] Keine Keyboard-Traps
- [ ] Touch-Targets >= 44x44px

### Understandable
- [ ] Labels für alle Inputs
- [ ] Fehlermeldungen hilfreich
- [ ] `lang` auf html-Element

### Robust
- [ ] Valides HTML
- [ ] ARIA korrekt

---

## Keyboard Navigation

| Key | Aktion |
|-----|--------|
| Tab | Nächstes Element |
| Shift+Tab | Vorheriges |
| Enter/Space | Aktivieren |
| Escape | Schliessen |
| Arrows | In Listen/Menus |

---

## ARIA Quick Reference

### Landmarks
```html
<header role="banner">
<nav role="navigation">
<main role="main">
<footer role="contentinfo">
```

### Interactive
```tsx
// Button mit Toggle
<button aria-expanded="false" aria-controls="menu">

// Modal
<div role="dialog" aria-modal="true" aria-labelledby="title">

// Live Region
<div aria-live="polite">{status}</div>
```

### Forms
```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">{error}</span>
```

---

## Focus Management

```tsx
// Modal: Focus auf erstes Element
useEffect(() => {
  firstElement?.focus();
  return () => previousElement?.focus();
}, []);

// Skip Link
<a href="#main" className="sr-only focus:not-sr-only">
  Zum Inhalt
</a>
```

---

## Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}
```

---

## Common Fixes

```tsx
// ❌ Klickbares div
<div onClick={...}>

// ✅ Button
<button onClick={...}>

// ❌ Nur Placeholder
<input placeholder="Email">

// ✅ Label + Input
<label htmlFor="x">Email</label>
<input id="x">

// ❌ Unsichtbarer Fokus
outline: none

// ✅ Sichtbarer Fokus
focus:ring-2 focus:ring-offset-2
```

---

## Testing

1. Nur Tastatur verwenden
2. Browser-Zoom 200%
3. Screen Reader (NVDA/VoiceOver)
4. axe DevTools Extension
5. Lighthouse Accessibility

---

## Checkliste

- [ ] Semantisches HTML
- [ ] Fokus-States sichtbar
- [ ] Labels für alle Inputs
- [ ] Alt-Text für Bilder
- [ ] Kontrast geprüft
- [ ] Keyboard-navigierbar
- [ ] ARIA korrekt
