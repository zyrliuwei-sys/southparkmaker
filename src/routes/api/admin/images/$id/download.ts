import { createFileRoute } from '@tanstack/react-router';
import { createAdminImageDownload } from '@/server/admin/image-download';

const download = createAdminImageDownload();
export const Route = createFileRoute('/api/admin/images/$id/download')({
  server: {
    handlers: { GET: ({ request, params }) => download(request, params.id) },
  },
});
