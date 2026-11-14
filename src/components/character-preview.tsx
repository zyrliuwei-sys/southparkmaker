import { useMemo } from 'react';

import { characterSvg, type CharacterOptions } from '@/lib/character';
import { cn } from '@/lib/utils';

export function CharacterPreview({
  options,
  className,
  label,
  interactive = false,
}: {
  options: CharacterOptions;
  className?: string;
  label?: string;
  interactive?: boolean;
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
      onPointerMove={
        interactive
          ? (event) => {
              if (
                event.pointerType === 'touch' ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
              )
                return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = Math.max(
                -4,
                Math.min(
                  4,
                  ((event.clientX - rect.left) / rect.width - 0.5) * 10
                )
              );
              const y = Math.max(
                -3,
                Math.min(
                  3,
                  ((event.clientY - rect.top) / rect.height - 0.36) * 8
                )
              );
              event.currentTarget
                .querySelector('[data-character-pupils]')
                ?.setAttribute('transform', `translate(${x} ${y})`);
            }
          : undefined
      }
      onPointerLeave={
        interactive
          ? (event) =>
              event.currentTarget
                .querySelector('[data-character-pupils]')
                ?.removeAttribute('transform')
          : undefined
      }
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
