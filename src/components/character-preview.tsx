import { useMemo } from 'react';

import { characterSvg, type CharacterOptions } from '@/lib/character';
import { cn } from '@/lib/utils';

export function CharacterPreview({
  options,
  className,
  label,
}: {
  options: CharacterOptions;
  className?: string;
  label?: string;
}) {
  const markup = useMemo(() => characterSvg(options), [options]);
  return (
    <div
      className={cn(
        'character-art aspect-square w-full overflow-hidden [&>svg]:block [&>svg]:size-full',
        className
      )}
      role="img"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
