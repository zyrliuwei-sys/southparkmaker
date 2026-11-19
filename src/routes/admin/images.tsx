import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';
import { AdminGeneratedImages } from '@/blocks/admin-generated-images';

export const Route = createFileRoute('/admin/images')({
  validateSearch: (search: Record<string, unknown>): { userId?: string } =>
    typeof search.userId === 'string' && search.userId.length <= 191
      ? { userId: search.userId }
      : {},
  head: () => ({
    meta: [
      { title: m['admin.images.title']() },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: () => <AdminGeneratedImages userId={Route.useSearch().userId} />,
});
