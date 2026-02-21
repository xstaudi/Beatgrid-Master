---
name: tailwind-patterns
description: Tailwind CSS v4 patterns. CSS-first config, container queries, design tokens.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Tailwind CSS v4 Patterns

## v4 vs v3

| v3 (Legacy) | v4 (Current) |
|-------------|--------------|
| `tailwind.config.js` | CSS `@theme` directive |
| PostCSS plugin | Oxide engine (10x faster) |
| `@apply` heavy | Components bevorzugt |

## CSS-Based Configuration

```css
@theme {
  --color-primary: oklch(0.7 0.15 250);
  --color-surface: oklch(0.98 0 0);
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

## Responsive Design

| Prefix | Min Width | Target |
|--------|-----------|--------|
| (none) | 0px | Mobile-first base |
| `sm:` | 640px | Large phone |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Laptop |
| `xl:` | 1280px | Desktop |

**Pattern:** `w-full md:w-1/2 lg:w-1/3`

## Container Queries (v4)

| Pattern | Verwendung |
|---------|------------|
| `@container` | Parent definieren |
| `@sm:`, `@md:` | Child responsive zu Parent |

**Nutzen:** Komponenten reagieren auf Container, nicht Viewport.

## Dark Mode

```html
<div class="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
```

## Layout Patterns

| Pattern | Classes |
|---------|---------|
| Center | `flex items-center justify-center` |
| Stack | `flex flex-col gap-4` |
| Row | `flex gap-4` |
| Space between | `flex justify-between items-center` |
| Auto-fit Grid | `grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]` |

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Arbitrary values überall | Design system scale nutzen |
| `!important` | Specificity fixen |
| `@apply` heavy | Components extrahieren |
| v3 config mit v4 mischen | Vollständig migrieren |

## Component Extraction

**Wann extrahieren:**
- Gleiche Klassen 3+ mal
- Komplexe State-Varianten
- Design-System-Element

**Wie:** React/Vue Component > `@apply` in CSS
