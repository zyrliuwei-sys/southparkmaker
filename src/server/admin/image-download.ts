import {
  CHARACTER_DOWNLOAD_HEADERS,
  downloadCharacterAsset,
} from '@/core/storage/character-download';
import { findGeneratedImage } from '@/modules/generated-images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';

import { authenticateAdmin, requirePermission } from './auth';
import { AdminError } from './types';

type Dependencies = {
  authenticate: typeof authenticateAdmin;
  find: typeof findGeneratedImage;
  fetch: typeof fetch;
};

export function createAdminImageDownload(
  deps: Dependencies = {
    authenticate: authenticateAdmin,
    find: findGeneratedImage,
    fetch: (...args) => fetch(...args),
  }
) {
  return async (request: Request, id: string) => {
    const deny = (status: number) =>
      new Response('Image download unavailable', {
        status,
        headers: CHARACTER_DOWNLOAD_HEADERS,
      });
    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 500,
      keyPrefix: 'admin-image-download-ip',
    });
    if (limited) return limited;
    try {
      const actor = await deps.authenticate(request);
      requirePermission(actor, 'admin.images.download');
      const userLimited = enforceMinIntervalRateLimit(request, {
        intervalMs: 1000,
        keyPrefix: 'admin-image-download-user',
        extraKey: actor.userId,
      });
      if (userLimited) return userLimited;
      if (!/^[a-f0-9-]{36}$/i.test(id)) return deny(404);
      const image = await deps.find(id);
      if (!image) return deny(404);
      return await downloadCharacterAsset(
        image.imageUrl,
        image.provider,
        `character-${id}`,
        deps.fetch
      );
    } catch (error) {
      return deny(error instanceof AdminError ? error.status : 500);
    }
  };
}
