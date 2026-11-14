import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, beforeEach, test } from 'node:test';

const directory = await mkdtemp(join(tmpdir(), 'southparkmaker-characters-'));
Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'isolated-character-test-secret-not-a-real-credential',
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
const schema = await import('../src/config/db/schema');
const { createTask } = await import('../src/modules/ai-tasks/service');
const { revoke, getBalance } = await import('../src/modules/credits/service');
const { createCharacterHandlers } =
  await import('../src/routes/api/characters/-handlers');
const { characterInputSchema, validateReferenceImage } =
  await import('../src/routes/api/characters/-input');
const {
  characterImageUrls,
  saveCharacterProgress,
  findCharacterTask,
  initializeCharacterTask,
  CHARACTER_MODELS,
  MAX_CHARACTER_BODY_BYTES,
} = await import('../src/modules/characters/service');

beforeEach(() => globalThis.__minIntervalRateLimitStore?.clear());
after(async () => {
  await rm(directory, { recursive: true, force: true });
});

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/characters/generate', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function handlers(overrides: Record<string, any> = {}) {
  return createCharacterHandlers({
    session: async () => ({ user: { id: 'owner' } }),
    configs: async () => ({}),
    create: async () => {
      throw new Error('Unexpected credit charge');
    },
    initialize: async () => {},
    find: async () => undefined,
    progress: async () => {},
    refund: async () => {
      throw new Error('Unexpected refund');
    },
    provider: () => {
      throw new Error('Unexpected provider request');
    },
    ...overrides,
  });
}

test('provider absence returns disabled capabilities and never creates or charges a task', async () => {
  const h = handlers();
  const config = await (await h.config()).json();
  assert.deepEqual(config.data, {
    enabled: false,
    photoEnabled: false,
    costCredits: 10,
    resolutions: [],
  });
  const result = await h.generate(
    request({ prompt: 'A girl wearing a green coat' })
  );
  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, -1);
});

test('anonymous and cross-site requests cannot invoke a paid generation', async () => {
  const h = handlers({ session: async () => null });
  assert.equal(
    (await h.generate(request({ prompt: 'A green coat' }))).status,
    401
  );
  globalThis.__minIntervalRateLimitStore?.clear();
  assert.equal(
    (
      await h.generate(
        request(
          { prompt: 'A green coat' },
          { origin: 'https://attacker.example' }
        )
      )
    ).status,
    403
  );
});

test('clients cannot select a cheaper cost, arbitrary model, provider or image URL', async () => {
  const h = handlers({
    configs: async () => ({ fal_api_key: 'test-only-key' }),
  });
  for (const extra of [
    { costCredits: 0 },
    { model: 'other/model' },
    { provider: 'other' },
    { imageUrl: 'http://127.0.0.1/private' },
  ]) {
    globalThis.__minIntervalRateLimitStore?.clear();
    assert.equal(
      (await h.generate(request({ prompt: 'A winter hat', ...extra }))).status,
      400
    );
  }
  assert.equal(
    characterInputSchema.safeParse({ prompt: 'x'.repeat(1501) }).success,
    false
  );
});

test('reference photos reject mismatched MIME and arbitrary data while accepting a real PNG signature', () => {
  const data = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0,
  ]).toString('base64');
  assert.ok(
    validateReferenceImage({ data, mimeType: 'image/png' }).startsWith(
      'data:image/png;base64,'
    )
  );
  assert.throws(() => validateReferenceImage({ data, mimeType: 'image/jpeg' }));
  assert.throws(() =>
    validateReferenceImage({
      data: Buffer.from('<svg onload="alert(1)">').toString('base64'),
      mimeType: 'image/png',
    })
  );
  assert.throws(() =>
    validateReferenceImage({
      data: 'http://127.0.0.1/private',
      mimeType: 'image/png',
    })
  );
  assert.deepEqual(
    characterImageUrls([
      'data:image/png;base64,xyz',
      'javascript:alert(1)',
      'https://user:pass@fal.media/image.png',
      'https://fal.media/real.png',
    ]),
    []
  );
  assert.deepEqual(
    characterImageUrls([{ imageUrl: 'https://fal.media/real.png' }]),
    ['https://fal.media/real.png']
  );
});

test('streamed oversized bodies stop before parsing, charging, or forwarding a photo', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_CHARACTER_BODY_BYTES + 1));
      controller.close();
    },
  });
  const req = new Request('http://localhost:3000/api/characters/generate', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
    },
    body: stream,
    duplex: 'half',
  } as RequestInit);
  assert.equal((await handlers().generate(req)).status, 400);
});

test('ownership check hides another user’s task without contacting the provider', async () => {
  const id = '7d633590-e48c-40aa-8b78-4cb30c60655c';
  const h = handlers({
    find: async () => ({
      id,
      userId: 'someone-else',
      scene: 'character',
      mediaType: 'image',
      provider: 'fal',
      model: CHARACTER_MODELS.falText,
    }),
  });
  assert.equal(
    (
      await h.read(
        new Request(`http://localhost:3000/api/characters/${id}`),
        id
      )
    ).status,
    404
  );
});

test('generation cost is server-owned and the reference image is not persisted in task data', async () => {
  let charged: any;
  let persistedInput: any;
  let task: any;
  let generation: any;
  const h = handlers({
    configs: async () => ({ fal_api_key: 'test-only-key' }),
    create: async (value: any) => {
      charged = value;
      task = { ...value, id: 'task', status: 'pending', scene: 'character' };
      return task;
    },
    initialize: async (_: string, value: any) => {
      persistedInput = value;
    },
    progress: async (value: any) => {
      task.status = value.status;
    },
    find: async () => task,
    provider: () => ({
      name: 'fal',
      configs: {},
      generate: async (value: any) => {
        generation = value;
        return { taskId: 'upstream-job', taskStatus: 'pending' };
      },
    }),
  });
  const result = await h.generate(
    request({ prompt: 'A woman with curly red hair', aspectRatio: '3:4' })
  );
  assert.equal(result.status, 202);
  assert.equal(charged.costCredits, 10);
  assert.equal(charged.model, CHARACTER_MODELS.falText);
  assert.equal(persistedInput.aspectRatio, '3:4');
  assert.equal(generation.params.options.image_size, 'portrait_4_3');
  assert.match(generation.params.prompt, /original South Park-inspired/);
  assert.equal((await result.json()).data.taskId, 'task');
});

test('late polls cannot resurrect completed tasks, and concurrent failure refunds return credits once', async () => {
  await db().insert(schema.user).values({
    id: 'credit-owner',
    name: 'Test Creator',
    email: 'creator@example.test',
  });
  await db().insert(schema.credit).values({
    id: 'character-grant',
    userId: 'credit-owner',
    transactionNo: 'character-grant',
    transactionType: 'grant',
    transactionScene: 'gift',
    credits: 20,
    remainingCredits: 20,
    status: 'active',
  });
  const task = await createTask({
    userId: 'credit-owner',
    mediaType: 'image',
    provider: 'fal',
    model: CHARACTER_MODELS.falText,
    prompt: 'A girl in a blue hat',
    costCredits: 10,
  });
  await initializeCharacterTask(task.id, {
    prompt: task.prompt,
    aspectRatio: '1:1',
  });
  assert.equal(await getBalance('credit-owner'), 10);
  await saveCharacterProgress({ taskId: task.id, status: 'failed' });
  await saveCharacterProgress({ taskId: task.id, status: 'processing' });
  assert.equal((await findCharacterTask(task.id))?.status, 'failed');
  const failed = await findCharacterTask(task.id);
  const creditId = JSON.parse(failed!.taskInfo!).creditId;
  await Promise.all([revoke(creditId), revoke(creditId), revoke(creditId)]);
  assert.equal(await getBalance('credit-owner'), 20);
  const h = handlers({
    session: async () => ({ user: { id: 'credit-owner' } }),
    find: findCharacterTask,
    refund: revoke,
  });
  assert.equal(
    (
      await h.read(
        new Request(`http://localhost:3000/api/characters/${task.id}`),
        task.id
      )
    ).status,
    200
  );
  assert.equal(await getBalance('credit-owner'), 20);
});

test('a terminal Fal queue error refunds once, while a transient query error keeps the task running', async () => {
  const id = 'b37dac06-08a7-4536-ab85-aebc258ae726';
  let task: any = {
    id,
    userId: 'owner',
    scene: 'character',
    mediaType: 'image',
    provider: 'fal',
    model: CHARACTER_MODELS.falText,
    status: 'processing',
    taskId: 'upstream-job',
    taskInfo: JSON.stringify({ creditId: 'consumption' }),
  };
  let refunds = 0;
  let code = 503;
  const h = handlers({
    configs: async () => ({ fal_api_key: 'test-only-key' }),
    find: async () => task,
    progress: async (value: any) => {
      task = { ...task, status: value.status };
    },
    refund: async () => {
      refunds++;
    },
    provider: () => ({
      name: 'fal',
      configs: {},
      generate: async () => {
        throw new Error('Unexpected submit');
      },
      query: async () => {
        throw new Error(`request failed with status: ${code}`);
      },
    }),
  });
  const poll = () =>
    h.read(new Request(`http://localhost:3000/api/characters/${id}`), id);
  assert.equal((await poll()).status, 503);
  assert.equal(task.status, 'processing');
  assert.equal(refunds, 0);
  globalThis.__minIntervalRateLimitStore?.clear();
  code = 422;
  const result = await poll();
  assert.equal((await result.json()).data.status, 'failed');
  assert.equal(refunds, 1);
});

test('Seedream charge is server-owned; ambiguous submission resumes with the same idempotency key', async () => {
  const id = 'e64374bb-9895-41a4-8d26-21c804f64e75';
  let created = 0;
  let task: any;
  const submissions: any[] = [];
  const h = handlers({
    configs: async () => ({ seeapi_api_key: 'isolated-seeapi-key' }),
    create: async (value: any) => {
      created++;
      assert.equal(value.costCredits, 15);
      assert.equal(value.provider, 'seeapi');
      assert.equal(value.options.resolution, '1K');
      task = {
        ...value,
        id,
        status: 'pending',
        options: JSON.stringify(value.options),
      };
      return task;
    },
    initialize: async () => {},
    find: async () => task,
    progress: async (value: any) => {
      task.status = value.status;
      if (value.upstreamId) task.taskId = value.upstreamId;
    },
    provider: () => ({
      name: 'seeapi',
      configs: {},
      generate: async (value: any) => {
        submissions.push(value.params);
        if (submissions.length === 1)
          throw new Error('Ambiguous transport interruption');
        return { taskId: 'task_seedream_accepted', taskStatus: 'processing' };
      },
    }),
  });
  const response = await h.generate(
    request({ prompt: 'A character in a blue jacket', resolution: '1K' })
  );
  assert.equal(response.status, 202);
  assert.equal((await response.json()).data.taskId, id);
  const resumed = await h.read(
    new Request(`http://localhost:3000/api/characters/${id}`),
    id
  );
  assert.equal(resumed.status, 200);
  assert.equal(created, 1);
  assert.deepEqual(submissions[0], submissions[1]);
  assert.equal(submissions[0].options.idempotencyKey, id);
  assert.equal(task.taskId, 'task_seedream_accepted');
});

test('concurrent Seedream reservations cannot overspend, and duplicate refunds restore only one charge', async () => {
  const userId = 'seedream-credit-owner';
  await db().insert(schema.user).values({
    id: userId,
    name: 'Seedream Test',
    email: 'seedream@example.test',
  });
  await db().insert(schema.credit).values({
    id: 'seedream-grant',
    userId,
    transactionNo: 'seedream-grant',
    transactionType: 'grant',
    transactionScene: 'gift',
    credits: 52,
    remainingCredits: 52,
    status: 'active',
  });
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () =>
      createTask({
        userId,
        mediaType: 'image',
        provider: 'seeapi',
        model: 'seedream-5-5',
        prompt: 'An original character',
        costCredits: 26,
        scene: 'character',
        options: { resolution: '2K', aspectRatio: '1:1' },
      })
    )
  );
  const completed = results.filter(
    (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled'
  );
  assert.equal(completed.length, 2);
  assert.equal(await getBalance(userId), 0);
  const task = completed[0].value;
  assert.equal(JSON.parse(task.options).resolution, '2K');
  const creditId = JSON.parse(task.taskInfo).creditId;
  await Promise.all([revoke(creditId), revoke(creditId), revoke(creditId)]);
  assert.equal(await getBalance(userId), 26);
});
