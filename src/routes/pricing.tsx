import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Pricing } from '@/blocks/pricing';

export const Route = createFileRoute('/pricing')({
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
      <main className="flex-1">
        <Pricing heading="h1" />
      </main>
      <Footer />
    </div>
  );
}
