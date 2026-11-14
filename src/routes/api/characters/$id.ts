import { createFileRoute } from '@tanstack/react-router';

import { characterHandlers, characterResponse } from './-handlers';

export const Route = createFileRoute('/api/characters/$id')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        characterResponse(() => characterHandlers.read(request, params.id)),
    },
  },
});
