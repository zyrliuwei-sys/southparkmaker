import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import type { CharacterResolution } from '@/lib/character-pricing';
import { AICharacterGenerator } from '@/blocks/ai-character-generator';
import { CharacterStudio } from '@/blocks/character-studio';

export function MakerCreate({
  mode,
  prompt,
  photo,
  resolution,
  ratio,
}: {
  mode: 'builder' | 'ai';
  prompt?: string;
  photo?: boolean;
  resolution?: CharacterResolution;
  ratio?: '1:1' | '3:4';
}) {
  const [aiOpened, setAiOpened] = useState(mode === 'ai');
  const [lastAIInput, setLastAIInput] = useState({
    prompt,
    photo,
    resolution,
    ratio,
  });
  const hasIncomingAIInput =
    prompt !== undefined ||
    photo === true ||
    resolution !== undefined ||
    ratio !== undefined;
  useEffect(() => {
    if (mode !== 'ai') return;
    setAiOpened(true);
    if (hasIncomingAIInput)
      setLastAIInput({ prompt, photo, resolution, ratio });
  }, [mode, prompt, photo, resolution, ratio, hasIncomingAIInput]);
  const aiInput =
    mode === 'ai' && hasIncomingAIInput
      ? { prompt, photo, resolution, ratio }
      : lastAIInput;
  return (
    <main id="main-content" tabIndex={-1} className="maker-container">
      <div className="maker-create-top">
        <Link className="maker-breadcrumb" href="/">
          <ChevronLeft size={14} />
          {tDynamic('maker.create.back')}
        </Link>
        <div className="maker-create-heading">
          <div>
            <h1>
              {tDynamic(
                mode === 'ai' ? 'maker.create.ai_title' : 'maker.create.title'
              )}
            </h1>
            <p>
              {tDynamic(
                mode === 'ai'
                  ? 'maker.create.ai_description'
                  : 'maker.create.description'
              )}
            </p>
          </div>
          <nav
            className="maker-create-tabs"
            aria-label={tDynamic('maker.create.mode_label')}
          >
            <Link
              href="/create"
              aria-current={mode === 'builder' ? 'page' : false}
              data-selected={mode === 'builder'}
            >
              {tDynamic('maker.nav.builder')}
            </Link>
            <Link
              href="/create?mode=ai"
              aria-current={mode === 'ai' ? 'page' : false}
              data-selected={mode === 'ai'}
            >
              {tDynamic('maker.nav.ai')}
            </Link>
          </nav>
        </div>
      </div>
      <div hidden={mode !== 'ai'}>
        {(aiOpened || mode === 'ai') && (
          <AICharacterGenerator
            key={`${aiInput.prompt}-${aiInput.resolution}-${aiInput.ratio}-${aiInput.photo}`}
            initialPrompt={aiInput.prompt}
            initialPhoto={aiInput.photo}
            initialResolution={aiInput.resolution}
            initialRatio={aiInput.ratio}
          />
        )}
      </div>
      <div hidden={mode !== 'builder'} className="py-8 pb-20">
        <CharacterStudio />
      </div>
      <Link className="maker-create-help" href="/#character-guide">
        {tDynamic('maker.create.guide_link')}
      </Link>
    </main>
  );
}
