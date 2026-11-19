import { createFileRoute } from '@tanstack/react-router';
import { runAdminRoute } from '@/server/admin/execute';

import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';

export const Route = createFileRoute('/api/admin/images/')({
  server: {
    handlers: {
      GET: (context) => {
        const limited = enforceMinIntervalRateLimit(context.request, {
          intervalMs: 100,
          keyPrefix: 'admin-images-list-ip',
        });
        return limited ?? runAdminRoute('images_list', context);
      },
    },
  },
});
