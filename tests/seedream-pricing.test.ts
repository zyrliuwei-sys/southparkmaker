import assert from 'node:assert/strict';
import { test } from 'node:test';

import { characterProducts, getPricingProduct } from '../src/config/pricing';
import { SeeAPIError, SeeAPIProvider } from '../src/core/ai/seeapi';
import { AIMediaType } from '../src/core/ai/types';
import {
  CHARACTER_RESOLUTIONS,
  characterCreditCost,
} from '../src/lib/character-pricing';

test('eightfold USD markup rounds up, and all six packs preserve the same credit value', () => {
  assert.deepEqual(
    CHARACTER_RESOLUTIONS.map(characterCreditCost),
    [15, 15, 26]
  );
  assert.equal(characterProducts.length, 6);
  for (const p of characterProducts) {
    assert.equal(p.credits, p.priceInCents);
    assert.ok(p.credits >= characterCreditCost('2K'));
    assert.equal(getPricingProduct(p.productId), p);
  }
  assert.equal(characterProducts.filter((p) => p.plan).length, 3);
  assert.equal(characterProducts.filter((p) => !p.plan).length, 3);
  assert.equal(getPricingProduct('pro_lifetime'), null);
});
test('Seedream uses the documented request and stable key; the provider key stays in headers', async (t) => {
  const requests: any[] = [];
  t.mock.method(globalThis, 'fetch', async (url: URL, init: RequestInit) => {
    requests.push({ url: url.href, init });
    return Response.json({
      generation: {
        id: 'task_test_1',
        model: 'seedream-5-5',
        endpoint: 'text-to-image',
        status: requests.length === 1 ? 'processing' : 'succeeded',
        result: {
          assets: [
            { type: 'image', url: 'https://cdn.example.test/result.png' },
          ],
        },
      },
    });
  });
  const provider = new SeeAPIProvider({ apiKey: 'test-secret' });
  const started = await provider.generate({
    params: {
      mediaType: AIMediaType.IMAGE,
      model: 'seedream-5-5',
      prompt: 'An original cartoon character',
      options: {
        idempotencyKey: 'stable-id',
        resolution: '1K',
        aspect_ratio: '3:4',
      },
    },
  });
  assert.equal(started.taskStatus, 'processing');
  assert.equal(requests[0].url, 'https://api.seeapi.com/v1/generations');
  assert.equal(
    new Headers(requests[0].init.headers).get('Idempotency-Key'),
    'stable-id'
  );
  assert.equal(
    new Headers(requests[0].init.headers).get('Authorization'),
    'Bearer test-secret'
  );
  const body = JSON.parse(requests[0].init.body);
  assert.deepEqual(body.input, {
    prompt: 'An original cartoon character',
    resolution: '1K',
    aspect_ratio: '3:4',
    output_format: 'png',
    background: 'auto',
    nsfw_checker: true,
  });
  assert.ok(!requests[0].init.body.includes('test-secret'));
  assert.equal(requests[0].init.redirect, 'error');
  const result = await provider.query({ taskId: started.taskId });
  assert.equal(result.taskStatus, 'success');
  assert.equal(
    result.taskInfo?.images?.[0].imageUrl,
    'https://cdn.example.test/result.png'
  );
});
test('terminal task errors differ from transient HTTP errors; raw provider bodies are never exposed', async (t) => {
  let status = 502;
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('sensitive provider body', { status })
  );
  const provider = new SeeAPIProvider({ apiKey: 'test-secret' });
  await assert.rejects(
    provider.query({ taskId: 'task_1' }),
    (e: unknown) =>
      e instanceof SeeAPIError &&
      !e.definitive &&
      !e.message.includes('sensitive')
  );
  status = 402;
  await assert.rejects(
    provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: 'seedream-5-5',
        prompt: 'An original cartoon',
        options: { idempotencyKey: 'stable-id' },
      },
    }),
    (e: unknown) => e instanceof SeeAPIError && e.definitive
  );
  await assert.rejects(provider.query({ taskId: '../credits' }));
});
