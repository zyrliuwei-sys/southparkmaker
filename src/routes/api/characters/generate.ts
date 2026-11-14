import { createFileRoute } from '@tanstack/react-router';

import { characterHandlers, characterResponse } from './-handlers';

export const Route = createFileRoute('/api/characters/generate')({
  server: {
    handlers: {
      POST: ({ request }) =>
        characterResponse(() => characterHandlers.generate(request)),
    },
  },
});
