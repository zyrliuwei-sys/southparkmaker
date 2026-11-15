import { getAuth } from '@/core/auth';
import {
  characterImageUrls,
  findCharacterTask,
  isCharacterTask,
} from '@/modules/characters/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';

const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;
const TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

export function isCharacterAssetUrl(value: string, provider: string) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.hash
    )
      return false;
    const hosts: Record<string, string> = {
      seeapi: 'assets.seeapi.com',
      fal: 'fal.media',
      replicate: 'replicate.delivery',
    };
    const host = hosts[provider];
    return Boolean(
      host &&
      (url.hostname === host ||
        (provider !== 'seeapi' && url.hostname.endsWith('.' + host)))
    );
  } catch {
    return false;
  }
}

type Dependencies = {
  session: (request: Request) => Promise<{ user: { id: string } } | null>;
  find: typeof findCharacterTask;
  fetch: typeof fetch;
};

/** Only an owner's completed task can proxy a raster from its provider's known CDN. */
export function createCharacterDownload(
  deps: Dependencies = {
    session: (request) =>
      getAuth().api.getSession({ headers: request.headers }),
    find: findCharacterTask,
    fetch: (...args) => fetch(...args),
  }
) {
  return async (request: Request, taskId: string) => {
    const deny = (status: number) =>
      new Response(
        status === 404 ? 'Not found' : 'Image download unavailable',
        { status, headers: HEADERS }
      );
    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 500,
      keyPrefix: 'character-download-ip',
    });
    if (limited) return limited;
    const session = await deps.session(request);
    if (!session?.user) return deny(401);
    const userLimited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1000,
      keyPrefix: 'character-download-user',
      extraKey: session.user.id,
    });
    if (userLimited) return userLimited;
    if (!/^[a-f0-9-]{36}$/i.test(taskId)) return deny(404);
    const task = await deps.find(taskId);
    if (!isCharacterTask(task, session.user.id) || task.status !== 'success')
      return deny(404);
    let url: string | undefined;
    try {
      url = characterImageUrls(JSON.parse(task.taskResult || '{}').images)[0];
    } catch {}
    if (!url || !isCharacterAssetUrl(url, task.provider)) return deny(404);
    try {
      const upstream = await deps.fetch(url, {
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
        Number(upstream.headers.get('content-length')) > MAX_DOWNLOAD_BYTES
      ) {
        await upstream.body?.cancel();
        return deny(502);
      }
      // Bound the complete body before sending a successful attachment. A failed
      // or oversized fetch must not look like a valid but truncated download.
      const reader = upstream.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_DOWNLOAD_BYTES) {
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
      return new Response(bytes, {
        headers: {
          ...HEADERS,
          'Content-Type': type,
          'Content-Length': String(size),
          'Content-Disposition': `attachment; filename="southparkmaker-character.${TYPES[type]}"`,
        },
      });
    } catch {
      return deny(502);
    }
  };
}
