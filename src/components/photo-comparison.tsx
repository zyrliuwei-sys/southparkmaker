type ComparisonImage = {
  src: string;
  alt: string;
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
      ].map(({ src, alt, label }) => (
        <div key={src}>
          <img
            className="maker-photo-comparison-image"
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
