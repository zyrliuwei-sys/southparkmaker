import { isCharacterAssetUrl } from '@/lib/character-assets';

const MAX_BYTES = 25 * 1024 * 1024;
const TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
export const CHARACTER_DOWNLOAD_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

/** Caller must authorize the stored task before requesting its image. */
export async function downloadCharacterAsset(
  url: string,
  provider: string,
  filename: string,
  fetcher: typeof fetch = fetch
) {
  const deny = (status: number) =>
    new Response('Image download unavailable', {
      status,
      headers: CHARACTER_DOWNLOAD_HEADERS,
    });
  if (!isCharacterAssetUrl(url, provider)) return deny(404);
  try {
    const upstream = await fetcher(url, {
      redirect: 'manual',
      credentials: 'omit',
      signal: AbortSignal.timeout(20000),
    });
    const type = (upstream.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (
      !upstream.ok ||
      !upstream.body ||
      !TYPES[type] ||
      Number(upstream.headers.get('content-length')) > MAX_BYTES
    ) {
      await upstream.body?.cancel();
      return deny(502);
    }
    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) {
          await reader.cancel();
          return deny(502);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    if (!size) return deny(502);
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 160);
    return new Response(bytes, {
      headers: {
        ...CHARACTER_DOWNLOAD_HEADERS,
        'Content-Type': type,
        'Content-Length': String(size),
        'Content-Disposition': `attachment; filename="${safeName}.${TYPES[type]}"`,
      },
    });
  } catch {
    return deny(502);
  }
}
