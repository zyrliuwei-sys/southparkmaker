import { createFileRoute } from '@tanstack/react-router';

import { createCharacterPreview } from '../-download';

export const Route = createFileRoute('/api/characters/$taskId/preview')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        createCharacterPreview()(request, params.taskId),
    },
  },
});
