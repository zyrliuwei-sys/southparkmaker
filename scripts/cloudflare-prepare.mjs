import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Workers Builds has no local .env.production or ignored wrangler.jsonc.
// Reconstruct only public deployment configuration; runtime secrets stay in
// Cloudflare and encrypted provider settings stay in the existing D1 database.
export function cloudflareConfig(env) {
  function required(name, pattern) {
    const value = env[name]?.trim();
    if (!value || !pattern.test(value)) {
      throw new Error(`Missing or invalid Cloudflare build variable: ${name}`);
    }
    return value;
  }

  const accountId = required('CLOUDFLARE_ACCOUNT_ID', /^[a-f0-9]{32}$/i);
  const databaseId = required(
    'CF_D1_DATABASE_ID',
    /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i
  );
  const workerName = required('CF_WORKER_NAME', /^[a-z0-9][a-z0-9-]{0,62}$/);
  const databaseName = required(
    'CF_D1_DATABASE_NAME',
    /^[a-z0-9][a-z0-9_-]{0,62}$/
  );
  const appUrl = new URL(env.VITE_APP_URL || '');
  if (
    appUrl.protocol !== 'https:' ||
    appUrl.username ||
    appUrl.password ||
    appUrl.port ||
    appUrl.pathname !== '/' ||
    appUrl.search ||
    appUrl.hash ||
    !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(appUrl.hostname)
  ) {
    throw new Error('VITE_APP_URL must be a public HTTPS origin');
  }
  const appName = env.VITE_APP_NAME?.trim();
  if (!appName || appName.length > 100) {
    throw new Error(
      'Missing or invalid Cloudflare build variable: VITE_APP_NAME'
    );
  }

  return {
    $schema: 'node_modules/wrangler/config-schema.json',
    name: workerName,
    account_id: accountId,
    compatibility_date: '2026-10-01',
    compatibility_flags: ['nodejs_compat'],
    observability: { enabled: true },
    routes: [{ pattern: appUrl.hostname, custom_domain: true }],
    vars: {
      DATABASE_PROVIDER: 'd1',
      VITE_APP_URL: appUrl.origin,
      VITE_APP_NAME: appName,
      AUTH_URL: appUrl.origin,
    },
    d1_databases: [
      {
        binding: 'DB',
        database_name: databaseName,
        database_id: databaseId,
        migrations_dir: 'drizzle',
        remote: true,
      },
    ],
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const config = cloudflareConfig(process.env);
  writeFileSync('wrangler.jsonc', `${JSON.stringify(config, null, 2)}\n`);
  console.log(
    `Prepared Cloudflare configuration for ${config.name} (${config.routes[0].pattern})`
  );
}
