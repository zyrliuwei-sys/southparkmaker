export const CHARACTER_STORAGE_KEY = 'southparkmaker.characters.v1';
export const MAX_SAVED_CHARACTERS = 8;

export const SKIN_TONES = [
  '#f2c9a5',
  '#e3ae80',
  '#c88b61',
  '#a76846',
  '#754b35',
  '#f7dbc4',
] as const;
export const HAIR_COLORS = [
  '#382b29',
  '#764b31',
  '#bd7840',
  '#e6c374',
  '#bf5744',
  '#67647a',
] as const;
export const OUTFIT_COLORS = [
  '#d96745',
  '#508c81',
  '#7e80aa',
  '#d5a247',
  '#6597bd',
  '#be7790',
  '#665965',
  '#e9e3ce',
] as const;
export const HAIR_STYLES = [
  'short',
  'curly',
  'long',
  'spiky',
  'bob',
  'none',
] as const;
export const HATS = ['none', 'beanie', 'cap'] as const;
export const EXPRESSIONS = ['happy', 'calm', 'surprised', 'grumpy'] as const;
export const ACCESSORIES = ['none', 'glasses', 'freckles'] as const;
export const BACKGROUNDS = ['snow', 'park', 'plain', 'transparent'] as const;
export const OUTFITS = ['hoodie', 'jacket', 'tee'] as const;

export type CharacterOptions = {
  skinTone: (typeof SKIN_TONES)[number];
  hairColor: (typeof HAIR_COLORS)[number];
  outfitColor: (typeof OUTFIT_COLORS)[number];
  hairStyle: (typeof HAIR_STYLES)[number];
  hat: (typeof HATS)[number];
  expression: (typeof EXPRESSIONS)[number];
  accessory: (typeof ACCESSORIES)[number];
  background: (typeof BACKGROUNDS)[number];
  outfit: (typeof OUTFITS)[number];
};

export const DEFAULT_CHARACTER: CharacterOptions = {
  skinTone: '#f2c9a5',
  hairColor: '#764b31',
  outfitColor: '#508c81',
  hairStyle: 'curly',
  hat: 'none',
  expression: 'happy',
  accessory: 'none',
  background: 'snow',
  outfit: 'hoodie',
};

const presets: { id: string; labelKey: string; options: CharacterOptions }[] = [
  {
    id: 'mountain',
    labelKey: 'studio.preset_mountain',
    options: { ...DEFAULT_CHARACTER },
  },
  {
    id: 'daydreamer',
    labelKey: 'studio.preset_daydreamer',
    options: {
      ...DEFAULT_CHARACTER,
      skinTone: '#e3ae80',
      hairStyle: 'long',
      hairColor: '#382b29',
      outfitColor: '#be7790',
      accessory: 'freckles',
      background: 'park',
    },
  },
  {
    id: 'skater',
    labelKey: 'studio.preset_skater',
    options: {
      ...DEFAULT_CHARACTER,
      skinTone: '#a76846',
      hairStyle: 'short',
      hat: 'cap',
      outfitColor: '#d96745',
      expression: 'calm',
      outfit: 'tee',
    },
  },
  {
    id: 'bookworm',
    labelKey: 'studio.preset_bookworm',
    options: {
      ...DEFAULT_CHARACTER,
      skinTone: '#f7dbc4',
      hairStyle: 'bob',
      hairColor: '#bf5744',
      outfitColor: '#7e80aa',
      accessory: 'glasses',
      background: 'plain',
    },
  },
  {
    id: 'explorer',
    labelKey: 'studio.preset_explorer',
    options: {
      ...DEFAULT_CHARACTER,
      skinTone: '#754b35',
      hairColor: '#382b29',
      hairStyle: 'curly',
      hat: 'beanie',
      outfitColor: '#d5a247',
      outfit: 'jacket',
      expression: 'surprised',
    },
  },
  {
    id: 'weekender',
    labelKey: 'studio.preset_weekender',
    options: {
      ...DEFAULT_CHARACTER,
      hairStyle: 'spiky',
      hairColor: '#e6c374',
      outfitColor: '#6597bd',
      background: 'park',
      expression: 'grumpy',
      outfit: 'jacket',
    },
  },
];

export const defaultCharacterOptions = DEFAULT_CHARACTER;
export const CHARACTER_PRESETS = presets.map((preset) => ({
  ...preset,
  name: preset.labelKey,
}));

const optionValues = {
  skinTone: SKIN_TONES,
  hairColor: HAIR_COLORS,
  outfitColor: OUTFIT_COLORS,
  hairStyle: HAIR_STYLES,
  hat: HATS,
  expression: EXPRESSIONS,
  accessory: ACCESSORIES,
  background: BACKGROUNDS,
  outfit: OUTFITS,
};

/** Accept only known options, including when reading untrusted browser storage. */
export function isCharacterOptions(value: unknown): value is CharacterOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const object = value as Record<string, unknown>;
  return Object.entries(optionValues).every(([key, values]) =>
    (values as readonly unknown[]).includes(object[key])
  );
}

export function randomCharacter(): CharacterOptions {
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(Math.random() * items.length)];
  return {
    skinTone: pick(SKIN_TONES),
    hairColor: pick(HAIR_COLORS),
    outfitColor: pick(OUTFIT_COLORS),
    hairStyle: pick(HAIR_STYLES),
    hat: pick(HATS),
    expression: pick(EXPRESSIONS),
    accessory: pick(ACCESSORIES),
    background: pick(BACKGROUNDS),
    outfit: pick(OUTFITS),
  };
}

export type SavedCharacter = {
  id: string;
  options: CharacterOptions;
  savedAt: string;
};
export function readSavedCharacters(raw: string | null): SavedCharacter[] {
  if (!raw || raw.length > 25000) return [];
  try {
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    return values
      .filter((entry): entry is SavedCharacter => {
        if (!entry || typeof entry !== 'object') return false;
        const item = entry as SavedCharacter;
        return (
          typeof item.id === 'string' &&
          item.id.length < 100 &&
          typeof item.savedAt === 'string' &&
          !Number.isNaN(Date.parse(item.savedAt)) &&
          isCharacterOptions(item.options)
        );
      })
      .slice(0, MAX_SAVED_CHARACTERS);
  } catch {
    return [];
  }
}

const tree = (x: number, y: number, scale: number, color: string) =>
  `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-7 20h14v80H-7z" fill="#735847"/><path d="M0-95L-46-15h22L-61 40h28L-75 94H75L33 40h28L24-15h22z" fill="${color}"/><path d="M0-95L-46-15h22L-61 40h28L-75 94h22L-15 39H-37L-3-17H-22L7-83z" fill="#fff" opacity=".34"/></g>`;

/** The artwork contains only fixed SVG markup and allow-listed option values. */
export function characterSvg(input: CharacterOptions): string {
  const o = isCharacterOptions(input) ? input : DEFAULT_CHARACTER;
  const snow = o.background === 'snow';
  const scenery = snow || o.background === 'park';
  const background =
    o.background === 'transparent'
      ? ''
      : `<rect width="512" height="512" fill="${snow ? '#bfdce5' : o.background === 'park' ? '#c9dfcf' : '#eee9df'}"/>`;
  const landscape = scenery
    ? `<path d="M-30 286L100 111 204 265 322 112 547 310v150H-30z" fill="${snow ? '#8eafba' : '#a6c5a5'}"/><path d="M100 111L148 182l-26-8-21 17-16-17-33 27zm222 1 54 48-26-7-20 18-18-13-27 13z" fill="${snow ? '#f7f8ed' : '#d9e3b7'}"/><path d="M0 365Q132 325 257 370T512 363v149H0z" fill="${snow ? '#f4f6ed' : '#94b983'}"/>${tree(49, 287, 0.8, snow ? '#517a69' : '#598765')}${tree(464, 278, 1, snow ? '#3e6c5e' : '#457756')}${tree(399, 268, 0.5, '#73917b')}<path d="M0 442Q150 408 282 453T512 438v74H0z" fill="${snow ? '#fffdf4' : '#b0cb92'}"/>`
    : '';
  const longHair =
    o.hairStyle === 'long' || o.hairStyle === 'bob'
      ? `<path d="M144 168Q133 60 255 59t116 111l12 ${o.hairStyle === 'long' ? '187' : '109'}q-49 21-57-17H184q-18 31-48 12z" fill="${o.hairColor}"/>`
      : '';
  const hair: Record<CharacterOptions['hairStyle'], string> = {
    none: '',
    short: `<path d="M146 154Q132 64 230 63q95-18 132 64l-13 31-28-35-37 12-44-30-33 35-25-8-23 32z"/>`,
    curly: `<path d="M148 156q-28-22-6-44-4-29 26-34 10-33 42-23 27-30 55-7 34-19 54 7 36-1 38 33 30 11 20 42l-18 30-25-37-20 16-32-24-29 20-22-20-26 22-27-12-22 35z"/>`,
    long: `<path d="M146 160Q134 65 251 62q102-10 117 93l-23-15-24-36q-40 63-109 44l-30 38-14-55z"/>`,
    spiky: `<path d="M145 165l-8-55 28 9-6-52 36 21 21-57 22 43 42-45 7 41 45-18-1 39 37-3-6 46-14 38-26-32-33 7-31-20-41 18-24-9-28 38z"/>`,
    bob: `<path d="M145 175Q128 61 249 60q117-5 119 110l-35-57-48 35-15-21-63 26-24-10-23 44z"/>`,
  };
  const mouth: Record<CharacterOptions['expression'], string> = {
    happy:
      '<path d="M230 239q27 30 53-1" fill="#fdfbf2" stroke="#4d3630" stroke-width="4" stroke-linecap="round"/>',
    calm: '<path d="M237 248q19 5 38-1" fill="none" stroke="#4d3630" stroke-width="4" stroke-linecap="round"/>',
    surprised: '<ellipse cx="257" cy="248" rx="13" ry="17" fill="#503a34"/>',
    grumpy:
      '<path d="M236 253q20-17 41 0" fill="none" stroke="#4d3630" stroke-width="4" stroke-linecap="round"/>',
  };
  const eyeBrows =
    o.expression === 'grumpy'
      ? '<path d="M204 157l37 10m29-1 38-10"/>'
      : o.expression === 'surprised'
        ? '<path d="M207 150q16-9 31-3m34-1q16-8 29 1"/>'
        : '';
  const accessory =
    o.accessory === 'glasses'
      ? '<g fill="none" stroke="#423a39" stroke-width="6"><rect x="194" y="162" width="59" height="53" rx="15"/><rect x="262" y="162" width="59" height="53" rx="15"/><path d="M253 179h9m-68-1-18-4m145 4 17-4"/></g>'
      : o.accessory === 'freckles'
        ? '<g fill="#ac654e"><circle cx="197" cy="221" r="3"/><circle cx="208" cy="224" r="3"/><circle cx="188" cy="230" r="3"/><circle cx="304" cy="224" r="3"/><circle cx="315" cy="220" r="3"/><circle cx="324" cy="229" r="3"/></g>'
        : '';
  const outfitDetail =
    o.outfit === 'jacket'
      ? '<path d="M256 297v120m-53-61h27m53 0h27" stroke="#403b35" stroke-width="3" opacity=".65"/><path d="M216 293l39 45 41-45" fill="none" stroke="#fffdf2" stroke-width="11"/>'
      : o.outfit === 'hoodie'
        ? '<path d="M218 293q36 38 74 0" fill="none" stroke="#fffdf2" stroke-opacity=".4" stroke-width="17"/><path d="M243 315v32m28-32v32m-46 40q31-10 63 0" stroke="#393b37" stroke-width="3" opacity=".6" fill="none"/>'
        : '<path d="M222 289q34 32 68 0" fill="none" stroke="#fffdf2" stroke-opacity=".5" stroke-width="9"/>';
  const hat =
    o.hat === 'beanie'
      ? `<g><path d="M144 147Q137 51 256 45t114 102" fill="${o.outfitColor}"/><path d="M144 133q114-30 226 1v37q-114-20-226 0z" fill="${o.outfitColor}" stroke="#3c3430" stroke-opacity=".18" stroke-width="3"/><circle cx="254" cy="43" r="22" fill="${o.outfitColor}"/></g>`
      : o.hat === 'cap'
        ? `<g fill="${o.outfitColor}"><path d="M149 143q-5-89 99-93 108-3 119 88l-45 25-142-7z"/><path d="M227 140q130-12 166 19 13 16-45 23l-121-22z"/></g>`
        : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024">${background}${landscape}<ellipse cx="256" cy="461" rx="110" ry="12" fill="#3b4c42" opacity=".12"/>${longHair}<path d="M183 411h67v45h-67zm79 0h67v45h-67z" fill="#435166"/><path d="M174 450q38-12 78-1v19h-84zm88-1q38-11 79 1l6 18h-85z" fill="#393937"/><path d="M186 291q-32 14-43 69l24 18 26-36zm138 0q32 14 45 69l-24 18-28-36z" fill="${o.outfitColor}"/><path d="M185 288q70-26 141 0l16 132q-85 14-172 0z" fill="${o.outfitColor}"/><path d="M183 307l-13 113q86 14 172 0l-6-52q-80 64-153-61z" fill="#302f2b" opacity=".055"/>${outfitDetail}<circle cx="153" cy="371" r="22" fill="${o.skinTone}"/><circle cx="359" cy="371" r="22" fill="${o.skinTone}"/><ellipse cx="148" cy="195" rx="18" ry="25" fill="${o.skinTone}"/><ellipse cx="364" cy="195" rx="18" ry="25" fill="${o.skinTone}"/><ellipse cx="256" cy="185" rx="111" ry="113" fill="${o.skinTone}"/><ellipse cx="226" cy="186" rx="29" ry="35" fill="#fffcf6"/><ellipse cx="285" cy="186" rx="29" ry="35" fill="#fffcf6"/><g data-character-pupils="true"><ellipse cx="235" cy="189" rx="4.7" ry="6" fill="#302e2b"/><ellipse cx="276" cy="189" rx="4.7" ry="6" fill="#302e2b"/></g><path d="M254 210l-5 13h10" stroke="#b67759" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>${mouth[o.expression]}<g stroke="${o.hairColor}" fill="none" stroke-width="4" stroke-linecap="round">${eyeBrows}</g>${accessory}<g fill="${o.hairColor}">${hair[o.hairStyle]}</g>${hat}</svg>`;
}

export async function downloadCharacter(
  options: CharacterOptions,
  format: 'png' | 'svg'
): Promise<void> {
  const svg = characterSvg(options);
  const source = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  );
  const save = (url: string, extension: string) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `southparkmaker-character.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };
  try {
    if (format === 'svg') {
      save(source, 'svg');
      return;
    }
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image export failed'));
      image.src = source;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image export failed');
    context.drawImage(image, 0, 0, 1024, 1024);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('Image export failed')),
        'image/png'
      )
    );
    const pngUrl = URL.createObjectURL(png);
    try {
      save(pngUrl, 'png');
    } finally {
      setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    }
  } finally {
    setTimeout(() => URL.revokeObjectURL(source), 1000);
  }
}
