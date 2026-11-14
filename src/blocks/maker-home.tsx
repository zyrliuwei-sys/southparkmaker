import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  MousePointer2,
  Palette,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { CHARACTER_PRESETS } from '@/lib/character';
import { useCharacterCapabilities } from '@/hooks/use-character-capabilities';
import { CharacterPreview } from '@/components/character-preview';
import { MakerHero } from '@/components/maker-hero';

const c = (key: string) => tDynamic(`maker.${key}`);

export function MakerHeroBlock() {
  const capabilities = useCharacterCapabilities();
  return (
    <MakerHero
      photoAvailable={capabilities.data?.photoEnabled === true}
      copy={{
        title: c('hero.title'),
        titleLead: c('hero.title_lead'),
        titleTail: c('hero.title_tail'),
        description: c('hero.description'),
        modes: [
          c('hero.mode_text'),
          c('hero.mode_photo'),
          c('hero.mode_builder'),
        ],
        panelTitle: c('hero.panel_title'),
        panelHint: c('hero.panel_hint'),
        placeholder: c('hero.placeholder'),
        promptLabel: c('hero.prompt_label'),
        create: c('hero.create'),
        customize: c('hero.customize'),
        photoTitle: c('hero.photo_title'),
        photoDescription: c('hero.photo_description'),
        choosePhoto: c('hero.choose_photo'),
        samplesLabel: c('hero.samples_label'),
        samples: [c('hero.sample_1'), c('hero.sample_2'), c('hero.sample_3')],
        benefits: [
          c('hero.benefit_1'),
          c('hero.benefit_2'),
          c('hero.benefit_3'),
        ],
        artNote: c('hero.art_note'),
        previewLabel: c('hero.preview_label'),
        previewFormat: c('hero.preview_format'),
        previewHint: c('hero.preview_hint'),
        previewHintAI: c('hero.preview_ai_hint'),
        previewLabelAI: c('hero.preview_ai_label'),
        builderHint: c('hero.builder_hint'),
        stageControls: {
          colors: c('hero.colors_label'),
          colorNames: [1, 2, 3, 4].map((index) => c(`hero.color_${index}`)),
          expressionAction: c('hero.expression_action'),
          expressionNames: Object.fromEntries(
            ['happy', 'calm', 'surprised', 'grumpy'].map((value) => [
              value,
              tDynamic(`studio.${value}`),
            ])
          ) as Record<'happy' | 'calm' | 'surprised' | 'grumpy', string>,
        },
        presetNames: [0, 2, 4].map((index) =>
          tDynamic(CHARACTER_PRESETS[index].name)
        ),
        presetShortNames: [1, 2, 3].map((index) =>
          c(`hero.preset_short_${index}`)
        ),
      }}
    />
  );
}

export function MakerCreationPaths() {
  return (
    <section className="maker-section">
      <div className="maker-container">
        <div className="maker-section-heading">
          <h2>{c('paths.title')}</h2>
          <p>{c('paths.description')}</p>
        </div>
        <div className="maker-two-paths">
          <article className="maker-path">
            <div>
              <div className="maker-path-icon">
                <SlidersHorizontal size={23} />
              </div>
              <h3>{c('paths.builder_title')}</h3>
              <p>{c('paths.builder_description')}</p>
              <Link href="/create">
                {c('paths.builder_action')}
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="maker-path-preview">
              <CharacterPreview
                options={{
                  ...CHARACTER_PRESETS[0].options,
                  background: 'transparent',
                }}
              />
            </div>
          </article>
          <article className="maker-path">
            <div>
              <div className="maker-path-icon">
                <Sparkles size={23} />
              </div>
              <h3>{c('paths.ai_title')}</h3>
              <p>{c('paths.ai_description')}</p>
              <Link href="/create?mode=ai">
                {c('paths.ai_action')}
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <figure className="atelier-ai-example">
              <img
                src="/imgs/generated/seedream-character-example.jpg"
                alt={c('paths.example_alt')}
                width="1400"
                height="1400"
                loading="lazy"
              />
              <figcaption>{c('paths.example_caption')}</figcaption>
            </figure>
          </article>
        </div>
      </div>
    </section>
  );
}

export function MakerGallery() {
  return (
    <section id="gallery" className="maker-section maker-gallery-section">
      <div className="maker-container">
        <div className="maker-section-heading">
          <h2>{c('gallery.title')}</h2>
          <p>{c('gallery.description')}</p>
        </div>
        <div className="maker-gallery">
          {CHARACTER_PRESETS.map((preset, index) => (
            <Link
              className="maker-gallery-card"
              href={`/create?preset=${index}`}
              key={preset.id}
            >
              <div
                className="maker-gallery-picture"
                style={{
                  background: [
                    'var(--mk-sky)',
                    'var(--mk-lilac)',
                    'var(--mk-sun)',
                    'var(--mk-paper-deep)',
                    'var(--mk-sky)',
                    'var(--mk-lilac)',
                  ][index],
                }}
              >
                <CharacterPreview
                  options={{ ...preset.options, background: 'transparent' }}
                  label={tDynamic(preset.name)}
                />
              </div>
              <div className="maker-gallery-meta">
                <div>
                  <h3>{tDynamic(preset.name)}</h3>
                  <p>{c(`gallery.caption_${index + 1}`)}</p>
                </div>
                <span>
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MakerHowItWorks() {
  return (
    <section id="how-it-works" className="maker-section maker-steps-section">
      <div className="maker-container">
        <div className="maker-section-heading">
          <h2>{c('how.title')}</h2>
          <p>{c('how.description')}</p>
        </div>
        <ol className="maker-steps">
          {[0, 1, 2].map((index) => (
            <li key={index}>
              <div className="maker-step-visual">
                <span className="maker-step-number">0{index + 1}</span>
                {index === 0 ? (
                  <>
                    <MousePointer2 />
                    <Palette />
                  </>
                ) : index === 1 ? (
                  <CharacterPreview options={CHARACTER_PRESETS[0].options} />
                ) : (
                  <ArrowDownToLine />
                )}
              </div>
              <div>
                <h3>{c(`how.title_${index + 1}`)}</h3>
                <p>{c(`how.description_${index + 1}`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function MakerFAQ() {
  const capabilities = useCharacterCapabilities();
  return (
    <section id="faq" className="maker-section">
      <div className="maker-container maker-faq-grid">
        <div className="maker-faq-heading">
          <h2>{c('faq.title')}</h2>
          <p>{c('faq.description')}</p>
        </div>
        <div className="maker-faq">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <details key={index} open={index === 1 || undefined}>
              <summary>
                {c(`faq.question_${index}`)}
                <Plus size={17} />
              </summary>
              <p>
                {c(
                  index === 3 && !capabilities.data?.photoEnabled
                    ? 'faq.photo_unavailable_answer'
                    : `faq.answer_${index}`
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MakerCTA() {
  return (
    <section className="maker-cta">
      <div className="maker-container maker-cta-inner">
        <div>
          <h2>{c('cta.title')}</h2>
          <p>{c('cta.description')}</p>
        </div>
        <Link href="/create" className="maker-button maker-button-primary">
          {c('cta.action')}
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
