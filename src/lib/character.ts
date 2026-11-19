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
  'ponytail',
  'bun',
  'braids',
  'afro',
  'mohawk',
  'sidepart',
  'none',
] as const;
export const HATS = [
  'none',
  'beanie',
  'cap',
  'bucket',
  'beret',
  'headphones',
] as const;
export const EXPRESSIONS = ['happy', 'calm', 'surprised', 'grumpy'] as const;
export const ACCESSORIES = [
  'none',
  'glasses',
  'freckles',
  'sunglasses',
  'scarf',
  'earrings',
  'backpack',
] as const;
export const BACKGROUNDS = ['snow', 'park', 'plain', 'transparent'] as const;
export const OUTFITS = [
  'hoodie',
  'jacket',
  'tee',
  'sweater',
  'overalls',
  'suit',
  'dress',
  'raincoat',
] as const;
export const POSES = ['standing', 'wave', 'hands_on_hips', 'sitting'] as const;

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
  pose?: (typeof POSES)[number];
  accessories?: Exclude<(typeof ACCESSORIES)[number], 'none'>[];
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
  pose: 'standing',
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
  return (
    Object.entries(optionValues).every(([key, values]) =>
      (values as readonly unknown[]).includes(object[key])
    ) &&
    (object.pose === undefined ||
      (POSES as readonly unknown[]).includes(object.pose)) &&
    (object.accessories === undefined ||
      (Array.isArray(object.accessories) &&
        object.accessories.length <= ACCESSORIES.length - 1 &&
        object.accessories.every(
          (value) =>
            value !== 'none' &&
            (ACCESSORIES as readonly unknown[]).includes(value)
        )))
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
    pose: pick(POSES),
  };
}

export type SavedCharacter = {
  id: string;
  options: CharacterOptions;
  characters?: CharacterOptions[];
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
          isCharacterOptions(item.options) &&
          (item.characters === undefined ||
            (Array.isArray(item.characters) &&
              item.characters.length >= 1 &&
              item.characters.length <= 3 &&
              item.characters.every(isCharacterOptions)))
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
  const selectedAccessories = characterAccessories(o);
  const pose = o.pose || 'standing';
  const extraBackHair =
    o.hairStyle === 'ponytail'
      ? `<path d="M344 114q71 4 54 85l-28 75-33-17 12-88-26-24z" fill="${o.hairColor}"/>`
      : o.hairStyle === 'braids'
        ? `<g fill="${o.hairColor}"><path d="M145 160q-25 30-12 58-18 25-4 48-17 26 0 45l21-13q-8-17 4-37-10-20 1-42l8-47z"/><path d="M367 160q25 30 12 58 18 25 4 48 17 26 0 45l-21-13q8-17-4-37 10-20-1-42l-8-47z"/></g>`
        : '';
  const longHair =
    o.hairStyle === 'long' || o.hairStyle === 'bob'
      ? `<path d="M144 168Q133 60 255 59t116 111l12 ${o.hairStyle === 'long' ? '187' : '109'}q-49 21-57-17H184q-18 31-48 12z" fill="${o.hairColor}"/>`
      : '';
  const hair: Record<CharacterOptions['hairStyle'], string> = {
    ponytail: `<path d="M146 155Q132 62 249 58q109-1 118 94l-38-28-37-31q-29 48-83 53l-36-13-14 39z"/>`,
    bun: `<ellipse cx="268" cy="51" rx="49" ry="37"/><path d="M147 157Q133 60 252 60q109 1 116 95l-42-34-34-23-38 35-50 1-32 37z"/>`,
    braids: `<path d="M145 167Q130 59 250 59q118-2 117 109l-31-41-39-26-40 39-37-32-36 36-20 33z"/>`,
    afro: `<path d="M135 166q-28-11-16-42-17-26 11-45-1-35 34-37 15-34 48-20 25-30 53-10 34-20 57 9 34-3 43 30 34 9 32 43 28 21 5 48l-19 26-29-37-37-16-32 19-33-11-34 16-35-12-24 37z"/>`,
    mohawk: `<path d="M218 113l5-51 19 9 12-51 20 32 24-23-2 41 28-6-17 55-32-11-29 18z"/>`,
    sidepart: `<path d="M145 158Q132 61 256 60q110 0 111 103l-35-25-28-35-79 43-45-10-19 34z"/><path d="M292 84l-14 29" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="5"/>`,
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
  const accessoryArt: Record<
    Exclude<(typeof ACCESSORIES)[number], 'none'>,
    string
  > = {
    glasses:
      '<g fill="none" stroke="#423a39" stroke-width="6"><rect x="194" y="162" width="59" height="53" rx="15"/><rect x="262" y="162" width="59" height="53" rx="15"/><path d="M253 179h9m-68-1-18-4m145 4 17-4"/></g>',
    freckles:
      '<g fill="#ac654e"><circle cx="197" cy="221" r="3"/><circle cx="208" cy="224" r="3"/><circle cx="188" cy="230" r="3"/><circle cx="304" cy="224" r="3"/><circle cx="315" cy="220" r="3"/><circle cx="324" cy="229" r="3"/></g>',
    sunglasses:
      '<g fill="#293b38" stroke="#423a39" stroke-width="5"><path d="M192 166h62l-7 44q-46 16-52-10zm70 0h62l-3 34q-6 26-52 10z"/><path d="M253 178h10" fill="none"/></g><path d="M201 174h22m50 0h21" stroke="#fff" stroke-opacity=".3" stroke-width="4"/>',
    scarf:
      '<path d="M204 277q52 31 104 0l8 26q-56 26-118-2z" fill="#d8ac4c"/><path d="M272 302h25l9 65-27 4z" fill="#d8ac4c"/><path d="M281 359l22-3" stroke="#8b652d" stroke-width="4"/>',
    earrings:
      '<g fill="none" stroke="#d8ac4c" stroke-width="6"><circle cx="145" cy="219" r="12"/><circle cx="366" cy="219" r="12"/></g>',
    backpack:
      '<g fill="none" stroke="#7d664e" stroke-width="11"><path d="M200 293l-11 87m122-87 11 87"/></g><g fill="#ddd0ad"><rect x="184" y="351" width="12" height="18" rx="3"/><rect x="316" y="351" width="12" height="18" rx="3"/></g>',
  };
  const accessory = selectedAccessories
    .map((value) => accessoryArt[value])
    .join('');
  const backpack = selectedAccessories.includes('backpack')
    ? '<rect x="148" y="288" width="216" height="122" rx="40" fill="#a28c67"/>'
    : '';
  const outfitDetails: Partial<Record<CharacterOptions['outfit'], string>> = {
    sweater:
      '<path d="M184 340h144m-148 28h152m-155 28h158" stroke="#fffdf2" stroke-opacity=".25" stroke-width="12"/><path d="M222 289q34 32 68 0" fill="none" stroke="#fffdf2" stroke-opacity=".5" stroke-width="9"/>',
    overalls:
      '<path d="M202 292v70h108v-70m-99 52h89v76" fill="#fffdf2" fill-opacity=".23" stroke="#383c38" stroke-opacity=".3" stroke-width="10"/><circle cx="211" cy="343" r="5" fill="#d8ac4c"/><circle cx="301" cy="343" r="5" fill="#d8ac4c"/>',
    suit: '<path d="M215 288l41 78 42-78-29 11-13 42-14-42z" fill="#fffcf6"/><path d="M250 301h12l6 35-12 15-11-15z" fill="#48575f"/><path d="M213 290l-20 39 30-3-10 25 43 37 44-37-11-25 30 3-21-39" fill="none" stroke="#283731" stroke-opacity=".45" stroke-width="3"/>',
    dress:
      '<path d="M212 289q44 48 88 0m-112 77h136" fill="none" stroke="#fffcf6" stroke-opacity=".5" stroke-width="9"/><path d="M256 373v53" stroke="#293c34" stroke-opacity=".2" stroke-width="3"/>',
    raincoat:
      '<path d="M213 289l42 36 43-36m-42 37v108m-61-57h32v26h-32zm92 0h32v26h-32z" fill="none" stroke="#fffdf2" stroke-opacity=".6" stroke-width="4"/><g fill="#4c4c3b"><circle cx="256" cy="349" r="4"/><circle cx="256" cy="374" r="4"/><circle cx="256" cy="399" r="4"/></g>',
  };
  const outfitDetail =
    outfitDetails[o.outfit] ??
    (o.outfit === 'jacket'
      ? '<path d="M256 297v120m-53-61h27m53 0h27" stroke="#403b35" stroke-width="3" opacity=".65"/><path d="M216 293l39 45 41-45" fill="none" stroke="#fffdf2" stroke-width="11"/>'
      : o.outfit === 'hoodie'
        ? '<path d="M218 293q36 38 74 0" fill="none" stroke="#fffdf2" stroke-opacity=".4" stroke-width="17"/><path d="M243 315v32m28-32v32m-46 40q31-10 63 0" stroke="#393b37" stroke-width="3" opacity=".6" fill="none"/>'
        : '<path d="M222 289q34 32 68 0" fill="none" stroke="#fffdf2" stroke-opacity=".5" stroke-width="9"/>');
  const hats: Partial<Record<CharacterOptions['hat'], string>> = {
    bucket: `<g fill="${o.outfitColor}"><path d="M170 60h171l25 91H144z"/><path d="M144 140q112-16 222 0l21 38q-134 16-262 0z" stroke="#3c3430" stroke-opacity=".15" stroke-width="3"/></g>`,
    beret: `<path d="M137 136q-18-65 104-91 128-20 138 61l-30 46-176 3z" fill="${o.outfitColor}"/><path d="M169 147q89-20 178 0" stroke="#3c3430" stroke-opacity=".2" stroke-width="14" fill="none"/><path d="M254 43l4-14" stroke="${o.outfitColor}" stroke-width="10"/>`,
    headphones:
      '<path d="M137 189V139q0-97 119-97t119 97v50" fill="none" stroke="#354540" stroke-width="15"/><g fill="#354540" stroke="#dae2d8" stroke-width="5"><rect x="120" y="169" width="32" height="62" rx="14"/><rect x="360" y="169" width="32" height="62" rx="14"/></g>',
  };
  const hat =
    hats[o.hat] ??
    (o.hat === 'beanie'
      ? `<g><path d="M144 147Q137 51 256 45t114 102" fill="${o.outfitColor}"/><path d="M144 133q114-30 226 1v37q-114-20-226 0z" fill="${o.outfitColor}" stroke="#3c3430" stroke-opacity=".18" stroke-width="3"/><circle cx="254" cy="43" r="22" fill="${o.outfitColor}"/></g>`
      : o.hat === 'cap'
        ? `<g fill="${o.outfitColor}"><path d="M149 143q-5-89 99-93 108-3 119 88l-45 25-142-7z"/><path d="M227 140q130-12 166 19 13 16-45 23l-121-22z"/></g>`
        : '');
  const longOutfit = o.outfit === 'dress' || o.outfit === 'raincoat';
  const torso = `<path d="M185 288q70-26 141 0l${longOutfit ? '30 151q-98 19-200 0z' : '16 132q-85 14-172 0z'}" fill="${o.outfitColor}"/>`;
  const sleeves =
    pose === 'wave'
      ? `<path d="M186 291l-33-2-44-44-16 24 48 52 39 5zm138 0q32 14 45 69l-24 18-28-36z" fill="${o.outfitColor}"/>`
      : pose === 'hands_on_hips'
        ? `<path d="M186 291l-50 37 28 48 19-12-17-27 28-11zm138 0 52 37-28 48-19-12 17-27-28-11z" fill="${o.outfitColor}"/>`
        : `<path d="M186 291q-32 14-43 69l24 18 26-36zm138 0q32 14 45 69l-24 18-28-36z" fill="${o.outfitColor}"/>`;
  const hands =
    pose === 'wave'
      ? `<circle cx="109" cy="240" r="22" fill="${o.skinTone}"/><circle cx="359" cy="371" r="22" fill="${o.skinTone}"/>`
      : pose === 'hands_on_hips'
        ? `<circle cx="180" cy="365" r="20" fill="${o.skinTone}"/><circle cx="332" cy="365" r="20" fill="${o.skinTone}"/>`
        : `<circle cx="153" cy="371" r="22" fill="${o.skinTone}"/><circle cx="359" cy="371" r="22" fill="${o.skinTone}"/>`;
  const legs =
    pose === 'sitting'
      ? '<path d="M176 421h160v15H176zm8 10h14v37h-14zm130 0h14v37h-14z" fill="#8d745d"/><path d="M192 405v27h-32v25h80v-52zm80 0v52h81v-25h-32v-27z" fill="#435166"/><path d="M151 449h88v19h-94zm121 0h87l7 19h-94z" fill="#393937"/>'
      : '<path d="M183 411h67v45h-67zm79 0h67v45h-67z" fill="#435166"/><path d="M174 450q38-12 78-1v19h-84zm88-1q38-11 79 1l6 18h-85z" fill="#393937"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024">${background}${landscape}<ellipse cx="256" cy="461" rx="110" ry="12" fill="#3b4c42" opacity=".12"/>${extraBackHair}${longHair}${backpack}${legs}${sleeves}${torso}<path d="M183 307l-13 113q86 14 172 0l-6-52q-80 64-153-61z" fill="#302f2b" opacity=".055"/>${outfitDetail}${hands}<ellipse cx="148" cy="195" rx="18" ry="25" fill="${o.skinTone}"/><ellipse cx="364" cy="195" rx="18" ry="25" fill="${o.skinTone}"/><ellipse cx="256" cy="185" rx="111" ry="113" fill="${o.skinTone}"/><ellipse cx="226" cy="186" rx="29" ry="35" fill="#fffcf6"/><ellipse cx="285" cy="186" rx="29" ry="35" fill="#fffcf6"/><g data-character-pupils="true"><ellipse cx="235" cy="189" rx="4.7" ry="6" fill="#302e2b"/><ellipse cx="276" cy="189" rx="4.7" ry="6" fill="#302e2b"/></g><path d="M254 210l-5 13h10" stroke="#b67759" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>${mouth[o.expression]}<g stroke="${o.hairColor}" fill="none" stroke-width="4" stroke-linecap="round">${eyeBrows}</g>${accessory}<g fill="${o.hairColor}">${hair[o.hairStyle]}</g>${hat}</svg>`;
}

export function characterAccessories(
  options: CharacterOptions
): Exclude<(typeof ACCESSORIES)[number], 'none'>[] {
  return [
    ...new Set([
      ...(options.accessory !== 'none' ? [options.accessory] : []),
      ...(options.accessories ?? []),
    ]),
  ].filter((value) =>
    (ACCESSORIES as readonly string[]).includes(value)
  ) as Exclude<(typeof ACCESSORIES)[number], 'none'>[];
}

export function characterSceneSvg(
  characters: CharacterOptions[],
  background: CharacterOptions['background'] = 'snow'
): string {
  const safe = characters.filter(isCharacterOptions).slice(0, 3);
  if (safe.length <= 1)
    return characterSvg({ ...(safe[0] ?? DEFAULT_CHARACTER), background });
  const source = characterSvg({ ...DEFAULT_CHARACTER, background });
  const scenery = source.slice(
    source.indexOf('>') + 1,
    source.indexOf('<ellipse cx="256" cy="461"')
  );
  // Leave room between actors and at the edges for the waving pose.
  const scale = safe.length === 2 ? 0.68 : 0.49;
  const centers = safe.length === 2 ? [140, 372] : [90, 256, 422];
  const top = 464 - 468 * scale;
  const actors = safe
    .map((actor, index) => {
      const art = characterSvg({ ...actor, background: 'transparent' });
      return `<g data-scene-character="${index}" transform="translate(${centers[index] - 256 * scale} ${top}) scale(${scale})">${art.slice(art.indexOf('>') + 1, art.lastIndexOf('</svg>'))}</g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024">${scenery}${actors}</svg>`;
}

export async function downloadCharacter(
  options: CharacterOptions,
  format: 'png' | 'svg',
  characters?: CharacterOptions[]
): Promise<void> {
  const svg = characterSceneSvg(characters ?? [options], options.background);
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
