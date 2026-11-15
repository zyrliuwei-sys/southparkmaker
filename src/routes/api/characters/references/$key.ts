import { createFileRoute } from '@tanstack/react-router';

import { readCharacterReference } from '@/core/storage/character-reference';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';

export const Route = createFileRoute('/api/characters/references/$key')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = enforceMinIntervalRateLimit(request, {
          intervalMs: 100,
          keyPrefix: 'character-reference-ip',
        });
        return limited ?? readCharacterReference(params.key);
      },
    },
  },
});
