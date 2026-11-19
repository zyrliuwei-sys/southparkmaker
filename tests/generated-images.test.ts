import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, beforeEach, test } from 'node:test';

const directory = await mkdtemp(join(tmpdir(), 'southparkmaker-images-'));
Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'isolated-generated-images-test-secret',
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
const { db } = await import('../src/core/db');
const { user, aiTask } = await import('../src/config/db/schema');
const { listGeneratedImages, findGeneratedImage } =
  await import('../src/modules/generated-images/service');
const { createAdminImageDownload } =
  await import('../src/server/admin/image-download');
const { executeAdmin, findOperation, runAdminRoute } =
  await import('../src/server/admin/execute');
const { generatedImagesQuery } = await import('../src/lib/generated-images');
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const url = 'https://assets.seeapi.com/tasks/example/image.png';
before(async () => {
  await db()
    .insert(user)
    .values([
      { id: 'alpha', name: 'Alice', email: 'alice@example.test' },
      { id: 'beta', name: 'Bob', email: 'bob@example.test' },
      {
        id: 'service',
        name: 'API agent',
        email: 'service@example.test',
        type: 'api',
      },
    ]);
  const common = {
    userId: 'alpha',
    provider: 'seeapi',
    model: 'seedream-5-5',
    mediaType: 'image',
    scene: 'character',
    status: 'success',
    prompt: 'A warm green winter coat',
    createdAt: new Date('2026-11-19T01:00:00Z'),
    taskResult: JSON.stringify({
      images: [url],
      privateDiagnostics: 'must-not-leak',
    }),
    options: JSON.stringify({ referenceKey: 'private-photo-key' }),
    taskInfo: 'must-not-leak',
  };
  // Separate statements stay below D1's 100-parameter limit as well.
  for (const row of [
    { ...common, id: id(1) },
    { ...common, id: id(2), userId: 'beta', prompt: 'Blue jacket' },
    { ...common, id: id(3), status: 'processing' },
    { ...common, id: id(4), status: 'failed' },
    { ...common, id: id(5), userId: 'service' },
    { ...common, id: id(6), deletedAt: new Date() },
    { ...common, id: id(7), scene: 'another-product' },
    { ...common, id: id(8), mediaType: 'video' },
    { ...common, id: id(9), taskResult: '{broken' },
    {
      ...common,
      id: id(10),
      taskResult: JSON.stringify({ images: ['https://127.0.0.1/private'] }),
    },
  ])
    await db().insert(aiTask).values(row);
});
beforeEach(() => globalThis.__minIntervalRateLimitStore?.clear());
after(async () => {
  await rm(directory, { recursive: true, force: true });
});

test('registered-user history excludes service, deleted and unrelated tasks and exposes only intended fields', async () => {
  const result = await listGeneratedImages(generatedImagesQuery.parse({}));
  assert.equal(result.total, 6);
  assert.deepEqual(
    result.items.map((r) => r.id),
    [10, 9, 4, 3, 2, 1].map(id)
  );
  assert.equal(result.items.find((r) => r.id === id(1))?.imageUrl, url);
  assert.equal(result.items.find((r) => r.id === id(3))?.imageUrl, null);
  assert.equal(result.items.find((r) => r.id === id(9))?.imageUrl, null);
  assert.equal(result.items.find((r) => r.id === id(10))?.imageUrl, null);
  assert.doesNotMatch(
    JSON.stringify(result),
    /private-photo-key|must-not-leak|taskResult|taskInfo|options/
  );
});

test('search, exact user, status and stable pagination share the same count conditions', async () => {
  const input = (values: Record<string, unknown>) =>
    generatedImagesQuery.parse(values);
  const bob = await listGeneratedImages(
    input({ search: 'BOB@EXAMPLE', status: 'success' })
  );
  assert.equal(bob.total, 1);
  assert.equal(bob.items[0].userId, 'beta');
  const alice = await listGeneratedImages(
    input({ userId: 'alpha', status: 'processing' })
  );
  assert.equal(alice.total, 1);
  assert.equal(alice.items[0].id, id(3));
  assert.equal((await listGeneratedImages(input({ search: id(2) }))).total, 1);
  assert.equal((await listGeneratedImages(input({ search: '%' }))).total, 0);
  const first = await listGeneratedImages(
    input({ page: 1, pageSize: 1, status: 'success' })
  );
  const second = await listGeneratedImages(
    input({ page: 2, pageSize: 1, status: 'success' })
  );
  assert.equal(first.total, 4);
  assert.equal(second.total, first.total);
  assert.notEqual(first.items[0].id, second.items[0].id);
  assert.equal(
    generatedImagesQuery.safeParse({ pageSize: 10000 }).success,
    false
  );
});

test('the shared admin list boundary denies anonymous and unrelated permissions before returning records', async () => {
  const request = new Request('http://localhost:3000/api/admin/images');
  assert.equal((await runAdminRoute('images_list', { request })).status, 401);
  await assert.rejects(
    () =>
      executeAdmin(
        findOperation('images_list'),
        {},
        {
          userId: 'alpha',
          permissions: ['admin.users.read'],
        }
      ),
    /Forbidden/
  );
  const response = await executeAdmin(
    findOperation('images_list'),
    { search: 'Bob' },
    {
      userId: 'alpha',
      permissions: ['admin.images.read'],
    }
  );
  const body = await response.json();
  assert.equal(body.code, 0);
  assert.equal(body.data.items[0].userId, 'beta');
});

test('concurrent admin and ordinary-user downloads cannot share authorization', async () => {
  let fetched = 0;
  const download = createAdminImageDownload({
    authenticate: async (request) => ({
      userId: request.headers.get('x-test-actor')!,
      permissions:
        request.headers.get('x-test-actor') === 'admin'
          ? ['admin.images.download']
          : ['admin.images.read'],
    }),
    find: findGeneratedImage,
    fetch: async () => {
      fetched++;
      return new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: { 'content-type': 'image/png' },
      });
    },
  });
  const request = (actor: string, ip: string) =>
    new Request(`https://example.test/api/admin/images/${id(2)}/download`, {
      headers: { 'x-test-actor': actor, 'cf-connecting-ip': ip },
    });
  const [admin, reader] = await Promise.all([
    download(request('admin', '192.0.2.1'), id(2)),
    download(request('reader', '192.0.2.2'), id(2)),
  ]);
  assert.equal(admin.status, 200);
  assert.equal(reader.status, 403);
  assert.equal(fetched, 1);
  assert.match(admin.headers.get('content-disposition')!, /attachment;.*\.png/);
  assert.match(admin.headers.get('cache-control')!, /private.*no-store/);
});

test('only completed, non-deleted registered-user images can be downloaded', async () => {
  for (const n of [3, 4, 5, 6, 7, 8, 9, 10, 999])
    assert.equal(await findGeneratedImage(id(n)), null);
  assert.deepEqual(await findGeneratedImage(id(1)), {
    provider: 'seeapi',
    imageUrl: url,
  });
  let fetched = false;
  const download = createAdminImageDownload({
    authenticate: async () => ({ userId: 'alpha', permissions: ['*'] }),
    find: findGeneratedImage,
    fetch: async () => {
      fetched = true;
      throw new Error('should not fetch');
    },
  });
  assert.equal(
    (await download(new Request('https://example.test/download'), '../private'))
      .status,
    404
  );
  assert.equal(fetched, false);
});
