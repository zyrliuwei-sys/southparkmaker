# Cloudflare Workers deployment

Production uses the `zyrliuwei-sys/southparkmaker` GitHub repository, branch
`main`, Worker `southparkmaker`, and <https://southparkmaker.com>.
The existing D1 database and R2 bucket are both named `southparkmaker`.

## Workers Builds

Connect the repository to this Worker in Cloudflare Settings → Builds.
Enable automatic builds for `main` and disable non-production branch deployments.
Use repository root `/`, build command `pnpm cf:prepare`, and deploy command
`pnpm cf:deploy`. Set these **build variables** in Cloudflare:

| Variable                | Value                                         |
| ----------------------- | --------------------------------------------- |
| `NODE_VERSION`          | `24.14.1`                                     |
| `PNPM_VERSION`          | `11.15.1`                                     |
| `CLOUDFLARE_ACCOUNT_ID` | Account containing the existing Worker and D1 |
| `CF_WORKER_NAME`        | `southparkmaker`                              |
| `CF_D1_DATABASE_NAME`   | `southparkmaker`                              |
| `CF_D1_DATABASE_ID`     | Existing D1 database UUID from Cloudflare     |
| `VITE_APP_URL`          | `https://southparkmaker.com`                  |
| `VITE_APP_NAME`         | `southparkmaker`                              |
| `DATABASE_PROVIDER`     | `d1`                                          |

`cf:prepare` creates the ignored `wrangler.jsonc` from those public settings.
`cf:deploy` builds the application using Nitro's `cloudflare_module` preset and
deploys the generated Worker. It supports a clean GitHub checkout without local
environment files. Build variables and Worker runtime secrets are separate.

Keep `AUTH_SECRET` and `CONFIG_ENCRYPTION_KEY` as encrypted **Worker secrets**.
Preserve their existing values: rotating the encryption key would make the
provider settings already stored in D1 unreadable. Provider keys belong in the
admin panel and are not committed to GitHub or exposed as build variables.

After this connection is enabled, commit and push code to `main` to deploy it.
Saving a local file alone does not trigger Cloudflare. Check the build status in
the Worker's Builds page and the deployed revision in Deployments.

## Database changes

Code deployments reuse D1 and never reset, seed, or migrate the database.
For schema changes, generate production SQL, review it, then apply the reviewed
migration before deploying code that needs it. Do not run `db:push` against
production. Initial admin roles, accounts, and encrypted settings already exist.

## Local deployment

Keep `.env.production` and `wrangler.jsonc` local and ignored. Use
`pnpm cf:deploy` after reviewing the production target. Do not edit or commit
generated files under `.output/`, `.wrangler/`, or `src/config/db/schema.ts`.
The Docker workflow is independent of Workers Builds.
