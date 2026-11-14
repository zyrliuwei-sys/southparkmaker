import assert from 'node:assert/strict';
import test from 'node:test';

import { cloudflareConfig } from '../scripts/cloudflare-prepare.mjs';

const env = {
  CLOUDFLARE_ACCOUNT_ID: '0'.repeat(32),
  CF_WORKER_NAME: 'example-worker',
  CF_D1_DATABASE_NAME: 'example-db',
  CF_D1_DATABASE_ID: '00000000-0000-0000-0000-000000000000',
  VITE_APP_URL: 'https://example.com',
  VITE_APP_NAME: 'Example',
  AUTH_SECRET: 'must-not-be-copied',
  CONFIG_ENCRYPTION_KEY: 'must-not-be-copied',
};

test('clean-checkout config preserves D1 and custom domain without embedding secrets', () => {
  const config = cloudflareConfig(env);
  assert.equal(config.d1_databases[0].database_id, env.CF_D1_DATABASE_ID);
  assert.equal(config.vars.DATABASE_PROVIDER, 'd1');
  assert.equal(config.vars.AUTH_URL, env.VITE_APP_URL);
  assert.deepEqual(config.routes, [
    { pattern: 'example.com', custom_domain: true },
  ]);
  assert.ok(!JSON.stringify(config).includes('must-not-be-copied'));
});

test('incomplete build configuration fails before writing or deploying', () => {
  for (const key of [
    'CLOUDFLARE_ACCOUNT_ID',
    'CF_D1_DATABASE_ID',
    'CF_WORKER_NAME',
    'CF_D1_DATABASE_NAME',
    'VITE_APP_NAME',
  ]) {
    assert.throws(() => cloudflareConfig({ ...env, [key]: '' }));
  }
});

test('rejects development, credential-bearing, and path URLs', () => {
  for (const url of [
    'http://localhost:3000',
    'https://user:password@example.com',
    'https://example.com/app',
    'https://example.com?token=x',
    'https://127.0.0.1',
  ]) {
    assert.throws(() => cloudflareConfig({ ...env, VITE_APP_URL: url }));
  }
});
