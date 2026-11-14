# Design — southparkmaker

Alpine Studio is the shared visual system for the public site and character studio. This revision refines the established identity rather than rotating brands per page.

## Audience and purpose

People creating an original South Park-inspired avatar. The primary action is to make and export a character; optional AI generation is a clearly priced account workflow.

## Genre and structure

Playful editorial, with the precision of a small design studio. Design variance 8/10, motion 4/10, density 4/10.

- Marketing: a working character stage leads, followed by an asymmetric cast catalogue, practical creation guidance, pricing and questions.
- App: workbench with a stable preview and quiet, grouped controls.
- Content and authentication: readable document or compact form with shared brand typography.
- Navigation: compact studio masthead. Footer: oversized wordmark signature with a short useful index.

## Locked theme

Colors and fonts live in `tokens.css`; every interface color references a token. Product palette swatches and original SVG character colors are actual editable content, not interface theme overrides.

Snow `oklch(0.987 0.005 150)`, Ink `oklch(0.235 0.027 162)`, Forest `oklch(0.39 0.075 162)`, Glacier `oklch(0.914 0.031 228)`. Clay belongs in artwork and small accents. Dark mode retains the forest hue with brighter foregrounds. Use the existing `--mk-on-accent` pair for filled actions.

## Typography and spacing

Display: self-hosted Bricolage Grotesque, 600–750, close tracking. Body: self-hosted Manrope, 400–650. Two font families on product pages. Display titles use fluid sizes; body measure stays near 60–70 characters. A 4px base grid, 16/24/40/64/104px spacing roles, 12px controls and 24px major surfaces.

## Motion

One entrance sequence, responsive character eyes and state changes. Transform and opacity only for movement. No scroll hijacking, custom cursor, ambient loops or invented progress percentages. Reduced motion renders a stable stage and instant controls. Focus is immediate, with a visible outline.

## Interactions and voice

Controls must work with pointer and keyboard, with 44px touch targets. Show visible labels and associate errors with inputs. Selected states have shape or icon cues as well as color. Use direct, specific English copy. Keep the main SEO phrase in the H1 and preserve the substantive character guide. Prices, credit costs and generation claims must match the actual implementation.

## Exports

- CSS tokens: `tokens.css`
- Tailwind v4 and shadcn aliases: `src/styles/globals.css`
- DTCG interchange: `docs/brand/tokens.json`
- Brand board and original assets: `docs/brand/` and `public/brand/`

### Tailwind v4 mapping

```css
@theme inline {
  --color-background: var(--mk-paper);
  --color-foreground: var(--mk-ink);
  --color-primary: var(--mk-accent);
  --color-primary-foreground: var(--mk-on-accent);
  --font-sans: var(--font-body);
}
```

### DTCG mapping

The complete light/dark color and font export is `docs/brand/tokens.json`.

```json
{
  "light": {
    "accent": { "$type": "color", "$value": "oklch(0.39 0.075 162)" },
    "paper": { "$type": "color", "$value": "oklch(0.987 0.005 150)" }
  }
}
```

### shadcn mapping

```css
:root,
.dark {
  --background: var(--mk-paper);
  --foreground: var(--mk-ink);
  --card: var(--mk-white);
  --card-foreground: var(--mk-ink);
  --primary: var(--mk-accent);
  --primary-foreground: var(--mk-on-accent);
  --border: var(--mk-hair);
  --ring: var(--mk-accent);
}
```
