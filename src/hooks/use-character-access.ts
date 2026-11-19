import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

export type CharacterAccess = {
  freeGenerationAvailable: boolean;
  downloadUnlocked: boolean;
};

export function useCharacterAccess(userId?: string) {
  return useQuery({
    queryKey: ['character-access', userId],
    queryFn: () => apiGet<CharacterAccess>('/api/characters/access'),
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
