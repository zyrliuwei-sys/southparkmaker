import { useState } from 'react';
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
import { CHARACTER_PRESETS } from '@/lib/character';
import { CharacterPreview } from '@/components/character-preview';

export interface MakerHeroCopy {
  eyebrow: string;
  title: string;
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
  artAlt: string;
  artCaption: string;
  artNote: string;
  builderHint: string;
  presetNames: string[];
  previewLabel: string;
  previewFormat: string;
  previewHint: string;
  previewHintAI: string;
}

export function MakerHero({ copy }: { copy: MakerHeroCopy }) {
  const [mode, setMode] = useState<'text' | 'photo' | 'builder'>('builder');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const router = useRouter();
  const form = useForm({
    defaultValues: { prompt: '' },
    validators: { onSubmit: z.object({ prompt: z.string().max(1500) }) },
    onSubmit: ({ value }) => {
      if (mode === 'builder') {
        router.push(`/create?preset=${selectedPreset}`);
        return;
      }
      router.push(
        `/create?mode=ai${mode === 'photo' ? '&photo=1' : ''}&prompt=${encodeURIComponent(value.prompt.trim())}`
      );
    },
  });
  const icons = [Type, ImagePlus, SlidersHorizontal];
  return (
    <section className="maker-hero" aria-labelledby="maker-title">
      <div className="maker-container maker-hero-grid">
        <div className="maker-hero-copy">
          <p className="maker-eyebrow">{copy.eyebrow}</p>
          <h1 id="maker-title">{copy.title}</h1>
          <p className="maker-hero-description">{copy.description}</p>
          <form
            className="maker-prompt-box"
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
              {(['text', 'photo', 'builder'] as const).map((key, index) => {
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
                      const modes = ['text', 'photo', 'builder'] as const;
                      const current = modes.indexOf(mode);
                      const next =
                        event.key === 'ArrowRight'
                          ? (current + 1) % 3
                          : event.key === 'ArrowLeft'
                            ? (current + 2) % 3
                            : event.key === 'Home'
                              ? 0
                              : event.key === 'End'
                                ? 2
                                : null;
                      if (next === null) return;
                      event.preventDefault();
                      setMode(modes[next]);
                      event.currentTarget.parentElement
                        ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                        [next]?.focus();
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
                        aria-pressed={selectedPreset === index}
                        onClick={() => setSelectedPreset(index)}
                      >
                        <CharacterPreview
                          options={CHARACTER_PRESETS[index].options}
                        />
                        <span>{copy.presetNames[position]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="maker-prompt-bottom">
                    <span className="maker-mode-note">
                      <SlidersHorizontal size={14} />
                      {copy.builderHint}
                    </span>
                    <button
                      type="submit"
                      className="maker-button maker-button-primary"
                    >
                      {copy.customize}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : mode === 'photo' ? (
                <div className="maker-photo-entry">
                  <ImagePlus size={28} strokeWidth={1.3} />
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
                  <div className="maker-prompt-bottom">
                    <span className="maker-mode-note">
                      <Sparkles size={14} />
                      {copy.artNote}
                    </span>
                    <button
                      type="submit"
                      className="maker-button maker-button-primary"
                    >
                      {copy.create}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
              {mode === 'text' && (
                <div className="maker-samples">
                  <span>{copy.samplesLabel}</span>
                  {copy.samples.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setMode('text');
                        form.setFieldValue('prompt', sample);
                      }}
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
          <div className="maker-hero-benefits">
            {copy.benefits.map((benefit) => (
              <span key={benefit}>
                <Check size={14} />
                {benefit}
              </span>
            ))}
          </div>
        </div>
        <figure className="maker-hero-art">
          <div className="maker-art-topline">
            <span>{copy.previewLabel}</span>
            <span>{copy.previewFormat}</span>
          </div>
          <div className="maker-art-stage">
            <CharacterPreview
              options={CHARACTER_PRESETS[selectedPreset].options}
              label={copy.artAlt}
            />
          </div>
          <figcaption>
            <div>
              <strong>
                {copy.presetNames[[0, 2, 4].indexOf(selectedPreset)]}
              </strong>
              <p>
                {mode === 'builder' ? copy.previewHint : copy.previewHintAI}
              </p>
            </div>
            <SlidersHorizontal size={22} aria-hidden="true" />
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
