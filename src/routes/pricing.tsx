import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Pricing, PricingQuestions } from '@/blocks/pricing';

export const Route = createFileRoute('/pricing')({
  validateSearch: (search: Record<string, unknown>) => ({
    billing:
      search.billing === 'monthly'
        ? 'monthly'
        : search.billing === 'pack'
          ? 'pack'
          : undefined,
  }),
  loader: () => {
    const locale = getLocale();
    return {
      title: `${m['maker.pricing.meta_title']({}, { locale })} | ${envConfigs.app_name}`,
      description: m['maker.pricing.description']({}, { locale }),
    };
  },
  head: ({ loaderData }) => ({
    links: [
      {
        rel: 'canonical',
        href: `${new URL(envConfigs.app_url).origin}/pricing`,
      },
    ],
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="maker-page">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Pricing heading="h1" />
        <PricingQuestions />
      </main>
      <Footer />
    </div>
  );
}
