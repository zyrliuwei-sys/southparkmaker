import type { QueryClient } from '@tanstack/react-query';

/** A reservation or refund changes both the studio balance and account history. */
export function invalidateCharacterCreditQueries(client: QueryClient) {
  return Promise.allSettled([
    client.invalidateQueries({ queryKey: ['character-balance'] }),
    client.invalidateQueries({ queryKey: ['character-access'] }),
    client.invalidateQueries({ queryKey: ['user-credits'] }),
  ]);
}
