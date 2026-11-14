import { ArrowUpRight, MoveHorizontal } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { useCharacterCapabilities } from '@/hooks/use-character-capabilities';
import { PhotoComparison } from '@/components/photo-comparison';

import '@/styles/photo-comparisons.css';

export function PhotoComparisons() {
  const capabilities = useCharacterCapabilities();
  const examples = [
    {
      id: 'purple-glasses',
      title: m['maker.comparisons.purple_title'](),
      description: m['maker.comparisons.purple_description'](),
      beforeAlt: m['maker.comparisons.purple_before_alt'](),
      afterAlt: m['maker.comparisons.purple_after_alt'](),
      objectPosition: '45% center',
    },
    {
      id: 'yellow-beanie',
      title: m['maker.comparisons.yellow_title'](),
      description: m['maker.comparisons.yellow_description'](),
      beforeAlt: m['maker.comparisons.yellow_before_alt'](),
      afterAlt: m['maker.comparisons.yellow_after_alt'](),
      objectPosition: 'center',
    },
    {
      id: 'orange-shirt',
      title: m['maker.comparisons.orange_title'](),
      description: m['maker.comparisons.orange_description'](),
      beforeAlt: m['maker.comparisons.orange_before_alt'](),
      afterAlt: m['maker.comparisons.orange_after_alt'](),
      objectPosition: 'center',
    },
  ];

  return (
    <section
      id="photo-transformations"
      className="maker-section maker-photo-section"
      aria-labelledby="photo-transformations-title"
    >
      <div className="maker-container">
        <div className="maker-photo-heading">
          <div>
            <p className="maker-photo-eyebrow">
              {m['maker.comparisons.eyebrow']()}
            </p>
            <h2 id="photo-transformations-title">
              {m['maker.comparisons.title']()}
            </h2>
          </div>
          <div className="maker-photo-intro">
            <p>{m['maker.comparisons.description']()}</p>
            <p
              id="photo-comparison-instructions"
              className="maker-photo-instructions"
            >
              <MoveHorizontal size={16} aria-hidden="true" />
              {m['maker.comparisons.instructions']()}
            </p>
          </div>
        </div>

        <div className="maker-photo-grid">
          {examples.map((example, index) => (
            <figure className="maker-photo-example" key={example.id}>
              <PhotoComparison
                before={{
                  src: `/imgs/comparisons/${example.id}-photo.jpg`,
                  alt: example.beforeAlt,
                  objectPosition: example.objectPosition,
                }}
                after={{
                  src: `/imgs/comparisons/${example.id}-cartoon.jpg`,
                  alt: example.afterAlt,
                }}
                beforeLabel={m['maker.comparisons.before']()}
                afterLabel={m['maker.comparisons.after']()}
                sliderLabel={m['maker.comparisons.slider_label']({
                  name: example.title,
                })}
                instructionsId="photo-comparison-instructions"
              />
              <figcaption className="maker-photo-caption">
                <span className="maker-photo-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h3>{example.title}</h3>
                  <p>{example.description}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="maker-photo-footer">
          <p>
            {capabilities.data?.photoEnabled
              ? m['maker.comparisons.note']()
              : m['maker.comparisons.text_only_note']()}
          </p>
          <Link href="/create?mode=ai" className="maker-photo-action">
            {capabilities.data?.photoEnabled
              ? m['maker.comparisons.action']()
              : m['maker.comparisons.text_only_action']()}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
