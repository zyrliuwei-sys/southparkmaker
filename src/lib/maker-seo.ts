import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';

export function makerSeo(path: '/' | '/create') {
  const origin = new URL(envConfigs.app_url).origin;
  const isHome = path === '/';
  const title = isHome
    ? m['common.metadata.title']()
    : m['maker.create.meta_title']();
  const description = isHome
    ? m['common.metadata.description']()
    : m['maker.create.meta_description']();
  const url = `${origin}${path}`;
  const image = `${origin}/brand/social-card.png`;
  const graph = isHome
    ? [
        {
          '@type': 'WebSite',
          '@id': `${origin}/#website`,
          url: `${origin}/`,
          name: envConfigs.app_name,
          inLanguage: 'en',
        },
        {
          '@type': 'WebApplication',
          '@id': `${origin}/#application`,
          url: `${origin}/create`,
          name: `${envConfigs.app_name} ${m['maker.hero.title']()}`,
          description,
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          browserRequirements: m['maker.schema.browser'](),
          inLanguage: 'en',
          image,
          featureList: [
            m['maker.schema.feature_1'](),
            m['maker.schema.feature_2'](),
            m['maker.schema.feature_3'](),
            m['maker.schema.feature_4'](),
            m['maker.schema.feature_5'](),
          ],
        },
      ]
    : [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: envConfigs.app_name,
              item: `${origin}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: m['maker.create.meta_title'](),
              item: url,
            },
          ],
        },
      ];
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: envConfigs.app_name },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: m['maker.seo.social_alt']() },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    links: [{ rel: 'canonical', href: url }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': graph,
        }).replace(/</g, '\\u003c'),
      },
    ],
  };
}
