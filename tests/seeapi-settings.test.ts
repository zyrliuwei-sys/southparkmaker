import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { eq } from 'drizzle-orm';

const directory = await mkdtemp(join(tmpdir(), 'seeapi-settings-test-'));
Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  CONFIG_ENCRYPTION_KEY: 'isolated-seeapi-encryption-test-key',
  NODE_ENV: 'test',
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

const { db } = await import('../src/core/db');
const { config } = await import('../src/config/db/schema');
const { getAdminConfigs, getAllConfigs, saveConfigs, filterPublicConfigs } =
  await import('../src/modules/config/service');
const { isEncryptedSecret } = await import('../src/lib/crypto');
const { testSeeAPI } = await import('../src/modules/config/seeapi-test');
const { runTest, getTestSpec } =
  await import('../src/modules/config/settings-test');
const { POST: testHandler } =
  await import('../src/server/admin/handlers/settings-test');

const apiKey = 'seeapi-isolated-test-value';
after(async () => {
  await rm(directory, { recursive: true, force: true });
});

test('SeeAPI keys persist encrypted, return masked and cannot become public config', async () => {
  await saveConfigs({ seeapi_api_key: apiKey, seeapi_base_url: '' });
  const [stored] = await db()
    .select()
    .from(config)
    .where(eq(config.name, 'seeapi_api_key'));
  assert.ok(isEncryptedSecret(stored.value));
  assert.ok(!stored.value.includes(apiKey));
  assert.equal((await getAllConfigs()).seeapi_api_key, apiKey);
  const masked = (await getAdminConfigs()).seeapi_api_key;
  assert.ok(masked.startsWith('••••••••'));
  assert.ok(!masked.includes(apiKey));
  await saveConfigs({ seeapi_api_key: masked });
  assert.equal((await getAllConfigs()).seeapi_api_key, apiKey);
  assert.deepEqual(
    filterPublicConfigs(await getAllConfigs(), ['seeapi_api_key']),
    {}
  );
});

test('saved and unsaved endpoint changes cannot forward an existing SeeAPI key', async () => {
  for (const key of [undefined, (await getAdminConfigs()).seeapi_api_key]) {
    const changes: Record<string, string> = {
      seeapi_base_url: 'https://other.example',
    };
    if (key) changes.seeapi_api_key = key;
    await assert.rejects(saveConfigs(changes), /re-entering seeapi_api_key/);
    const response = await testHandler({
      request: new Request('http://localhost/api/admin/settings/test', {
        method: 'POST',
        body: JSON.stringify({ group: 'seeapi', configs: changes }),
      }),
      actor: { userId: 'test-admin', permissions: ['*'] },
      params: {},
    });
    assert.match((await response.json()).message, /re-entering seeapi_api_key/);
  }
  assert.equal((await getAllConfigs()).seeapi_base_url, '');
});

test('SeeAPI Test dispatch uses a read-only authenticated request to the official API', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: URL, init: RequestInit) => {
    assert.equal(url.href, 'https://api.seeapi.com/v1/credits');
    assert.equal(init.method, 'GET');
    assert.equal(init.body, undefined);
    assert.equal(
      new Headers(init.headers).get('Authorization'),
      `Bearer ${apiKey}`
    );
    assert.equal(init.redirect, 'manual');
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json({ credits: 100 });
  });
  assert.ok(getTestSpec('seeapi'));
  const result = await runTest('seeapi', {}, await getAllConfigs());
  assert.equal(result.success, true);
  assert.ok(!JSON.stringify(result).includes(apiKey));
});

test('freshly re-entered credentials allow a custom endpoint and masked round trips', async (t) => {
  await saveConfigs({
    seeapi_base_url: 'https://gateway.example/',
    seeapi_api_key: apiKey,
  });
  await saveConfigs({
    seeapi_base_url: 'https://gateway.example',
    seeapi_api_key: (await getAdminConfigs()).seeapi_api_key,
  });
  t.mock.method(globalThis, 'fetch', async (url: URL) => {
    assert.equal(url.href, 'https://gateway.example/v1/credits');
    return Response.json({ credits: 0 });
  });
  assert.equal((await testSeeAPI(await getAllConfigs())).success, true);
});

test('missing keys and unsafe endpoint formats fail before any network request', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('unexpected request');
  });
  for (const key of ['', '••••••••alue', 'key\nvalue']) {
    assert.equal((await testSeeAPI({ seeapi_api_key: key })).success, false);
  }
  for (const base of [
    'http://api.seeapi.com',
    'https://user:pass@api.seeapi.com',
    'https://api.seeapi.com?key=bad',
    'https://api.seeapi.com#fragment',
    'invalid',
  ]) {
    assert.equal(
      (await testSeeAPI({ seeapi_api_key: apiKey, seeapi_base_url: base }))
        .success,
      false
    );
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('provider failures and network errors never echo the API key', async (t) => {
  let status = 401;
  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: { message: apiKey } }, { status })
  );
  for (status of [401, 403, 429, 500]) {
    const result = await testSeeAPI({ seeapi_api_key: apiKey });
    assert.equal(result.success, false);
    assert.ok(!JSON.stringify(result).includes(apiKey));
  }
  fetchMock.mock.mockImplementation(async () => {
    throw new Error(apiKey);
  });
  const result = await testSeeAPI({ seeapi_api_key: apiKey });
  assert.equal(result.success, false);
  assert.ok(!JSON.stringify(result).includes(apiKey));
});

test('successful HTTP status with an invalid or error body is not a successful test', async (t) => {
  let body = 'not JSON';
  t.mock.method(globalThis, 'fetch', async () => new Response(body));
  for (body of [
    'not JSON',
    'null',
    '[]',
    JSON.stringify({ error: apiKey }),
    JSON.stringify({ success: false }),
  ]) {
    const result = await testSeeAPI({ seeapi_api_key: apiKey });
    assert.equal(result.success, false);
    assert.ok(!JSON.stringify(result).includes(apiKey));
  }
});
