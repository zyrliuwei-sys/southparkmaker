import { useEffect, useState } from 'react';
import {
  Check,
  Download,
  Layers3,
  RotateCcw,
  Save,
  Shuffle,
  Undo2,
} from 'lucide-react';

import {
  ACCESSORIES,
  BACKGROUNDS,
  CHARACTER_PRESETS,
  CHARACTER_STORAGE_KEY,
  characterAccessories,
  DEFAULT_CHARACTER,
  downloadCharacter,
  EXPRESSIONS,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  MAX_SAVED_CHARACTERS,
  OUTFIT_COLORS,
  OUTFITS,
  POSES,
  randomCharacter,
  readSavedCharacters,
  SKIN_TONES,
  type CharacterOptions,
  type SavedCharacter,
} from '@/lib/character';
import { cn } from '@/lib/utils';
import { CharacterPreview } from '@/components/character-preview';
import { Button } from '@/components/ui/button';

import '@/styles/character-studio.css';

export type CharacterStudioCopy = Record<string, string>;
type StudioTab = 'hair' | 'outfit' | 'face' | 'pose' | 'background';
const tabs: StudioTab[] = ['hair', 'outfit', 'face', 'pose', 'background'];

export function CharacterStudio({
  copy,
  initialPreset,
  initialOutfitColor,
  initialExpression,
  initialCharacters,
}: {
  copy: CharacterStudioCopy;
  initialPreset?: number;
  initialOutfitColor?: CharacterOptions['outfitColor'];
  initialExpression?: CharacterOptions['expression'];
  initialCharacters?: CharacterOptions[];
}) {
  const [characters, setCharacters] = useState<CharacterOptions[]>(
    () =>
      initialCharacters ?? [
        {
          ...(CHARACTER_PRESETS[initialPreset ?? -1]?.options ??
            DEFAULT_CHARACTER),
          ...(initialOutfitColor ? { outfitColor: initialOutfitColor } : {}),
          ...(initialExpression ? { expression: initialExpression } : {}),
        },
      ]
  );
  const [active, setActive] = useState(0);
  const options = characters[active] ?? characters[0];
  const [history, setHistory] = useState<
    { characters: CharacterOptions[]; active: number }[]
  >([]);
  const [tab, setTab] = useState<StudioTab>('hair');
  const [saved, setSaved] = useState<SavedCharacter[]>([]);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    try {
      setSaved(
        readSavedCharacters(localStorage.getItem(CHARACTER_STORAGE_KEY))
      );
    } catch {
      /* Browser storage is optional. */
    }
  }, []);

  useEffect(() => {
    // A mode switch drops the preset query, but must retain the current draft.
    if (
      !initialCharacters &&
      initialPreset === undefined &&
      !initialOutfitColor &&
      !initialExpression
    )
      return;
    setCharacters(
      initialCharacters ?? [
        {
          ...(CHARACTER_PRESETS[initialPreset ?? -1]?.options ??
            DEFAULT_CHARACTER),
          ...(initialOutfitColor ? { outfitColor: initialOutfitColor } : {}),
          ...(initialExpression ? { expression: initialExpression } : {}),
        },
      ]
    );
    setActive(0);
    setHistory([]);
    setStatus('');
  }, [initialPreset, initialOutfitColor, initialExpression, initialCharacters]);

  function commit(next: CharacterOptions[], nextActive = active) {
    setHistory((previous) => [...previous.slice(-19), { characters, active }]);
    setCharacters(next);
    setActive(nextActive);
    setStatus('');
  }

  function update(next: CharacterOptions) {
    commit(
      characters.map((actor, index) =>
        index === active
          ? characters.length > 1
            ? { ...next, background: characters[0].background }
            : next
          : actor
      )
    );
  }

  function change<K extends keyof CharacterOptions>(
    key: K,
    value: CharacterOptions[K]
  ) {
    if (key === 'background') {
      commit(
        characters.map((actor) => ({
          ...actor,
          background: value as CharacterOptions['background'],
        }))
      );
    } else update({ ...options, [key]: value });
  }

  function toggleAccessory(value: CharacterOptions['accessory']) {
    const selected = characterAccessories(options);
    update({
      ...options,
      accessory: 'none',
      accessories:
        value === 'none'
          ? []
          : selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value],
    });
  }

  function undo() {
    const previous = history.at(-1);
    if (previous) {
      setCharacters(previous.characters);
      setActive(previous.active);
      setHistory(history.slice(0, -1));
      setStatus('');
    }
  }

  function saveCharacter() {
    const next: SavedCharacter[] = [
      {
        id: crypto.randomUUID(),
        options: { ...characters[0] },
        ...(characters.length > 1 ? { characters } : {}),
        savedAt: new Date().toISOString(),
      },
      ...saved,
    ].slice(0, MAX_SAVED_CHARACTERS);
    try {
      localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(next));
      setSaved(next);
      setStatus(copy.saved_success);
    } catch {
      setStatus(copy.storage_error);
    }
  }

  async function exportImage(format: 'png' | 'svg') {
    setExporting(true);
    setStatus('');
    try {
      await downloadCharacter(characters[0], format, characters);
      setStatus(copy.download_success);
    } catch {
      setStatus(copy.download_error);
    } finally {
      setExporting(false);
    }
  }

  function choices<K extends keyof CharacterOptions>(
    key: K,
    values: readonly Extract<CharacterOptions[K], string>[]
  ) {
    return (
      <div
        className={cn(
          'character-options',
          key === 'background' && 'character-background-options'
        )}
      >
        {values.map((value) => {
          const selected =
            key === 'accessory'
              ? value === 'none'
                ? characterAccessories(options).length === 0
                : characterAccessories(options).includes(
                    value as Exclude<CharacterOptions['accessory'], 'none'>
                  )
              : (options[key] ?? (key === 'pose' ? 'standing' : undefined)) ===
                value;
          return (
            <button
              className="character-choice"
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                key === 'accessory'
                  ? toggleAccessory(value as CharacterOptions['accessory'])
                  : change(key, value)
              }
            >
              <span className="character-choice-preview">
                <CharacterPreview
                  options={{
                    ...options,
                    [key]: value,
                    ...(key === 'accessory' ? { accessories: [] } : {}),
                  }}
                />
              </span>
              <span>{copy[value]}</span>
              {selected && (
                <Check
                  className="character-choice-check"
                  size={13}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  function colors<K extends 'skinTone' | 'hairColor' | 'outfitColor'>(
    key: K,
    values: readonly Extract<CharacterOptions[K], string>[],
    title: string
  ) {
    return (
      <div className="character-swatches" role="group" aria-label={title}>
        {values.map((value, index) => (
          <button
            key={value}
            type="button"
            className="character-swatch"
            style={{ '--swatch': value } as React.CSSProperties}
            aria-label={`${title}: ${copy[`${key}_name_${index + 1}`]}`}
            title={copy[`${key}_name_${index + 1}`]}
            aria-pressed={options[key] === value}
            onClick={() => change(key, value)}
          >
            {options[key] === value && <Check size={17} aria-hidden="true" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="character-studio" aria-label={copy.studio_label}>
      <div className="character-preview-column">
        <div className="character-preview-heading">
          <span>
            <Layers3 size={17} aria-hidden="true" />
            {copy.preview}
          </span>
          <span className="character-preview-size">1024 × 1024</span>
        </div>
        <div
          className={cn(
            'character-main-preview',
            characters[0].background === 'transparent' &&
              'character-checkerboard'
          )}
        >
          <CharacterPreview
            options={characters[0]}
            characters={characters}
            label={copy.preview_alt}
          />
        </div>
        <div
          className="character-cast"
          role="group"
          aria-label={copy.cast_label}
        >
          {characters.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              {copy.character_number.replace('{number}', String(index + 1))}
            </button>
          ))}
          <button
            type="button"
            disabled={characters.length >= 3}
            onClick={() =>
              commit(
                [
                  ...characters,
                  {
                    ...randomCharacter(),
                    background: characters[0].background,
                  },
                ],
                characters.length
              )
            }
          >
            {copy.add_character}
          </button>
          {characters.length > 1 && (
            <button
              type="button"
              onClick={() =>
                commit(
                  characters.filter((_, index) => index !== active),
                  0
                )
              }
            >
              {copy.remove_character}
            </button>
          )}
        </div>
        <p className="character-cast-note">{copy.cast_note}</p>
        <div className="character-quick-actions">
          <Button
            variant="ghost"
            onClick={() => update(randomCharacter())}
            className="character-quick-button"
          >
            <Shuffle size={15} aria-hidden="true" />
            {copy.randomize}
          </Button>
          <Button
            variant="ghost"
            onClick={undo}
            disabled={!history.length}
            className="character-quick-button"
          >
            <Undo2 size={15} aria-hidden="true" />
            {copy.undo}
          </Button>
          <Button
            variant="ghost"
            onClick={() => update({ ...DEFAULT_CHARACTER })}
            className="character-quick-button"
          >
            <RotateCcw size={15} aria-hidden="true" />
            {copy.reset}
          </Button>
        </div>
        <div className="character-export-actions">
          <Button
            onClick={() => exportImage('png')}
            disabled={exporting}
            className="character-download"
          >
            <Download size={17} aria-hidden="true" />
            {exporting ? copy.exporting : copy.download_png}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportImage('svg')}
            disabled={exporting}
            className="character-svg-download"
            aria-label={copy.download_svg}
            title={copy.download_svg}
          >
            SVG
          </Button>
          <Button
            variant="outline"
            onClick={saveCharacter}
            className="character-save"
            aria-label={copy.save}
            title={copy.save}
          >
            <Save size={17} aria-hidden="true" />
          </Button>
        </div>
        <p className="character-device-note">{copy.device_note}</p>
        <p className="character-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="character-editor-column">
        <div className="character-editor-intro">
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div
          className="character-tabs"
          role="tablist"
          aria-label={copy.categories}
        >
          {tabs.map((item) => (
            <button
              type="button"
              role="tab"
              key={item}
              id={`character-tab-${item}`}
              aria-selected={tab === item}
              aria-controls={`character-panel-${item}`}
              tabIndex={tab === item ? 0 : -1}
              onClick={() => setTab(item)}
              onKeyDown={(event) => {
                if (
                  event.key !== 'ArrowRight' &&
                  event.key !== 'ArrowLeft' &&
                  event.key !== 'Home' &&
                  event.key !== 'End'
                )
                  return;
                event.preventDefault();
                const index = tabs.indexOf(item);
                const nextIndex =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? tabs.length - 1
                      : (index +
                          (event.key === 'ArrowRight' ? 1 : -1) +
                          tabs.length) %
                        tabs.length;
                setTab(tabs[nextIndex]);
                document
                  .getElementById(`character-tab-${tabs[nextIndex]}`)
                  ?.focus();
              }}
            >
              {copy[`tab_${item}`]}
            </button>
          ))}
        </div>
        <div
          className="character-panel"
          id={`character-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`character-tab-${tab}`}
        >
          {tab === 'hair' && (
            <>
              <div className="character-control-group">
                <h3>{copy.hair_style}</h3>
                {choices('hairStyle', HAIR_STYLES)}
              </div>
              <div className="character-control-group">
                <h3>{copy.hair_color}</h3>
                {colors('hairColor', HAIR_COLORS, copy.hair_color)}
              </div>
              <div className="character-control-group">
                <h3>{copy.hat}</h3>
                {choices('hat', HATS)}
              </div>
            </>
          )}
          {tab === 'outfit' && (
            <>
              <div className="character-control-group">
                <h3>{copy.outfit_style}</h3>
                {choices('outfit', OUTFITS)}
              </div>
              <div className="character-control-group">
                <h3>{copy.outfit_color}</h3>
                {colors('outfitColor', OUTFIT_COLORS, copy.outfit_color)}
              </div>
            </>
          )}
          {tab === 'face' && (
            <>
              <div className="character-control-group">
                <h3>{copy.skin_tone}</h3>
                {colors('skinTone', SKIN_TONES, copy.skin_tone)}
              </div>
              <div className="character-control-group">
                <h3>{copy.expression}</h3>
                {choices('expression', EXPRESSIONS)}
              </div>
              <div className="character-control-group">
                <h3>{copy.accessories}</h3>
                <p className="character-control-note">
                  {copy.accessories_note}
                </p>
                {choices('accessory', ACCESSORIES)}
              </div>
            </>
          )}
          {tab === 'pose' && (
            <div className="character-control-group">
              <h3>{copy.pose}</h3>
              {choices('pose', POSES)}
            </div>
          )}
          {tab === 'background' && (
            <>
              <div className="character-control-group">
                <h3>{copy.background}</h3>
                {choices('background', BACKGROUNDS)}
              </div>
              <p className="character-background-note">
                {copy.transparent_note}
              </p>
            </>
          )}
        </div>
        <div className="character-presets">
          <h3>{copy.start_preset}</h3>
          <div className="character-preset-list">
            {CHARACTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => update({ ...preset.options })}
                aria-label={copy[`preset_${preset.id}`]}
                title={copy[`preset_${preset.id}`]}
              >
                <CharacterPreview options={preset.options} />
              </button>
            ))}
          </div>
        </div>
        {saved.length > 0 && (
          <div className="character-saved">
            <div className="character-saved-heading">
              <h3>{copy.saved_designs}</h3>
              <span>
                {saved.length}/{MAX_SAVED_CHARACTERS}
              </span>
            </div>
            <div className="character-preset-list">
              {saved.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    commit(item.characters ?? [{ ...item.options }], 0)
                  }
                  aria-label={copy.load_saved.replace(
                    '{number}',
                    String(index + 1)
                  )}
                >
                  <CharacterPreview
                    options={item.options}
                    characters={item.characters}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
