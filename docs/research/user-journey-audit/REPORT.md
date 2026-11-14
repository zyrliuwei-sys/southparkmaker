# Ordinary-user journey audit

Date: 2026-11-14. Target: the local southparkmaker application at http://localhost:3000. The review uses actual browser navigation and clicks, source-copy inspection and focused regression checks.

## Confirmed fixes

| Finding                                                                                          | Result                                                                               | Evidence                                            |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Switching from the builder to AI and back discarded the edited character                         | The manual workbench stays mounted across mode changes                               | `mode-switch-before.json`, `mode-switch-after.json` |
| An AI draft also needed to survive a return to the builder                                       | Prompt, resolution and aspect ratio remain intact in the opened AI panel             | `mode-switch-after.json`                            |
| Photo examples implied an input unsupported by the active text-only provider                     | Capability-aware examples, FAQ and actions clearly explain text-only creation        | Homepage and AI copy                                |
| Anonymous AI instructions incorrectly said sign-in was required to edit a prompt or add a photo  | Instructions match the editable text-first workflow and preserve settings at sign-in | AI form and account-return tests                    |
| Checkout availability was only revealed after a purchase click                                   | Plans show an availability notice and disabled purchase actions before sign-in       | Pricing availability checks                         |
| The generator let a zero-balance user attempt generation before learning the shortfall           | The selected resolution's missing credits are shown before submission                | Credit readiness regression tests                   |
| Overview stayed highlighted on every account child page                                          | Root matching is exact; the current link has `aria-current`                          | Sidebar review                                      |
| Sidebar links contained nested buttons and mobile navigation did not close the drawer            | Each destination is one link; mobile links close the drawer                          | Sidebar browser checks                              |
| The mobile account trigger was 28px and its header omitted the brand                             | The trigger is 44px and the brand is visible                                         | Mobile account review                               |
| Account pages used indistinguishable browser titles                                              | Each user page has a specific title and noindex metadata                             | Page inventory                                      |
| Form errors were not associated with their inputs; validation used developer-style defaults      | Unique control IDs, linked error messages and direct English guidance                | Registration errors and accessibility scan          |
| Sign-in help discarded the pending destination; verification double-decoded nested prompt values | Validated return parameters survive help/recovery and retain encoded prompt content  | Return-query tests and browser flow                 |
| Disabled password recovery still promised to send an email                                       | The unavailable state provides support contact and a route back to sign-in           | Password-help review                                |
| Registration's brand panel told the user to sign in                                              | Sign-up has its own account-creation copy                                            | Registration page                                   |
| Authentication pages omitted useful policy and free-builder links                                | Policies open in labeled new tabs; the free studio and sign-in help remain available | `auth-policy-links.json`                            |
| Missing/error pages offered weak recovery                                                        | Branded recovery pages provide clear actions                                         | `404-after.json`                                    |
| Blog copy referred to generic engineering notes and its empty state was a dead end               | Character-specific copy links to the studio and existing guide                       | `blog-after.json`                                   |
| Credits exposed ledger terminology and displayed a consume row's zero as remaining value         | User-facing added/used/source labels and per-grant unused amounts                    | Credit-history review                               |
| Account failures could appear as zero/empty data or an endless profile loader                    | Error states and refresh actions distinguish unavailable data                        | Failure-recovery checks                             |
| Disabled guest-post loading briefly exposed the paid-content workflow                            | Loading and closed states precede any offer; the free studio is a clear alternative  | `guest-post-after.json`                             |

## Confirmed hands-on checks

- All six gallery character links opened the matching preset (`gallery-links.json`).
- All 43 character option buttons updated their selected state (`builder-controls.json`).
- A browser save loaded the same SVG character again. The original local saved-design storage value was restored after this test (`save-downloads.json`).
- Actual PNG and SVG downloads completed. PNG metadata is 1024 × 1024 RGBA with an alpha channel.
- The footer's distinct navigation targets and policy cross-reference were clicked. The contact mailto address was inspected without sending a message.
- Nine signed-out protected destinations, including the user center and `/admin`, redirected to sign-in with the correct return path (`anonymous-guards.json`).
- Empty verification/invite links return to sign-in; an empty auth callback returns home. An invalid password-reset link provides a recovery route.
- Sign-in desktop accessibility scan reported zero automated violations. The new-ticket dialog also passed its scan and was closed without submitting (`ticket-create-dialog.json`). This is not a complete accessibility certification.

## Scope and external actions

The ordinary-user surface includes public pages, authentication and recovery routes, the manual/AI studios, pricing, account pages and disabled-feature/invalid-link states. Administrator management writes, account creation, password changes, support-message submission, purchases and new paid inference are not performed by this audit. No secret configuration is exported. Payment collection and email password recovery remain disabled; their interfaces now explain the available alternatives.

## Final verification

- The final inventory covers 31 distinct internal targets, including public navigation, preset/deep links, account destinations and plain-text discovery files. All returned successful HTTP responses after expected authentication redirects; no broken internal target or template/debug-copy finding was detected. This is a distinct-target check, not a claim that duplicate navigation links were separate pages (`link-inventory.json`). Native click tests separately cover the gallery, footer, account navigation, policy popups, support tracking and form recovery links.
- Automated axe WCAG A/AA and best-practice checks reported zero violations on the homepage, both studio modes, pricing, notes, guest-post landing, both legal pages, missing-article recovery, sign-in and six user-center pages. Public scope is `.maker-page`; user-center scope excludes development-tool portals. The homepage's transparent comparison-slider overlay requires manual contrast review; the unchanged opaque text/background pairs pass the contrast measurements in `docs/design-references/v4/contrast-final.json`. This is not a complete WCAG certification.
- Pricing and the AI studio have no horizontal document overflow or controls outside the viewport at 320, 390, 768 and 1440 CSS pixels (`responsive-final.json`). Sign-in, sign-up and the account drawer also received a rendered mobile review.
- 52 focused tests passed, covering characters, provider pricing, credit-cache consistency, safe return paths, English-only copy, product copy and isolated guest-post flows. TypeScript passed. Tests use isolated local data; they do not submit new paid generation or collect payments.
- Both `pnpm build` and `pnpm cf:build` passed on the final source, run sequentially with the development server stopped. Changed-file formatting and `git diff --check` passed. The local development preview was restarted after the builds.

## Additional fixes from final passes

- Disabled guest-post creation no longer displays a template $99 offer. An unavailable existing post shows an error and back link rather than loading forever.
- The support-tracking link closes its modal before opening tickets. The development overlay no longer covers the support button.
- The account shell now has one main landmark. Loading overview links and status filters have meaningful names; selected statuses remain visible.
- Generation reservation and refund completion invalidate both studio and account credit queries, so returning to the user center does not show a stale cached balance or history. A real QueryClient regression test verifies the affected caches and preserves unrelated cached data.
- The canonical `/create` URL returns HTTP 200 without a default query redirect. Both LLM discovery files list the actual studio and product pages with product-specific descriptions.
- Footer column headings no longer skip a heading level on content pages. Signed-in users see an account destination in the mobile public navigation instead of another sign-in link. Ticket attachment links and the reply field have explicit accessible names.

No deployment, database migration, credential change, role change, price change or payment-provider activation was performed by this audit.
