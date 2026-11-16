import { ArrowUpRight, Download } from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { CHARACTER_EXAMPLES } from '@/lib/character-examples';
import { m } from '@/paraglide/messages.js';
import { CharacterPreview } from '@/components/character-preview';

import '@/styles/character-evidence.css';

export function CharacterEvidence() {
  return (
    <section
      id="examples"
      className="maker-section character-evidence"
      aria-labelledby="character-evidence-title"
    >
      <div className="maker-container">
        <div className="character-evidence-heading">
          <p className="maker-photo-eyebrow">{m['maker.evidence.eyebrow']()}</p>
          <h2 id="character-evidence-title">{m['maker.evidence.title']()}</h2>
          <p>{m['maker.evidence.description']()}</p>
        </div>
        <div className="character-evidence-grid">
          {CHARACTER_EXAMPLES.map((example) => (
            <article key={example.id}>
              <div className="character-evidence-pair">
                <figure>
                  <CharacterPreview
                    options={example.before[0]}
                    characters={example.before}
                    label={tDynamic(`maker.evidence.${example.id}_before_alt`)}
                  />
                  <figcaption>{m['maker.evidence.before']()}</figcaption>
                </figure>
                <figure>
                  <CharacterPreview
                    options={example.after[0]}
                    characters={example.after}
                    label={tDynamic(`maker.evidence.${example.id}_after_alt`)}
                  />
                  <figcaption>{m['maker.evidence.after']()}</figcaption>
                </figure>
              </div>
              <h3>{tDynamic(`maker.evidence.${example.id}_title`)}</h3>
              <p>{tDynamic(`maker.evidence.${example.id}_description`)}</p>
              <Link
                href={`/create?mode=builder&example=${example.id}`}
                className="character-evidence-edit"
              >
                {m['maker.evidence.edit']()}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
              <div className="character-evidence-downloads">
                <Download size={14} aria-hidden="true" />
                <a href={`/examples/${example.id}.png`} download>
                  {m['maker.evidence.png']()}
                </a>
                <a href={`/examples/${example.id}.svg`} download>
                  {m['maker.evidence.svg']()}
                </a>
                <Link
                  href={`/create?mode=builder&example=${example.id}&view=before`}
                >
                  {m['maker.evidence.open_before']()}
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="character-evidence-note">{m['maker.evidence.note']()}</p>
      </div>
    </section>
  );
}
