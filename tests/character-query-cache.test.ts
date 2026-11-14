import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient } from '@tanstack/react-query';

import { invalidateCharacterCreditQueries } from '../src/lib/character-query-cache';

test('a generation reservation or refund refreshes every credit view without discarding unrelated data', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, gcTime: Infinity } },
  });
  const affected = [
    ['character-balance', 'user-1'],
    ['user-credits', 'balance'],
    ['user-credits', 'recent'],
    ['user-credits', 1, 'all', ''],
  ];
  try {
    for (const key of affected) client.setQueryData(key, { balance: 26 });
    client.setQueryData(['user-info'], { name: 'Creator' });
    await invalidateCharacterCreditQueries(client);
    for (const key of affected)
      assert.equal(client.getQueryState(key)?.isInvalidated, true);
    assert.equal(client.getQueryState(['user-info'])?.isInvalidated, false);
    assert.deepEqual(client.getQueryData(['user-info']), { name: 'Creator' });
  } finally {
    client.clear();
  }
});
