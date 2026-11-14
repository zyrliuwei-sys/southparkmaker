import { createFileRoute } from '@tanstack/react-router';

import { characterHandlers, characterResponse } from './-handlers';

export const Route = createFileRoute('/api/characters/config')({
  server: {
    handlers: {
      GET: () => characterResponse(() => characterHandlers.config()),
    },
  },
});
