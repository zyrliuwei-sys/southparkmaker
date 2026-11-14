# SeeAPI admin settings — portable patch

Adds **Admin → Settings → AI → SeeAPI** using the same settings cards, Save
button and Test dialog as OpenAI and Anthropic. All interface copy is English.

## Apply to another project

This patch targets this TanStack Start engine and its existing config system.
Copy this directory to the other project, then run from that project's root:

```sh
# Back up the target project's source and uncommitted changes first.
git apply --check /absolute/path/to/seeapi-settings/seeapi-settings.patch
git apply /absolute/path/to/seeapi-settings/seeapi-settings.patch
pnpm build
pnpm exec tsc --noEmit
node --import tsx --test tests/seeapi-settings.test.ts
```

The patch contains only the SeeAPI additions, including an isolated regression
test. It does not copy this project's branding, environment files, database,
credentials or other pending changes. No dependencies, schema changes or new
permission codes are required. Do not force a failed patch check: port the
small additions listed below while keeping the destination's own settings.

## Manual port map

| File                                        | Addition                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/modules/config/settings.ts`            | `seeapi` group in the AI tab; `seeapi_base_url` text field and `seeapi_api_key` password field |
| `src/modules/config/service.ts`             | `seeapi_base_url: ['seeapi_api_key']` in `ENDPOINT_SECRETS`                                    |
| `src/modules/config/settings-test-specs.ts` | `seeapi: { group: 'seeapi', fields: [] }`                                                      |
| `src/modules/config/settings-test.ts`       | Import `testSeeAPI` and dispatch the `seeapi` case to it                                       |
| `src/modules/config/seeapi-test.ts`         | Server-only read-only credential test                                                          |
| `messages/en.json`                          | Six `admin.settings.*seeapi*` group, field and help messages                                   |
| `tests/seeapi-settings.test.ts`             | Encryption, masking, endpoint-change and request tests using temporary SQLite                  |

The destination must already support `getSettings()`, `saveConfigs()`, masked
password round trips, `assertEndpointSecretsResupplied()` in both Save and Test,
and the generic `SettingsTestDialog`. Older versions or other frameworks need
equivalent integration; this patch does not add those shared mechanisms.

## Configure and use

1. Rebuild or restart the destination app to regenerate Paraglide messages.
2. Open **Admin → Settings → AI → SeeAPI**.
3. Leave Base URL blank for `https://api.seeapi.com`, or enter an HTTPS API
   root without `/v1`. Create an API key at
   [SeeAPI API Keys](https://www.seeapi.com/keys/?tab=api-keys).
4. Paste the complete key, then click **Save**. Saved keys are returned masked;
   at-rest encryption uses the existing `CONFIG_ENCRYPTION_KEY` setting.
5. Click **Test → Run Test**. The test uses current form values, including
   unsaved edits, and calls `GET /v1/credits` with Bearer authentication. It
   creates no generation task. Changing an existing endpoint requires
   re-entering the key for both saving and testing.

Settings are database-backed and admin-panel-only, matching the existing
OpenAI/Anthropic approach. In server-side product flows, read
`seeapi_api_key` and `seeapi_base_url` from `getAllConfigs()`; use
`https://api.seeapi.com` when the base is blank. Keep these values on the
server. This feature does not change the product's active generation provider
or implement image/video generation.

Official reference: [SeeAPI Authentication](https://www.seeapi.com/docs/authentication/).
It documents the API root, Bearer header and read-only credit balance check.

## Roll back this patch

Before making additional edits to its files, check and reverse the patch:

```sh
git apply --reverse --check /absolute/path/to/seeapi-settings/seeapi-settings.patch
git apply --reverse /absolute/path/to/seeapi-settings/seeapi-settings.patch
pnpm build
```

Reversing source changes leaves any saved config rows in the database. Remove
the project's SeeAPI credentials through its admin panel before removing the
settings if you also want to discard them. Keep each project's credentials
separate; never include them in a migration bundle.
