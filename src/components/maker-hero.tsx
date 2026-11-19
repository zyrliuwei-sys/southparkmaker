import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  ArrowRight,
  Check,
  ImagePlus,
  SlidersHorizontal,
  Sparkles,
  Type,
} from 'lucide-react';
import { z } from 'zod';

import { useRouter } from '@/core/i18n/navigation';
import {
  CHARACTER_PRESETS,
  EXPRESSIONS,
  type CharacterOptions,
} from '@/lib/character';
import { CharacterPreview } from '@/components/character-preview';
import {
  MakerCharacterStage,
  type CharacterStageCopy,
} from '@/components/maker-character-stage';

export interface MakerHeroCopy {
  title: string;
  titleLead: string;
  titleTail: string;
  description: string;
  modes: [string, string, string];
  panelTitle: string;
  panelHint: string;
  placeholder: string;
  promptLabel: string;
  create: string;
  customize: string;
  photoTitle: string;
  photoDescription: string;
  choosePhoto: string;
  samplesLabel: string;
  samples: string[];
  benefits: string[];
  artNote: string;
  builderHint: string;
  presetNames: string[];
  presetShortNames: string[];
  previewLabel: string;
  previewFormat: string;
  previewHint: string;
  previewHintAI: string;
  previewLabelAI: string;
  stageControls: Pick<
    CharacterStageCopy,
    'colors' | 'colorNames' | 'expressionAction' | 'expressionNames'
  >;
}
export function MakerHero({
  copy,
  photoAvailable = false,
}: {
  copy: MakerHeroCopy;
  photoAvailable?: boolean;
}) {
  const [mode, setMode] = useState<'text' | 'photo' | 'builder'>('builder');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [outfitColor, setOutfitColor] = useState<
    CharacterOptions['outfitColor']
  >(CHARACTER_PRESETS[0].options.outfitColor);
  const [expression, setExpression] = useState<CharacterOptions['expression']>(
    CHARACTER_PRESETS[0].options.expression
  );
  const router = useRouter();
  useEffect(() => {
    if (mode === 'photo' && !photoAvailable) setMode('builder');
  }, [mode, photoAvailable]);
  const availableModes = (['text', 'photo', 'builder'] as const).filter(
    (value) => value !== 'photo' || photoAvailable
  );
  const options = {
    ...CHARACTER_PRESETS[selectedPreset].options,
    outfitColor,
    expression,
  };
  const form = useForm({
    defaultValues: { prompt: '' },
    validators: { onSubmit: z.object({ prompt: z.string().max(1500) }) },
    onSubmit: ({ value }) => {
      if (mode === 'builder') {
        router.push(
          `/create?preset=${selectedPreset}&outfitColor=${encodeURIComponent(outfitColor)}&expression=${expression}`
        );
        return;
      }
      router.push(
        `/create?mode=ai${mode === 'photo' ? '&photo=1' : ''}&prompt=${encodeURIComponent(value.prompt.trim())}`
      );
    },
  });
  const icons = [Type, ImagePlus, SlidersHorizontal];
  return (
    <section className="maker-hero atelier-hero" aria-labelledby="maker-title">
      <div className="maker-container atelier-hero-heading">
        <h1 id="maker-title">
          <span>{copy.titleLead}</span> <strong>{copy.titleTail}</strong>
        </h1>
        <p className="maker-hero-description">{copy.description}</p>
      </div>
      <div className="maker-container atelier-workshop">
        <MakerCharacterStage
          disabled={mode !== 'builder'}
          options={options}
          companions={[
            CHARACTER_PRESETS[(selectedPreset + 1) % 6].options,
            CHARACTER_PRESETS[(selectedPreset + 4) % 6].options,
          ]}
          copy={{
            label: mode === 'builder' ? copy.previewLabel : copy.previewLabelAI,
            format: copy.previewFormat,
            name: copy.presetNames[[0, 2, 4].indexOf(selectedPreset)],
            hint: mode === 'builder' ? copy.previewHint : copy.previewHintAI,
            ...copy.stageControls,
          }}
          onColor={setOutfitColor}
          onExpression={() =>
            setExpression(
              EXPRESSIONS[
                (EXPRESSIONS.indexOf(expression) + 1) % EXPRESSIONS.length
              ]
            )
          }
        />
        <form
          className="maker-prompt-box atelier-entry"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div
            className="maker-prompt-modes"
            role="tablist"
            aria-label={copy.panelTitle}
          >
            {availableModes.map((key) => {
              const index = (['text', 'photo', 'builder'] as const).indexOf(
                key
              );
              const Icon = icons[index];
              return (
                <button
                  type="button"
                  role="tab"
                  key={key}
                  aria-selected={mode === key}
                  id={`maker-mode-${key}`}
                  aria-controls="maker-mode-panel"
                  tabIndex={mode === key ? 0 : -1}
                  className={mode === key ? 'is-active' : ''}
                  onClick={() => setMode(key)}
                  onKeyDown={(event) => {
                    const modes = availableModes;
                    const current = modes.indexOf(mode);
                    const next =
                      event.key === 'ArrowRight'
                        ? (current + 1) % modes.length
                        : event.key === 'ArrowLeft'
                          ? (current - 1 + modes.length) % modes.length
                          : event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                              ? modes.length - 1
                              : null;
                    if (next === null) return;
                    event.preventDefault();
                    setMode(modes[next]);
                    event.currentTarget.parentElement
                      ?.querySelectorAll<HTMLButtonElement>('[role=tab]')
                      [next]?.focus({ preventScroll: true });
                  }}
                >
                  <Icon size={16} />
                  {copy.modes[index]}
                </button>
              );
            })}
          </div>
          <div
            className="maker-prompt-body"
            role="tabpanel"
            id="maker-mode-panel"
            aria-labelledby={`maker-mode-${mode}`}
          >
            <div className="maker-prompt-heading">
              <strong>{copy.panelTitle}</strong>
              <span>{copy.panelHint}</span>
            </div>
            {mode === 'builder' ? (
              <>
                <div className="maker-builder-presets">
                  {[0, 2, 4].map((index, position) => (
                    <button
                      type="button"
                      key={index}
                      aria-label={copy.presetNames[position]}
                      aria-pressed={selectedPreset === index}
                      onClick={() => {
                        setSelectedPreset(index);
                        setOutfitColor(
                          CHARACTER_PRESETS[index].options.outfitColor
                        );
                        setExpression(
                          CHARACTER_PRESETS[index].options.expression
                        );
                      }}
                    >
                      <CharacterPreview
                        options={{
                          ...CHARACTER_PRESETS[index].options,
                          background: 'transparent',
                        }}
                      />
                      <span>{copy.presetShortNames[position]}</span>
                    </button>
                  ))}
                </div>
                <p className="atelier-entry-hint">
                  <SlidersHorizontal size={15} />
                  {copy.builderHint}
                </p>
                <button
                  type="submit"
                  className="maker-button maker-button-primary atelier-entry-action"
                >
                  {copy.customize}
                  <ArrowRight size={18} />
                </button>
              </>
            ) : mode === 'photo' ? (
              <div className="maker-photo-entry">
                <ImagePlus size={30} strokeWidth={1.3} />
                <strong>{copy.photoTitle}</strong>
                <p>{copy.photoDescription}</p>
                <button
                  type="submit"
                  className="maker-button maker-button-primary"
                >
                  {copy.choosePhoto}
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <form.Field name="prompt">
                  {(field) => (
                    <label className="maker-prompt-input">
                      <span className="sr-only">{copy.promptLabel}</span>
                      <textarea
                        name="prompt"
                        value={field.state.value}
                        maxLength={1500}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                        placeholder={copy.placeholder}
                      />
                    </label>
                  )}
                </form.Field>
                <button
                  type="submit"
                  className="maker-button maker-button-primary atelier-entry-action"
                >
                  {copy.create}
                  <ArrowRight size={18} />
                </button>
                <p className="atelier-entry-hint">
                  <Sparkles size={14} />
                  {copy.artNote}
                </p>
              </>
            )}
            {mode === 'text' && (
              <div className="maker-samples">
                <span>{copy.samplesLabel}</span>
                {copy.samples.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => form.setFieldValue('prompt', sample)}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
      <div className="maker-container atelier-hero-baseline">
        <div className="maker-hero-benefits">
          {copy.benefits.map((benefit) => (
            <span key={benefit}>
              <Check size={14} />
              {benefit}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
