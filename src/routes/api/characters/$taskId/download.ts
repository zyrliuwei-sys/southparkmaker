import { createFileRoute } from '@tanstack/react-router';

import { createCharacterDownload } from '../-download';

export const Route = createFileRoute('/api/characters/$taskId/download')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        createCharacterDownload()(request, params.taskId),
    },
  },
});
