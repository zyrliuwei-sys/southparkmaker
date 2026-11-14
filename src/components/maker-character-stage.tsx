import { RefreshCw, Smile } from 'lucide-react';

import { OUTFIT_COLORS, type CharacterOptions } from '@/lib/character';
import { CharacterPreview } from '@/components/character-preview';

export type CharacterStageCopy = {
  label: string;
  format: string;
  name: string;
  hint: string;
  colors: string;
  colorNames: string[];
  expressionAction: string;
  expressionNames: Record<CharacterOptions['expression'], string>;
};
export function MakerCharacterStage({
  options,
  companions,
  copy,
  onColor,
  onExpression,
  disabled = false,
}: {
  options: CharacterOptions;
  companions: CharacterOptions[];
  copy: CharacterStageCopy;
  onColor: (value: CharacterOptions['outfitColor']) => void;
  onExpression: () => void;
  disabled?: boolean;
}) {
  return (
    <figure className="atelier-stage" data-interactive={!disabled}>
      <div className="atelier-stage-label">
        <span>{copy.label}</span>
        <span>{copy.format}</span>
      </div>
      <div className="atelier-stage-landscape" aria-hidden="true">
        <span className="atelier-mountain atelier-mountain-back" />
        <span className="atelier-mountain atelier-mountain-front" />
        <span className="atelier-stage-ground" />
      </div>
      <div className="atelier-cast" aria-hidden="true">
        {companions.map((character, index) => (
          <CharacterPreview
            key={index}
            className={`atelier-companion atelier-companion-${index}`}
            options={{ ...character, background: 'transparent' }}
          />
        ))}
      </div>
      <CharacterPreview
        className="atelier-stage-character"
        options={{ ...options, background: 'transparent' }}
        interactive={!disabled}
        label={`${copy.name}, ${copy.expressionNames[options.expression]}`}
      />
      <figcaption className="atelier-stage-caption">
        <div>
          <strong>{copy.name}</strong>
          <p>{copy.hint}</p>
        </div>
        <div className="atelier-stage-tools">
          <div
            className="atelier-color-options"
            role="group"
            aria-label={copy.colors}
          >
            {[1, 0, 3, 2].map((index, position) => (
              <button
                type="button"
                key={index}
                aria-label={copy.colorNames[position]}
                aria-pressed={options.outfitColor === OUTFIT_COLORS[index]}
                disabled={disabled}
                onClick={() => onColor(OUTFIT_COLORS[index])}
              >
                <span style={{ backgroundColor: OUTFIT_COLORS[index] }} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="atelier-expression"
            aria-label={`${copy.expressionAction}: ${copy.expressionNames[options.expression]}`}
            onClick={onExpression}
            disabled={disabled}
          >
            <Smile size={17} />
            <span>{copy.expressionNames[options.expression]}</span>
            <RefreshCw size={13} />
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
