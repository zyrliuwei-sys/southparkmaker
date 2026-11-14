import {
  ArrowDownToLine,
  ArrowUpRight,
  FileImage,
  Image,
  Layers,
  MessageCircle,
  Paintbrush,
  UserRound,
} from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { CHARACTER_PRESETS } from '@/lib/character';
import { CharacterPreview } from '@/components/character-preview';

const c = (key: string) => tDynamic(`maker.${key}`);

export function MakerCharacterGuide() {
  return (
    <section id="character-guide" className="maker-section maker-guide-section">
      <div className="maker-container">
        <div className="maker-guide-intro">
          <div>
            <h2>{c('seo.title')}</h2>
            <p>{c('seo.intro')}</p>
          </div>
          <figure>
            <img
              src="/imgs/generated/southparkmaker-hero.jpg"
              alt={c('seo.illustration_alt')}
              width="1254"
              height="1254"
              loading="lazy"
            />
            <figcaption>{c('hero.art_caption')}</figcaption>
          </figure>
        </div>
        <div className="maker-guide-details">
          {[1, 2, 3, 4].map((index) => (
            <article key={index}>
              <span className="maker-guide-icon" aria-hidden="true">
                {index === 1 ? (
                  <UserRound />
                ) : index === 2 ? (
                  <Paintbrush />
                ) : index === 3 ? (
                  <MessageCircle />
                ) : (
                  <Image />
                )}
              </span>
              <div>
                <h3>{c(`seo.detail_title_${index}`)}</h3>
                <p>{c(`seo.detail_body_${index}`)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MakerUseCases() {
  return (
    <section className="maker-section maker-use-section">
      <div className="maker-container">
        <div className="maker-section-heading">
          <h2>{c('use.title')}</h2>
          <p>{c('use.description')}</p>
        </div>
        <div className="maker-use-grid">
          {[1, 2, 3, 4].map((index) => (
            <article key={index}>
              <h3>{c(`use.title_${index}`)}</h3>
              <p>{c(`use.body_${index}`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MakerExportGuide() {
  return (
    <section
      id="avatar-downloads"
      className="maker-section maker-export-section"
    >
      <div className="maker-container maker-export-grid">
        <div className="maker-export-art">
          <div className="maker-export-sample">
            <CharacterPreview
              options={{
                ...CHARACTER_PRESETS[3].options,
                background: 'transparent',
              }}
              label={c('gallery.title')}
            />
          </div>
          <div className="maker-format-tabs" aria-hidden="true">
            <span>
              <FileImage size={18} />
              PNG
            </span>
            <span>
              <Layers size={18} />
              SVG
            </span>
            <ArrowDownToLine size={19} />
          </div>
        </div>
        <div>
          <h2>{c('export.title')}</h2>
          <p className="maker-export-lede">{c('export.description')}</p>
          <div className="maker-export-formats">
            <article>
              <h3>{c('export.png_title')}</h3>
              <p>{c('export.png_body')}</p>
            </article>
            <article>
              <h3>{c('export.svg_title')}</h3>
              <p>{c('export.svg_body')}</p>
            </article>
          </div>
          <Link className="maker-text-link" href="/create">
            {c('export.action')}
            <ArrowUpRight size={16} />
          </Link>
          <p className="maker-export-note">{c('export.note')}</p>
        </div>
      </div>
    </section>
  );
}
