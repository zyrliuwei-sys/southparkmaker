# IndexNow Workers compatibility fix

Date: 2026-11-14. Target: https://southparkmaker.com/admin/indexnow.

The existing Tabbit page showed a valid, reachable ownership file and an enabled sitemap button, but all three search-engine attempts had status 0. The public site origin and administrator permissions were correct.

The request used `redirect: 'error'`. Cloudflare Workers accepts only `follow` and `manual`; the unsupported value throws before an outbound request is sent. A local workerd reproduction confirmed the error and confirmed that `manual` successfully sent the same request. See [Cloudflare's Request documentation](https://developers.cloudflare.com/workers/runtime-apis/request/#parameters).

IndexNow now uses manual redirect handling. The fixed endpoint list, same-host URL validation, timeout, permissions and rate limits remain intact. Redirect targets are never followed. The result heading now says “Submission results for … URLs” so failed requests are not presented as sent. The portable installer contains the same fix.

The same unsupported setting was corrected in SeeAPI's task requests and read-only credential check. Real workerd tests verify successful outbound requests and rejection of redirects without forwarding credentials. Those tests intercept all outbound calls locally: no paid generation, real credential or production database is used.

Validation passed: 19 IndexNow/installer/workerd tests, 11 SeeAPI/settings/pricing tests, TypeScript, formatting, whitespace checks, normal production build, Workers build and Wrangler's deployment dry run. Release preparation used an isolated checkout; database bindings and production URLs were preserved. No schema, key, role, price or account changes are included.

After the user's deployment confirmation, the fix was released through `pnpm run cf:deploy` to the existing custom domain. Deployed version: `9d9b4bca-3e6d-4815-9450-05d7fd8813d2`.

A native click on “Submit all sitemap URLs” in the user's existing Tabbit admin tab submitted six URLs. The authenticated API returned HTTP 200 with `ok: true`. Recorded engine attempts:

| Engine           | Status | Outcome                          |
| ---------------- | ------ | -------------------------------- |
| api.indexnow.org | 429    | Rate limited                     |
| www.bing.com     | 429    | Rate limited                     |
| yandex.com       | 202    | Accepted, key validation pending |

No additional live submission was made after this accepted response. Participating search engines share submitted URLs under the [IndexNow protocol](https://www.indexnow.org/documentation); acceptance does not promise immediate indexing. The UI displayed the new neutral heading and the actual engine statuses.

Post-release checks in Tabbit returned HTTP 200 for the homepage, public configuration API and sitemap. The homepage contained the product content, public settings loaded successfully and the sitemap contained six URLs. The user's existing IndexNow tab was retained with the actual submission results visible.
