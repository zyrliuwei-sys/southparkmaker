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

## Product-copy cleanup — 2026-11-15

- Removed no-cost promotional claims from the English message catalog, SEO titles/descriptions, homepage and pricing FAQs, studio notices, account labels, policies and the API's unavailable response. Questions were rewritten around account requirements, creation methods and AI credits.
- Updated production/development public descriptions, re-exported the 1200 × 630 share card and the brand board, and refreshed the portable brand ZIP. License text and technical compatibility identifiers were preserved.
- Existing English-only, product-copy and character checks: 17 passed. TypeScript, normal production build, Workers build, formatting and whitespace checks passed. No pricing, credit, account or database behavior changed.
- Released the approved version `d7f9431a-7f7e-47ba-a33a-a024542485c2` to southparkmaker.com. In Tabbit, ten public/authentication page views contained no old claims in rendered copy or metadata; both LLM discovery files were clear, and the published share card matched the new export's SHA-256. The site's public configuration description also contained no old claim.

## 2026-11-15 — Photo conversion and richer character creation

- Implemented SeeAPI Seedream 5.5 image-to-image using one uploaded JPEG/PNG/WebP (3 MiB limit). The prompt can be empty in photo mode; the server supplies the transformation instruction. Resolution prices remain server-owned: 15 / 15 / 26 credits.
- Private reference storage uses an opaque 256-bit capability with a one-hour read window, no-store/noindex headers, terminal-task cleanup, and a one-day R2 lifecycle backstop. No reference bytes are saved in task metadata. The Privacy Policy distinguishes our cleanup from the provider's retention.
- Regression coverage includes ownership and origin checks, mismatched/oversized photo rejection, real atomic credit reservation/refund, concurrent reservation and refund behavior, ambiguous request recovery, stable reference/prompt/idempotency key reuse, and actual workerd request compatibility.
- Tabbit local checks: three-person cast limit, layered accessories, pose editing, local scene save, PNG and SVG export, and example deep links. A controlled UI-only response verified image-only submission with an empty prompt at 1K; this is not evidence of a real provider generation. Mobile photo mode was checked at 390 CSS px with no horizontal document overflow.
- Homepage and pricing DOM now contain one `realisticai.io` link and one `WTAI Navigation` link each, with no hidden marquee clones. Saved link settings were preserved.
- Added three manual-editor before/after cases, each opening the actual options and serving genuine 1024 × 1024 PNG and matching self-contained SVG downloads. Existing photo-style illustrations remain explicitly labeled until replaced by verified product outputs.
- TypeScript and 35 regression tests passed; an additional exported-asset check covers the published download signatures, dimensions, and matching SVG options. Production and Workers builds are prepared before release. Live photo-provider verification is recorded below.

### Live photo conversion verification — 2026-11-15

User approved production deployment and a single 45-credit QA grant. The grant used the existing administrator session, the dedicated credits operation, an explicit QA description, and stable idempotency key. Starting and final account balances were both zero.

| Case           | Actual task                            | Input / settings                                           | Status  | Credits | Temporary original after completion |
| -------------- | -------------------------------------- | ---------------------------------------------------------- | ------- | ------- | ----------------------------------- |
| Purple glasses | `23eb186c-ef84-44db-96b0-399507ffd97c` | One JPEG; no extra description; 1K, 3:4                    | success | 15      | HTTP 404                            |
| Yellow beanie  | `1798c0ff-e530-414c-a0a1-497db4daaa09` | One JPEG; keep yellow beanie and dark jacket; 1K, 3:4      | success | 15      | HTTP 404                            |
| Orange jacket  | `393d6d15-6c3b-4a2b-a7d4-45838a04cf76` | One JPEG; keep glasses, long curls and orange top; 1K, 3:4 | success | 15      | HTTP 404                            |

- All three actual outputs are 864 × 1152 PNGs. The public sample downloads contain the original provider bytes. Smaller JPEG previews were made from those outputs for the homepage; previous style illustrations have been replaced.
- Detected provider CDN CORS restrictions during the first real download. Added an authenticated, owner-checked download endpoint that only fetches the task's stored asset on an allow-listed provider CDN, rejects redirects and SVG, caps response size, and returns a no-store attachment. Real downloads returned HTTP 200 with `image/png`; the generator button was also verified after the balance reached zero.
- Added ownership, host/URL, redirect, MIME and attachment regression tests. Downloads use no provider credentials or forwarded browser cookies upstream. The client allows up to 60 seconds for an image transfer, with the original-image link available as a fallback.
- Each live original was checked after success and returned 404 well before its one-hour access window expired. The private R2 bucket's one-day lifecycle rule was independently confirmed enabled.
- Fixed narrow result-caption wrapping found at 390 CSS px. Added settings disclosure, exact extra prompts and actual PNG links alongside each homepage photo example.

Final release `b500e856-0644-4b3c-a753-5d15b25a919c` verified in Tabbit: homepage shows all three real transformations; each public PNG link returns 200; the yellow-beanie settings link opens photo mode with the exact prompt, 1K resolution and 3:4 ratio. Homepage and pricing each expose one Realistic AI and one WTAI Navigation link. The final authenticated credit balance is zero. The caption fix was checked at 390 CSS px with all controls inside its bounds. All 38 regression tests, TypeScript, and Node/Workers production builds passed.

### Showcase restoration requested by the user — 2026-11-15

Restored the original three comparison JPGs byte for byte from the pre-change revision, together with the original labels, captions, section layout and styling. Removed the added per-case provenance/settings/download controls from this section and restored its style-study wording. The photo-upload generator, billing, private input cleanup, authenticated result downloads, richer manual editor, and footer deduplication remain in place. The three actual QA PNG outputs are retained as archived artifacts, and are no longer presented by the restored showcase as its displayed images.

Restoration release `99161836-6693-432a-a2d6-075dcc50a274` is live. Tabbit confirmed all three original 1122 × 1402 illustrations, original comparison labels, and no added per-case controls or banners. The photo-generation capability remains enabled. Production build and TypeScript checks passed.
