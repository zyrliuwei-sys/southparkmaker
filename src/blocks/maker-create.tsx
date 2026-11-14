import { ChevronLeft } from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { AICharacterGenerator } from '@/blocks/ai-character-generator';
import { CharacterStudio } from '@/blocks/character-studio';

export function MakerCreate({
  mode,
  prompt,
}: {
  mode: 'builder' | 'ai';
  prompt?: string;
}) {
  return (
    <main className="maker-container">
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
              aria-current={mode === 'builder' ? 'page' : undefined}
            >
              {tDynamic('maker.nav.builder')}
            </Link>
            <Link
              href="/create?mode=ai"
              aria-current={mode === 'ai' ? 'page' : undefined}
            >
              {tDynamic('maker.nav.ai')}
            </Link>
          </nav>
        </div>
      </div>
      {mode === 'ai' ? (
        <AICharacterGenerator key={prompt} initialPrompt={prompt} />
      ) : (
        <div className="py-8 pb-20">
          <CharacterStudio />
        </div>
      )}
      <Link className="maker-create-help" href="/#character-guide">
        {tDynamic('maker.create.guide_link')}
      </Link>
    </main>
  );
}
