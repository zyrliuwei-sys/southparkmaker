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

## Scope limits (initial version; superseded by revisions below)

- AI needs a Fal API key (text + reference photo) or Replicate token (text only), configured at Admin → Settings → AI.
- AI costs 10 server-controlled credits per request. This build does not invent or grant user credits.
- AI output links are provider-hosted and may expire. The manual builder saves locally and exports files.
- No payment catalog or domain deployment was enabled in this version.

## SeeAPI generation and pricing revision

- Read the official Seedream 5.5 text-to-image, task-detail, and model-pricing documentation. Authenticated `GET /v1/prices?model=seedream-5-5&endpoint=text-to-image` returned the live rule: 4.9 provider credits at 1K/1.5K and 8.5 at 2K.
- The application policy uses the public estimate of $0.0037 per provider credit, an 8× multiplier, and $0.01 per application credit, rounding up to 15 credits at 1K/1.5K or 26 credits at 2K. The server owns this calculation.
- A real browser click submitted one Seedream 5.5 generation through the configured admin key. The image completed successfully at 2048 × 2048. Output and screenshots are saved in `docs/design-references/v3/`.
- The administrator started with zero credits. A clearly labeled 26-credit QA grant funded this single test; the ledger records exactly one 26-credit consumption and the resulting balance is zero. No purchase or paid subscription was created.
- Provider submission uses the stable local task ID as `Idempotency-Key`. Ambiguous transport failures keep the reservation and resume the original request rather than issuing a new provider key or prematurely refunding. Terminal failures use atomic, idempotent credit revocation. Pending tasks can resume after a browser reload.
- One-time packs: $5/500 credits, $15/1,500, $40/4,000, without expiry. Monthly plans: $9/900 credits, $25/2,500, $49/4,900; credits expire at the end of the paid billing period and do not roll over. Both the UI and checkout use the same authoritative catalog. The homepage and `/pricing` include the branded component.
- No payment provider is currently enabled. The purchase buttons show a clear configuration message and do not create an order. Actual checkout/payment collection was not tested or enabled.
- Desktop 1440px, tablet 768px, mobile 390px and dark-mode checks cover the pricing component and generator. The billing switch selects the correct three products. The generator shows the selected resolution's cost; unsupported photo upload is hidden, with a clear message when entering through the photo shortcut.
- Automated checks passed: 14 character/provider/pricing tests, 17 payment tests, 12 settings/English/product-copy tests, and 11 isolated local D1 atomic tests. The D1 test explicitly disables remote bindings. TypeScript, changed-file formatting, `git diff --check`, `pnpm build`, and `pnpm cf:build` passed. No database migration or deployment was performed for this revision.

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

## Craft refinement — award-quality target

This is an internal design and usability review against the requested Awwwards / Webby / FWA quality ambition, not an award result or a third-party certification. The established Alpine Studio identity remains the brand foundation. The public surface, free studio, AI form and pricing share that system.

### Review and revision passes

1. Replaced the static hero composition with an actual character workbench. Outfit colors, expressions and preset selection update the preview; the chosen details carry into the editor. A compact masthead, larger display hierarchy, asymmetric cast catalogue and oversized footer signature give the site a more specific visual structure.
2. Rendered review caught character-hair clipping, awkward mountain caps, excess empty space in the creation-path cards and a delayed mobile primary action. Corrected those issues, shortened the hero description and introduced a compact tablet layout. The cards use an actual editable SVG and a clearly labeled image from the earlier successful Seedream generation.
3. Refined keyboard behavior, visible field labels, linked errors, pricing heading order, skip-link destinations, 44px studio color controls, prompt examples and mobile form typography. Unsupported photo-generation entry is hidden from the hero. AI mode labels the neighboring stage as a builder preview and disables its controls. Prompt, resolution and aspect-ratio values are retained in the sign-in return URL. Direct URL prefill was verified at 1K / portrait (3:4), showing the correct 15-credit cost; no new paid inference was submitted.

### Browser and accessibility evidence

- Inspected the homepage, pricing, manual studio, AI studio and legal page in the real browser. Desktop WCAG A/AA and best-practice axe scans found zero automated violations across those five public surfaces. Scan scope is `.maker-page`, excluding development tool overlays and global portal content.
- Rechecked light/dark treatment, keyboard navigation, Escape/outside-click menu dismissal, focus return and the skip link. Reduced-motion emulation disables entrance motion and responsive pupil movement. The stage's normal pointer movement was verified separately.
- Homepage, pricing and generator were checked at 320, 375, 414 and 768 CSS pixels: no horizontal document overflow or controls outside the viewport. Mobile primary actions and 16px form input text received a separate rendered review. The final homepage width checks include the photo-comparison section added to this checkout during the refinement.
- axe cannot automatically determine contrast where the transparent comparison-slider input overlays the image labels. Those labels were checked manually using their opaque theme-token background/text pairs; results are recorded in `docs/design-references/v4/contrast-final.json`. The avatar-only account trigger has an explicit accessible name. Automated scans alone do not establish complete WCAG conformance.
- The changed character selection opened the editor with the same clay-orange outfit and calm expression. An actual browser download produced a 1024 × 1024 PNG (`docs/design-references/v4/edited-character.png`).
- The canonical `/pricing` URL returns HTTP 200 directly; optional billing selection is preserved without adding a default query-string redirect.
- Final rendered captures, responsive measurements and scan results are in `docs/design-references/v4/`. `design.md` records the shared visual rules; CSS and JSON token exports and the portable brand ZIP were refreshed.

### Internal design critique

Philosophy 4/5: making a character is the first experience. Hierarchy 5/5: one main action and a clear sequence from creation to examples, guidance and pricing. Execution 4/5: reviewed responsive geometry, interaction states, contrast and exports. Specificity 5/5: original editable cast, alpine paper-cut stage and a consistent forest/snow identity. Restraint 4/5: removed redundant navigation, decorative panel labels and excess empty space. Variety 4/5: the workbench, offset cast catalogue, document sections and quiet pricing use distinct rhythms. These are internal review notes, not jury scores.

### Validation

- English-only, product-copy and Seedream pricing/provider tests: 8 passed.
- TypeScript: `tsc --noEmit` passed.
- `pnpm build` and `pnpm cf:build` passed. Changed-file formatting and `git diff --check` passed. The local preview was restarted after sequential builds.
- No database schema, administrator credentials, pricing amounts or payment-provider configuration was changed for this design refinement. No deployment was performed.

## Ordinary-user journey revision — 2026-11-14

- Reviewed public pages, manual/AI creation, auth and recovery, user-center navigation, empty/error states, support dialogs and disabled-feature links through the real browser. The detailed findings and artifacts are in `docs/research/user-journey-audit/REPORT.md`.
- Fixed draft loss between modes, encoded login-return loss, unsupported-photo messaging, unavailable purchase/recovery promises, credit preflight and cached account balances, nested account navigation, mobile drawers, unclear errors, heading landmarks and inaccessible form/filter/link names. Disabled guest-post editor links no longer display a template offer or load forever.
- All 31 distinct current internal navigation/discovery targets resolved. Sixteen inspected page surfaces and the new-ticket dialog had zero automated axe violations; the homepage comparison-overlay contrast remains a documented manual check. The AI/pricing layouts fit 320, 390, 768 and 1440px widths. Gallery presets, all 43 builder choices, saved-design restoration and actual SVG/transparent PNG downloads were verified.
- 52 focused tests, TypeScript, formatting and `git diff --check` passed. Both `pnpm build` and `pnpm cf:build` passed on the final source; the local preview was restarted afterward.
- No schema, credentials, roles, pricing amounts or payment-provider settings were changed. No deployment, new paid generation, purchase, email or support ticket was submitted during this audit. Payment collection and email password recovery remain disabled with clear user-facing explanations.
