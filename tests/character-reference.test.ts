import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import {
  newReferenceKey,
  readCharacterReference,
  REFERENCE_TTL_MS,
  referenceStorageAvailable,
  removeCharacterReference,
  storeCharacterReference,
  type ReferenceBucket,
} from '../src/core/storage/character-reference';

const previous = (globalThis as any).__CF_ENV__;
after(() => {
  (globalThis as any).__CF_ENV__ = previous;
});
const objects = new Map<
  string,
  { data: Uint8Array; type: string; expiresAt: string }
>();
let reads = 0;
const bucket: ReferenceBucket = {
  async put(key, body, options) {
    objects.set(key, {
      data: body,
      type: options.httpMetadata.contentType,
      expiresAt: options.customMetadata.expiresAt,
    });
  },
  async get(key) {
    reads++;
    const object = objects.get(key);
    return object
      ? {
          body: new Blob([new Uint8Array(object.data)]).stream(),
          httpMetadata: { contentType: object.type },
          customMetadata: { expiresAt: object.expiresAt },
        }
      : null;
  },
  async delete(key) {
    objects.delete(key);
  },
};

test('private photo capabilities are random, raster-only, no-store and expire independently of task polling', async (t) => {
  (globalThis as any).__CF_ENV__ = { REFERENCE_PHOTOS: bucket };
  assert.equal(referenceStorageAvailable(), true);
  const key = newReferenceKey();
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.notEqual(newReferenceKey(), key);
  await storeCharacterReference(key, {
    data: Buffer.from('test raster').toString('base64'),
    mimeType: 'image/png',
  });
  const response = await readCharacterReference(key);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.match(response.headers.get('cache-control')!, /no-store/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('x-robots-tag')!, /noindex/);
  assert.equal(await response.text(), 'test raster');
  const before = reads;
  assert.equal((await readCharacterReference('../bad')).status, 404);
  assert.equal(reads, before);
  t.mock.method(
    Date,
    'now',
    () => Number(objects.get('references/' + key)!.expiresAt) + 1
  );
  assert.equal((await readCharacterReference(key)).status, 404);
  assert.equal(objects.size, 0);
});

test('private photo storage rejects unsupported files and cleanup is idempotent', async () => {
  (globalThis as any).__CF_ENV__ = { REFERENCE_PHOTOS: bucket };
  await assert.rejects(
    storeCharacterReference(newReferenceKey(), {
      data: 'aGVsbG8=',
      mimeType: 'image/svg+xml',
    })
  );
  await assert.rejects(
    storeCharacterReference('bad', { data: 'aGVsbG8=', mimeType: 'image/png' })
  );
  await removeCharacterReference(newReferenceKey());
  await removeCharacterReference(undefined);
  (globalThis as any).__CF_ENV__ = {};
  assert.equal(referenceStorageAvailable(), false);
  await assert.rejects(
    storeCharacterReference(newReferenceKey(), {
      data: 'aGVsbG8=',
      mimeType: 'image/png',
    }),
    /unavailable/
  );
});
