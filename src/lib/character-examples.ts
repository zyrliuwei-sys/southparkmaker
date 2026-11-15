import { DEFAULT_CHARACTER, type CharacterOptions } from './character';

// These examples use the same options and renderer as the working editor.
export const CHARACTER_EXAMPLES: {
  id: string;
  before: CharacterOptions[];
  after: CharacterOptions[];
}[] = [
  {
    id: 'portrait',
    before: [{ ...DEFAULT_CHARACTER, background: 'plain' }],
    after: [
      {
        ...DEFAULT_CHARACTER,
        background: 'plain',
        hairStyle: 'bun',
        outfit: 'sweater',
        outfitColor: '#7e80aa',
        accessories: ['glasses', 'scarf'],
        pose: 'wave',
      },
    ],
  },
  {
    id: 'duo',
    before: [{ ...DEFAULT_CHARACTER, background: 'park' }],
    after: [
      {
        ...DEFAULT_CHARACTER,
        background: 'park',
        hairStyle: 'braids',
        outfit: 'overalls',
        accessories: ['earrings'],
        pose: 'hands_on_hips',
      },
      {
        ...DEFAULT_CHARACTER,
        background: 'park',
        skinTone: '#754b35',
        hairStyle: 'afro',
        hairColor: '#382b29',
        outfit: 'raincoat',
        outfitColor: '#d5a247',
        accessories: ['backpack'],
        pose: 'wave',
      },
    ],
  },
  {
    id: 'trio',
    before: [{ ...DEFAULT_CHARACTER }],
    after: [
      {
        ...DEFAULT_CHARACTER,
        hairStyle: 'sidepart',
        outfit: 'suit',
        outfitColor: '#665965',
        pose: 'sitting',
      },
      {
        ...DEFAULT_CHARACTER,
        skinTone: '#a76846',
        hairStyle: 'ponytail',
        outfit: 'dress',
        outfitColor: '#be7790',
        accessories: ['freckles', 'earrings'],
      },
      {
        ...DEFAULT_CHARACTER,
        skinTone: '#f7dbc4',
        hairStyle: 'mohawk',
        hat: 'headphones',
        outfit: 'tee',
        outfitColor: '#6597bd',
        pose: 'wave',
      },
    ],
  },
];
export function characterExample(id: unknown, view: unknown = 'after') {
  const example = CHARACTER_EXAMPLES.find((item) => item.id === id);
  return example
    ? view === 'before'
      ? example.before
      : example.after
    : undefined;
}
