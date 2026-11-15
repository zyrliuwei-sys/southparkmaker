import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  characterAccessories,
  characterSceneSvg,
  DEFAULT_CHARACTER,
  isCharacterOptions,
  readSavedCharacters,
} from '../src/lib/character';
import {
  CHARACTER_EXAMPLES,
  characterExample,
} from '../src/lib/character-examples';

test('scene examples open with their real options and export one self-contained image', () => {
  for (const example of CHARACTER_EXAMPLES) {
    assert.deepEqual(characterExample(example.id), example.after);
    assert.deepEqual(characterExample(example.id, 'before'), example.before);
    assert.ok(example.after.every(isCharacterOptions));
    const svg = characterSceneSvg(example.after, example.after[0].background);
    assert.equal((svg.match(/<svg\b/g) || []).length, 1);
    assert.ok(!/undefined|<script|href=/.test(svg));
    if (example.after.length > 1)
      assert.equal(
        (svg.match(/data-scene-character=/g) || []).length,
        example.after.length
      );
  }
  assert.equal(characterExample('untrusted'), undefined);
});

test('legacy designs remain loadable and scene saves reject injected options or excessive cast size', () => {
  const record = {
    id: 'saved',
    savedAt: new Date().toISOString(),
    options: DEFAULT_CHARACTER,
  };
  assert.equal(readSavedCharacters(JSON.stringify([record])).length, 1);
  assert.equal(
    readSavedCharacters(
      JSON.stringify([{ ...record, characters: CHARACTER_EXAMPLES[2].after }])
    ).length,
    1
  );
  assert.equal(
    readSavedCharacters(
      JSON.stringify([
        { ...record, characters: Array(4).fill(DEFAULT_CHARACTER) },
      ])
    ).length,
    0
  );
  assert.equal(
    isCharacterOptions({ ...DEFAULT_CHARACTER, pose: '<script>' }),
    false
  );
  assert.equal(
    isCharacterOptions({
      ...DEFAULT_CHARACTER,
      accessories: ['scarf', 'onload=alert(1)'],
    }),
    false
  );
  assert.deepEqual(
    characterAccessories({
      ...DEFAULT_CHARACTER,
      accessory: 'glasses',
      accessories: ['glasses', 'scarf'],
    }),
    ['glasses', 'scarf']
  );
  assert.ok(
    !characterSceneSvg(
      [{ ...DEFAULT_CHARACTER, background: 'transparent' }],
      'transparent'
    ).includes('<rect width="512"')
  );
});

test('published example downloads match the editable designs and are genuine 1024 px PNGs', () => {
  for (const example of CHARACTER_EXAMPLES) {
    const svg = readFileSync(
      new URL(`../public/examples/${example.id}.svg`, import.meta.url),
      'utf8'
    );
    assert.equal(
      svg,
      characterSceneSvg(example.after, example.after[0].background)
    );
    const png = readFileSync(
      new URL(`../public/examples/${example.id}.png`, import.meta.url)
    );
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 1024);
  }
});
