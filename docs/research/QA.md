# southparkmaker first-version checks

Date: 2026-11-14. Local preview: http://localhost:3000. Production domain configured for future builds: https://southparkmaker.com. No deployment was performed.

## Functional checks

- Free editor: hairstyle changes visibly update the character.
- Scene selection: transparent background selected and preview checkerboard displayed.
- Browser save: saved successfully; accessible saved-design label reads “Load saved character 1”.
- PNG download: actual browser download completed; file is 1024 × 1024 with an alpha channel.
- Hero: Customize is selected by default and uses real preset previews. Choosing a preset opens the builder.
- Hero keyboard control: ArrowLeft moves focus and selection from Customize to From a photo.
- Text samples populate the prompt field.
- Mobile navigation opens and closes.
- AI: configuration endpoint returned enabled=false, photoEnabled=false, costCredits=10. The interface displays the honest unavailable state and links to the functioning free builder. No paid inference request was made.
- Responsive inspection: 1440px desktop, 768px tablet, and 390px mobile. No horizontal document overflow at these widths. Desktop and mobile screenshots saved in docs/design-references.
- Existing D1 and super administrator were preserved; no schema changes required.

## Automated checks

- tests/characters.test.ts: 9 passed, including isolated real SQLite atomic credit/refund and terminal-state concurrency checks.
- tests/english-only.test.ts and tests/product-copy.test.ts: 5 passed.
- TypeScript: tsc --noEmit passed.
- pnpm build passed. pnpm cf:build passed; a pre-existing percent-encoded path alias was corrected using fileURLToPath so Cloudflare builds also work from this checkout’s Chinese directory name. No deploy command was run.

## Scope limits

- AI needs a Fal API key (text + reference photo) or Replicate token (text only), configured at Admin → Settings → AI.
- AI costs 10 server-controlled credits per request. This build does not invent or grant user credits.
- AI output links are provider-hosted and may expire. The manual builder saves locally and exports files.
- No payment catalog or domain deployment was enabled in this version.

## SEO and brand revision

- Homepage main content contains approximately 1,500 English words (1,516 alphabetic words, including expandable FAQ answers). The primary phrase “South Park character maker” appears five times naturally in the main content.
- Added original character-design guidance, practical use cases, PNG/SVG export guidance, and expanded FAQs. All application copy remains in `messages/en.json`.
- Added page-specific titles, descriptions, canonical URLs, Open Graph/Twitter metadata, a 1200 × 630 share card, WebSite/WebApplication structured data, and studio breadcrumbs. The studio is in the sitemap; authentication pages are noindex.
- Applied the Alpine Studio identity across the homepage, manual/AI studio, authentication, and legal pages: forest green, snow-white surfaces, Bricolage Grotesque display type, Manrope body type, shared controls, and light/dark tokens.
- Desktop/tablet/mobile inspection at 1440px, 768px, and 390px found no horizontal overflow. The mobile homepage headline uses two lines. Each inspected page has one H1.
- Light-mode contrast ratios: body 15.98:1, muted text 5.96:1, primary button 9.04:1. Dark mode: body 16.61:1, muted text 8.87:1, primary button 9.98:1. Keyboard focus and reduced-motion styles are included.
- Live hero presets update the actual character preview and open the chosen character in the studio. The studio canonical excludes search parameters. An actual browser download verified the revised interface still exports a 1024 × 1024 PNG with alpha.
- AI retains its explicit unavailable state until credentials are configured. No paid generation was requested.
- `docs/brand/brand-board.html` and its PNG document the visual system. The portable brand ZIP includes logo variants, editable wordmark, favicon, CSS tokens, share-card source and PNG, original supporting artwork, and the two variable fonts with their licenses. All packaged local references resolve; environment files are excluded.
- English-only/product-copy tests: 5 passed. TypeScript, changed-file formatting, `git diff --check`, `pnpm build`, and `pnpm cf:build` passed. No schema, account, payment, or deployment changes were made for this revision.
