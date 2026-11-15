import { createFileRoute } from '@tanstack/react-router';

import { EXPRESSIONS, OUTFIT_COLORS } from '@/lib/character';
import { CHARACTER_EXAMPLES } from '@/lib/character-examples';
import { CHARACTER_RESOLUTIONS } from '@/lib/character-pricing';
import { makerSeo } from '@/lib/maker-seo';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { MakerCreate } from '@/blocks/maker-create';

export const Route = createFileRoute('/create')({
  validateSearch: (search: Record<string, unknown>) => ({
    example: CHARACTER_EXAMPLES.some((item) => item.id === search.example)
      ? (search.example as string)
      : undefined,
    view: search.view === 'before' ? ('before' as const) : undefined,
    mode:
      search.mode === 'ai'
        ? ('ai' as const)
        : search.mode === 'builder'
          ? ('builder' as const)
          : undefined,
    prompt:
      typeof search.prompt === 'string'
        ? search.prompt.slice(0, 1500)
        : undefined,
    preset:
      (typeof search.preset === 'string' ||
        typeof search.preset === 'number') &&
      /^[0-5]$/.test(String(search.preset))
        ? Number(search.preset)
        : undefined,
    photo: search.photo === '1' || search.photo === 1 ? 1 : undefined,
    resolution: CHARACTER_RESOLUTIONS.includes(search.resolution as any)
      ? (search.resolution as (typeof CHARACTER_RESOLUTIONS)[number])
      : undefined,
    ratio:
      search.ratio === '3:4'
        ? ('3:4' as const)
        : search.ratio === '1:1'
          ? ('1:1' as const)
          : undefined,
    outfitColor: OUTFIT_COLORS.includes(search.outfitColor as any)
      ? (search.outfitColor as (typeof OUTFIT_COLORS)[number])
      : undefined,
    expression: EXPRESSIONS.includes(search.expression as any)
      ? (search.expression as (typeof EXPRESSIONS)[number])
      : undefined,
  }),
  head: () => makerSeo('/create'),
  component: CreatePage,
});

function CreatePage() {
  const { mode, prompt, photo, resolution, ratio } = Route.useSearch();
  return (
    <div className="maker-page">
      <Header />
      <MakerCreate
        mode={mode ?? 'builder'}
        prompt={prompt}
        photo={photo === 1}
        resolution={resolution}
        ratio={ratio}
      />
      <Footer />
    </div>
  );
}
