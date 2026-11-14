import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';
import type { CharacterResolution } from '@/lib/character-pricing';

export type CharacterCapabilities = {
  enabled: boolean;
  photoEnabled: boolean;
  photoCostCredits?: number;
  costCredits: number;
  resolutions: { resolution: CharacterResolution; costCredits: number }[];
};

export function useCharacterCapabilities() {
  return useQuery({
    queryKey: ['character-capabilities'],
    queryFn: () => apiGet<CharacterCapabilities>('/api/characters/config'),
    staleTime: 60_000,
  });
}
