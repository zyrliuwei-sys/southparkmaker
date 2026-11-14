import { m } from '@/paraglide/messages.js';

/** The public document summaries shared by the plain-text discovery endpoints. */
export function publicPageDirectory() {
  return [
    {
      path: '',
      title: m['maker.hero.title'](),
      description: m['common.metadata.description'](),
    },
    {
      path: '/create',
      title: m['maker.nav.builder'](),
      description: m['maker.create.meta_description'](),
    },
    {
      path: '/pricing',
      title: m['maker.nav.pricing'](),
      description: m['maker.pricing.description'](),
    },
    {
      path: '/blog',
      title: m['blog.title'](),
      description: m['blog.description'](),
    },
    {
      path: '/privacy-policy',
      title: m['landing.footer.privacy'](),
      description: m['maker.directory.privacy_description'](),
    },
    {
      path: '/terms-of-service',
      title: m['landing.footer.terms'](),
      description: m['maker.directory.terms_description'](),
    },
  ];
}
