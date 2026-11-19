import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: 'file::memory:',
  AUTH_SECRET: 'isolated-download-test-not-a-real-secret',
  NODE_ENV: 'test',
});
const { createCharacterDownload, isCharacterAssetUrl } =
  await import('../src/routes/api/characters/-download');
const id = '00000000-0000-4000-8000-000000000001';
const task = {
  id,
  userId: 'owner',
  status: 'success',
  scene: 'character',
  mediaType: 'image',
  provider: 'seeapi',
  model: 'seedream-5-5',
  taskResult: JSON.stringify({
    images: ['https://assets.seeapi.com/tasks/example/image.png'],
  }),
} as any;
const req = () =>
  new Request('https://southparkmaker.com/api/characters/' + id + '/download');
beforeEach(() => globalThis.__minIntervalRateLimitStore?.clear());
function handler(overrides: Record<string, any> = {}) {
  return createCharacterDownload({
    session: async () => ({ user: { id: 'owner' } }),
    find: async () => task,
    paid: async () => true,
    preview: async () => {
      throw new Error('Unexpected preview');
    },
    fetch: async () =>
      new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: { 'content-type': 'image/png' },
      }),
    ...overrides,
  });
}

test('only the task owner can download a completed character; no caller URL is fetched', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    throw new Error('must not fetch');
  };
  assert.equal(
    (await handler({ session: async () => null, fetch: fetcher })(req(), id))
      .status,
    401
  );
  globalThis.__minIntervalRateLimitStore?.clear();
  assert.equal(
    (
      await handler({
        find: async () => ({ ...task, userId: 'other' }),
        fetch: fetcher,
      })(req(), id)
    ).status,
    404
  );
  globalThis.__minIntervalRateLimitStore?.clear();
  assert.equal(
    (
      await handler({
        find: async () => ({ ...task, status: 'processing' }),
        fetch: fetcher,
      })(req(), id)
    ).status,
    404
  );
  assert.equal(calls, 0);
  for (const url of [
    'http://assets.seeapi.com/a.png',
    'https://assets.seeapi.com.evil.test/a.png',
    'https://user@assets.seeapi.com/a.png',
    'https://assets.seeapi.com:444/a.png',
    'https://127.0.0.1/a.png',
    'https://assets.seeapi.com/a.png#fragment',
  ])
    assert.equal(isCharacterAssetUrl(url, 'seeapi'), false, url);
  assert.equal(
    isCharacterAssetUrl('https://assets.seeapi.com/a.png', 'fal'),
    false
  );
});

test('an owner receives a private raster attachment without forwarding credentials or following redirects', async () => {
  const seen: any[] = [];
  const response = await handler({
    fetch: async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: { 'content-type': 'image/png' },
      });
    },
  })(req(), id);
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get('content-disposition')!,
    /attachment;.*\.png/
  );
  assert.match(response.headers.get('cache-control')!, /no-store/);
  assert.equal((await response.arrayBuffer()).byteLength, 4);
  assert.equal(seen[0].init.redirect, 'manual');
  assert.equal(seen[0].init.credentials, 'omit');
  assert.equal(seen[0].init.headers, undefined);
  for (const bad of [
    new Response('', {
      status: 302,
      headers: { location: 'https://attacker.test' },
    }),
    new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }),
    new Response('large', {
      headers: {
        'content-type': 'image/png',
        'content-length': String(26 * 1024 * 1024),
      },
    }),
  ]) {
    globalThis.__minIntervalRateLimitStore?.clear();
    assert.equal(
      (await handler({ fetch: async () => bad })(req(), id)).status,
      502
    );
  }
});
