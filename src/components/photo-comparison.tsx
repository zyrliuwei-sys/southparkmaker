import { useState, type CSSProperties } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

type ComparisonImage = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export function PhotoComparison({
  before,
  after,
  beforeLabel,
  afterLabel,
  sliderLabel,
  instructionsId,
}: {
  before: ComparisonImage;
  after: ComparisonImage;
  beforeLabel: string;
  afterLabel: string;
  sliderLabel: string;
  instructionsId?: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <div
      className="maker-photo-comparison"
      style={{ '--comparison-position': `${position}%` } as CSSProperties}
    >
      <img
        className="maker-photo-comparison-image"
        src={after.src}
        alt={after.alt}
        style={{ objectPosition: after.objectPosition }}
        width="1122"
        height="1402"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <img
        className="maker-photo-comparison-image maker-photo-comparison-original"
        src={before.src}
        alt={before.alt}
        style={{ objectPosition: before.objectPosition }}
        width="1122"
        height="1402"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className="maker-photo-comparison-labels" aria-hidden="true">
        <span style={{ opacity: position < 15 ? 0 : 1 }}>{beforeLabel}</span>
        <span style={{ opacity: position > 85 ? 0 : 1 }}>{afterLabel}</span>
      </div>
      <div className="maker-photo-comparison-divider" aria-hidden="true">
        <span>
          <ChevronsLeftRight size={21} strokeWidth={1.8} />
        </span>
      </div>
      <input
        className="maker-photo-comparison-range"
        type="range"
        min="0"
        max="100"
        step="1"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={sliderLabel}
        aria-describedby={instructionsId}
        aria-valuetext={`${position}% ${beforeLabel}, ${100 - position}% ${afterLabel}`}
      />
    </div>
  );
}
