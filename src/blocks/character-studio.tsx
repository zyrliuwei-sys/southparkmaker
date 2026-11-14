import { useLocation } from '@tanstack/react-router';

import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';
import { CharacterStudio as Studio } from '@/components/character-studio';

const copyKeys = [
  'studio_label',
  'preview',
  'preview_alt',
  'randomize',
  'undo',
  'reset',
  'exporting',
  'download_png',
  'save',
  'device_note',
  'saved_success',
  'storage_error',
  'download_success',
  'download_error',
  'title',
  'description',
  'categories',
  'tab_hair',
  'tab_outfit',
  'tab_face',
  'tab_background',
  'hair_style',
  'hair_color',
  'hat',
  'outfit_style',
  'outfit_color',
  'skin_tone',
  'expression',
  'accessories',
  'background',
  'transparent_note',
  'start_preset',
  'saved_designs',
  'short',
  'curly',
  'long',
  'spiky',
  'bob',
  'none',
  'beanie',
  'cap',
  'happy',
  'calm',
  'surprised',
  'grumpy',
  'glasses',
  'freckles',
  'snow',
  'park',
  'plain',
  'transparent',
  'hoodie',
  'jacket',
  'tee',
  'preset_mountain',
  'preset_daydreamer',
  'preset_skater',
  'preset_bookworm',
  'preset_explorer',
  'preset_weekender',
] as const;

export function CharacterStudio() {
  const initialPreset = useLocation({
    select: (location) => {
      const value = (location.search as Record<string, unknown>).preset;
      return (typeof value === 'string' || typeof value === 'number') &&
        /^[0-5]$/.test(String(value))
        ? Number(value)
        : undefined;
    },
  });
  const copy = Object.fromEntries(
    copyKeys.map((key) => [key, tDynamic(`studio.${key}`)])
  );
  copy.load_saved = m['studio.load_saved']({ number: '{number}' });
  return <Studio copy={copy} initialPreset={initialPreset} />;
}
