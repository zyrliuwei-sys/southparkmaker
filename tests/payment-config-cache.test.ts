import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

const directory = await mkdtemp(
  join(tmpdir(), 'southparkmaker-stripe-config-')
);
Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'isolated-payment-config-test-not-a-real-credential',
  NODE_ENV: 'test',
  VITE_APP_URL: 'http://localhost:3000',
});
execFileSync(
  process.execPath,
  [
    'node_modules/drizzle-kit/bin.cjs',
    'push',
    '--dialect=sqlite',
    '--schema=./src/config/db/schema.sqlite.ts',
    `--url=${process.env.DATABASE_URL}`,
    '--force',
  ],
  { stdio: 'pipe', env: process.env }
);
const { saveConfigs } = await import('../src/modules/config/service');
const { handleWebhook } = await import('../src/modules/payment/service');
const { WebhookIgnoredError } = await import('../src/core/payment/types');
after(async () => rm(directory, { recursive: true, force: true }));
function signed(secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    id: 'evt_isolated',
    object: 'event',
    type: 'isolated.unknown',
    data: { object: {} },
    livemode: false,
    created: now,
  });
  const hash = createHmac('sha256', secret)
    .update(`${now}.${body}`)
    .digest('hex');
  return new Request('http://localhost:3000/api/payment/notify/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': `t=${now},v1=${hash}` },
  });
}
test('saving a Stripe webhook secret refreshes an existing manager without changing the API key', async () => {
  await saveConfigs({
    stripe_secret_key: 'sk_test_isolated_not_real',
    stripe_signing_secret: 'whsec_isolated_before',
  });
  await assert.rejects(
    handleWebhook({ req: signed('whsec_isolated_before'), provider: 'stripe' }),
    WebhookIgnoredError
  );
  await saveConfigs({ stripe_signing_secret: 'whsec_isolated_after' });
  await assert.rejects(
    handleWebhook({ req: signed('whsec_isolated_after'), provider: 'stripe' }),
    WebhookIgnoredError
  );
  await assert.rejects(
    handleWebhook({ req: signed('whsec_isolated_before'), provider: 'stripe' }),
    (error) => !(error instanceof WebhookIgnoredError)
  );
});
