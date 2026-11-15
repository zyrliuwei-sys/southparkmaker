import { useLocation } from '@tanstack/react-router';

import { tDynamic } from '@/core/i18n/dynamic';
import { EXPRESSIONS, OUTFIT_COLORS } from '@/lib/character';
import { characterExample } from '@/lib/character-examples';
import { m } from '@/paraglide/messages.js';
import { CharacterStudio as Studio } from '@/components/character-studio';

const copyKeys = [
  'studio_label',
  'ponytail',
  'bun',
  'braids',
  'afro',
  'mohawk',
  'sidepart',
  'bucket',
  'beret',
  'headphones',
  'sunglasses',
  'scarf',
  'earrings',
  'backpack',
  'sweater',
  'overalls',
  'suit',
  'dress',
  'raincoat',
  'standing',
  'wave',
  'hands_on_hips',
  'sitting',
  'tab_pose',
  'pose',
  'cast_label',
  'cast_note',
  'character_number',
  'add_character',
  'remove_character',
  'accessories_note',

  'preview',
  'preview_alt',
  'randomize',
  'undo',
  'reset',
  'exporting',
  'download_png',
  'download_svg',
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
  const initialCharacters = useLocation({
    select: (location) => {
      const search = location.search as Record<string, unknown>;
      return characterExample(search.example, search.view);
    },
  });
  const initialLook = useLocation({
    select: (location) => {
      const values = location.search as Record<string, unknown>;
      return {
        outfitColor: OUTFIT_COLORS.includes(values.outfitColor as any)
          ? (values.outfitColor as (typeof OUTFIT_COLORS)[number])
          : undefined,
        expression: EXPRESSIONS.includes(values.expression as any)
          ? (values.expression as (typeof EXPRESSIONS)[number])
          : undefined,
      };
    },
  });
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
  for (const [field, count] of [
    ['skinTone', 6],
    ['hairColor', 6],
    ['outfitColor', 8],
  ] as const) {
    for (let index = 1; index <= count; index++)
      copy[`${field}_name_${index}`] = tDynamic(
        `studio.${field}_name_${index}`
      );
  }
  copy.character_number = m['studio.character_number']({ number: '{number}' });
  copy.load_saved = m['studio.load_saved']({ number: '{number}' });
  return (
    <Studio
      copy={copy}
      initialCharacters={initialCharacters}
      initialPreset={initialPreset}
      initialOutfitColor={initialLook.outfitColor}
      initialExpression={initialLook.expression}
    />
  );
}
