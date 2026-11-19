import { getAuth } from '@/core/auth';
import {
  downloadCharacterAsset,
  CHARACTER_DOWNLOAD_HEADERS as HEADERS,
} from '@/core/storage/character-download';
import {
  characterImageUrls,
  findCharacterTask,
  isCharacterTask,
} from '@/modules/characters/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';

export { isCharacterAssetUrl } from '@/lib/character-assets';

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
    if (!url) return deny(404);
    return downloadCharacterAsset(
      url,
      task.provider,
      'southparkmaker-character',
      deps.fetch
    );
  };
}
