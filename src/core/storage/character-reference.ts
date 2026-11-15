import { Buffer } from 'node:buffer';

export const MAX_REFERENCE_BYTES = 3 * 1024 * 1024;
export const REFERENCE_TTL_MS = 60 * 60 * 1000;
const PREFIX = 'references/';
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const REFERENCE_KEY_PATTERN = /^[a-f0-9]{64}$/;

export interface ReferenceBucket {
  put(
    key: string,
    body: Uint8Array,
    options: {
      httpMetadata: { contentType: string };
      customMetadata: { expiresAt: string };
    }
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
    customMetadata?: Record<string, string>;
  } | null>;
  delete(key: string): Promise<unknown>;
}

function bucket(): ReferenceBucket | undefined {
  return (globalThis as { __CF_ENV__?: { REFERENCE_PHOTOS?: ReferenceBucket } })
    .__CF_ENV__?.REFERENCE_PHOTOS;
}

export function referenceStorageAvailable() {
  return Boolean(bucket());
}

export function newReferenceKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, '0')
  ).join('');
}

/** This bucket has no public domain. Only the expiring capability route reads it. */
export async function storeCharacterReference(
  key: string,
  image: { data: string; mimeType: string }
) {
  const storage = bucket();
  if (!storage) throw new Error('Photo conversion storage is unavailable');
  const bytes = Buffer.from(image.data, 'base64');
  if (
    !REFERENCE_KEY_PATTERN.test(key) ||
    !TYPES.has(image.mimeType) ||
    !bytes.length ||
    bytes.length > MAX_REFERENCE_BYTES
  )
    throw new Error('Invalid reference photo');
  await storage.put(PREFIX + key, bytes, {
    httpMetadata: { contentType: image.mimeType },
    customMetadata: { expiresAt: String(Date.now() + REFERENCE_TTL_MS) },
  });
}

export async function removeCharacterReference(key: string | undefined) {
  if (!key || !REFERENCE_KEY_PATTERN.test(key)) return;
  try {
    await bucket()?.delete(PREFIX + key);
  } catch {
    // The private bucket's one-day lifecycle is a backstop for failed cleanup.
    console.warn('[character-reference] Cleanup delayed');
  }
}

export async function readCharacterReference(key: string): Promise<Response> {
  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Referrer-Policy': 'no-referrer',
  };
  if (!REFERENCE_KEY_PATTERN.test(key))
    return new Response('Not found', { status: 404, headers });
  const object = await bucket()?.get(PREFIX + key);
  if (!object) return new Response('Not found', { status: 404, headers });
  const type = object.httpMetadata?.contentType || '';
  const expires = Number(object.customMetadata?.expiresAt);
  if (!TYPES.has(type) || !Number.isFinite(expires) || expires <= Date.now()) {
    await object.body.cancel();
    await removeCharacterReference(key);
    return new Response('Not found', { status: 404, headers });
  }
  return new Response(object.body, {
    headers: { ...headers, 'Content-Type': type },
  });
}
