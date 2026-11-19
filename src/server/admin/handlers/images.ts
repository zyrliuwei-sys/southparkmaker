import { listGeneratedImages } from '@/modules/generated-images/service';
import { generatedImagesQuery } from '@/lib/generated-images';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData } from '@/lib/resp';

import type { AdminHandlerContext } from '../types';

export async function GET({ request, actor }: AdminHandlerContext) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 100,
    keyPrefix: 'admin-images-list-user',
    extraKey: actor.userId,
  });
  if (limited) return limited;
  const query = generatedImagesQuery.parse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  return respData(await listGeneratedImages(query));
}
