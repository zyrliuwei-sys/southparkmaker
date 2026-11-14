import { createFileRoute } from '@tanstack/react-router';

import { makerSeo } from '@/lib/maker-seo';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { MakerCreate } from '@/blocks/maker-create';

export const Route = createFileRoute('/create')({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === 'ai' ? ('ai' as const) : ('builder' as const),
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
  }),
  head: () => makerSeo('/create'),
  component: CreatePage,
});

function CreatePage() {
  const { mode, prompt } = Route.useSearch();
  return (
    <div className="maker-page">
      <Header />
      <MakerCreate mode={mode} prompt={prompt} />
      <Footer />
    </div>
  );
}
