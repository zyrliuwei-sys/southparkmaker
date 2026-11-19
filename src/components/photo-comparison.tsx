type ComparisonImage = {
  src: string;
  alt: string;
  fullBleed?: boolean;
};

export function PhotoComparison({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: ComparisonImage;
  after: ComparisonImage;
  beforeLabel: string;
  afterLabel: string;
}) {
  return (
    <div className="maker-photo-comparison">
      {[
        { ...before, label: beforeLabel },
        { ...after, label: afterLabel },
      ].map(({ src, alt, label, fullBleed }) => (
        <div key={src}>
          <img
            className="maker-photo-comparison-image"
            data-full-bleed={fullBleed || undefined}
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
          />
          <span className="maker-photo-comparison-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
