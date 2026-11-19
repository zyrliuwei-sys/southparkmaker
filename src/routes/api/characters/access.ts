import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getCharacterAccess } from '@/modules/character-access/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

export const Route = createFileRoute('/api/characters/access')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = enforceMinIntervalRateLimit(request, {
          intervalMs: 500,
          keyPrefix: 'character-access-ip',
        });
        if (limited) return limited;
        const session = await getAuth().api.getSession({
          headers: request.headers,
        });
        if (!session?.user)
          return respErr('Sign in to continue.', { status: 401 });
        const userLimited = enforceMinIntervalRateLimit(request, {
          intervalMs: 500,
          keyPrefix: 'character-access-user',
          extraKey: session.user.id,
        });
        if (userLimited) return userLimited;
        return respData(await getCharacterAccess(session.user.id), {
          headers: { 'Cache-Control': 'private, no-store' },
        });
      },
    },
  },
});
