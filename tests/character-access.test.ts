import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import { eq } from 'drizzle-orm';

const directory = await mkdtemp(join(tmpdir(), 'southparkmaker-access-'));
Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'isolated-access-test-not-a-real-credential',
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

let dispose: (() => Promise<void>) | undefined;
if (process.env.CHARACTER_ACCESS_D1 === '1') {
  const { createClient } = await import('@libsql/client');
  const local = createClient({ url: process.env.DATABASE_URL! });
  const ddl = (
    await local.execute(
      "select sql from sqlite_master where sql is not null and name not like 'sqlite_%' order by type = 'index'"
    )
  ).rows.map((r) => String(r.sql));
  local.close();
  const { getPlatformProxy } = await import('wrangler');
  const proxy = await getPlatformProxy<{ DB: any }>({
    configPath: 'wrangler.jsonc',
    remoteBindings: false,
    persist: { path: join(directory, 'd1') },
  });
  for (const sql of ddl) await proxy.env.DB.prepare(sql).run();
  (globalThis as any).__CF_ENV__ = proxy.env;
  process.env.DATABASE_PROVIDER = 'd1';
  dispose = proxy.dispose;
}
const { db } = await import('../src/core/db');
const schema = await import('../src/config/db/schema');
const {
  grantWelcomeCharacterTrial,
  getCharacterAccess,
  releaseCharacterTrial,
  hasPaidCharacterDownload,
} = await import('../src/modules/character-access/service');
const { createTask } = await import('../src/modules/ai-tasks/service');
const { grant, getBalance } = await import('../src/modules/credits/service');
const { createCharacterDownload, createCharacterPreview } =
  await import('../src/routes/api/characters/-download');
const { publicCharacterResult } =
  await import('../src/modules/characters/service');
const { previewCharacterAsset } =
  await import('../src/core/storage/character-preview');
before(async () => {
  for (const id of ['trial', 'retry', 'not-new', 'buyer', 'other', 'rollback'])
    await db()
      .insert(schema.user)
      .values({ id, name: id, email: `${id}@example.test` });
});
beforeEach(() => globalThis.__minIntervalRateLimitStore?.clear());
after(async () => {
  await dispose?.();
  await rm(directory, { recursive: true, force: true });
});
const generate = (userId: string, trial = true) =>
  createTask({
    userId,
    scene: 'character',
    mediaType: 'image',
    provider: 'seeapi',
    model: 'seedream-5-5',
    prompt: 'A green winter coat',
    costCredits: 26,
    useCharacterTrial: trial,
  });

test('real account signup receives one welcome generation; another login never replenishes it', async () => {
  const { getAuth } = await import('../src/core/auth');
  const email = 'welcome-signup@example.test';
  const password = 'isolated-test-password-not-a-real-credential';
  const signup = await getAuth().api.signUpEmail({
    body: { name: 'Welcome Test', email, password },
  });
  assert.equal(
    (await getCharacterAccess(signup.user.id)).freeGenerationAvailable,
    true
  );
  await generate(signup.user.id);
  await getAuth().api.signInEmail({ body: { email, password } });
  assert.equal(
    (await getCharacterAccess(signup.user.id)).freeGenerationAvailable,
    false
  );
});

test('signup grants a single non-cash trial; concurrent attempts reserve exactly one task', async () => {
  await Promise.all([
    grantWelcomeCharacterTrial('trial'),
    grantWelcomeCharacterTrial('trial'),
  ]);
  assert.equal(
    (await getCharacterAccess('trial')).freeGenerationAvailable,
    true
  );
  const results = await Promise.allSettled([
    generate('trial'),
    generate('trial'),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(
    (
      await db()
        .select()
        .from(schema.aiTask)
        .where(eq(schema.aiTask.userId, 'trial'))
    ).length,
    1
  );
  assert.equal(await getBalance('trial'), 0);
  assert.equal(
    (await getCharacterAccess('trial')).freeGenerationAvailable,
    false
  );
  await grantWelcomeCharacterTrial('trial');
  assert.equal(
    (await getCharacterAccess('trial')).freeGenerationAvailable,
    false
  );
  await assert.rejects(generate('not-new'), /Free preview unavailable/);
  await assert.rejects(generate('trial', false), /Insufficient credits/);
});

test('a failed attempt can be retried; a stale failure cannot restore a newer reservation', async () => {
  await grantWelcomeCharacterTrial('retry');
  const first = await generate('retry');
  assert.equal(first.costCredits, 0);
  await releaseCharacterTrial('retry', first.id);
  const second = await generate('retry');
  await releaseCharacterTrial('retry', first.id);
  assert.equal(
    (await getCharacterAccess('retry')).freeGenerationAvailable,
    false
  );
  await releaseCharacterTrial('other', second.id);
  assert.equal(
    (await getCharacterAccess('retry')).freeGenerationAvailable,
    false
  );
});

test('a database failure cannot consume a welcome attempt without a task', async () => {
  await grantWelcomeCharacterTrial('rollback');
  await assert.rejects(
    createTask({
      userId: 'rollback',
      scene: 'character',
      mediaType: 'image',
      provider: 'seeapi',
      model: 'seedream-5-5',
      prompt: null as any,
      useCharacterTrial: true,
    })
  );
  assert.equal(
    (await getCharacterAccess('rollback')).freeGenerationAvailable,
    true
  );
  assert.equal(
    (
      await db()
        .select()
        .from(schema.aiTask)
        .where(eq(schema.aiTask.userId, 'rollback'))
    ).length,
    0
  );
});

let seq = 0;
async function purchase(overrides: Record<string, unknown> = {}) {
  const id = `purchase-${++seq}`;
  await db()
    .insert(schema.order)
    .values({
      id,
      orderNo: id,
      userId: 'buyer',
      status: 'paid',
      amount: 500,
      paymentAmount: 500,
      currency: 'usd',
      productId: 'character_explorer_pack',
      paymentProvider: 'stripe',
      paymentType: 'one-time',
      checkoutInfo: '{}',
      paidAt: new Date(),
      ...overrides,
    });
  return id;
}
test('only a positive, settled character purchase unlocks download, including after refunds', async () => {
  await grant({ userId: 'buyer', credits: 1000 });
  assert.equal(await hasPaidCharacterDownload('buyer'), false);
  await purchase({ status: 'created' });
  await purchase({ paymentAmount: 0 });
  await purchase({ productId: 'guest_post_standard' });
  await purchase({ userId: 'other' });
  await purchase({ paidAt: null });
  assert.equal(await hasPaidCharacterDownload('buyer'), false);
  const paid = await purchase();
  assert.equal(await hasPaidCharacterDownload('buyer'), true);
  await db()
    .update(schema.order)
    .set({ status: 'refunded' })
    .where(eq(schema.order.id, paid));
  assert.equal(await hasPaidCharacterDownload('buyer'), false);
  await purchase({ productId: 'character_creator_monthly' });
  assert.equal(await hasPaidCharacterDownload('buyer'), true);
});

test('unpaid originals are denied server-side; previews and task JSON never disclose source URLs', async () => {
  const task = {
    id: '00000000-0000-4000-8000-000000000001',
    userId: 'buyer',
    status: 'success',
    scene: 'character',
    mediaType: 'image',
    provider: 'seeapi',
    model: 'seedream-5-5',
    taskResult: JSON.stringify({
      images: ['https://assets.seeapi.com/tasks/private/original.png'],
    }),
  } as any;
  let originalFetches = 0;
  const deps = {
    session: async () => ({ user: { id: 'buyer' } }),
    find: async () => task,
    paid: async () => false,
    fetch: async () => {
      originalFetches++;
      throw new Error('Original must be protected');
    },
    preview: async (_url: string, _provider: string, paid: boolean) => {
      assert.equal(paid, false);
      return new Response('resized-preview');
    },
  };
  const request = new Request(
    `https://example.test/api/characters/${task.id}/download`
  );
  assert.equal(
    (await createCharacterDownload(deps)(request, task.id)).status,
    402
  );
  assert.equal(originalFetches, 0);
  globalThis.__minIntervalRateLimitStore?.clear();
  assert.equal(
    await (await createCharacterPreview(deps)(request, task.id)).text(),
    'resized-preview'
  );
  assert.deepEqual(publicCharacterResult(task).images, [
    `/api/characters/${task.id}/preview`,
  ]);
  assert.doesNotMatch(
    JSON.stringify(publicCharacterResult(task)),
    /seeapi|original.png/
  );
});

test('unpaid preview transformation fails closed when the image service is unavailable', async () => {
  const previous = (globalThis as any).__CF_ENV__;
  const fetcher = async () =>
    new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'Content-Type': 'image/png' },
    });
  try {
    (globalThis as any).__CF_ENV__ = {};
    assert.equal(
      (
        await previewCharacterAsset(
          'https://assets.seeapi.com/image.png',
          'seeapi',
          false,
          fetcher as any
        )
      ).status,
      503
    );
    const seen: unknown[] = [];
    const pipeline = {
      transform(o: unknown) {
        seen.push(o);
        return pipeline;
      },
      async output(o: unknown) {
        seen.push(o);
        return { response: () => new Response(new Uint8Array([9])) };
      },
    };
    (globalThis as any).__CF_ENV__ = { IMAGES: { input: () => pipeline } };
    const response = await previewCharacterAsset(
      'https://assets.seeapi.com/image.png',
      'seeapi',
      false,
      fetcher as any
    );
    assert.deepEqual(seen, [
      { width: 480, height: 480, fit: 'scale-down' },
      { format: 'image/webp', quality: 50 },
    ]);
    assert.equal((await response.arrayBuffer()).byteLength, 1);
    assert.match(response.headers.get('cache-control')!, /private.*no-store/);
  } finally {
    (globalThis as any).__CF_ENV__ = previous;
  }
});
