import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { FooterBadgeLinks } from '../src/components/footer-badge-list';

test('footer DOM exposes one link per external destination with no hidden marquee copies', () => {
  const badges = [
    {
      href: 'https://realisticai.io/',
      text: 'Realistic AI',
      alt: 'Realistic AI',
    },
    {
      href: 'https://realisticai.io/#top',
      text: 'Realistic AI',
      alt: 'Realistic AI',
    },
    {
      href: 'https://www.wt.ai/',
      text: 'WTAI Navigation',
      alt: 'WTAI Navigation',
      rel: 'nofollow',
    },
    {
      href: 'https://www.wt.ai',
      text: 'WTAI Navigation',
      alt: 'WTAI Navigation',
    },
  ];
  const html = renderToStaticMarkup(
    createElement(FooterBadgeLinks, { badges })
  );
  assert.equal((html.match(/<a\b/g) || []).length, 2);
  assert.equal((html.match(/WTAI Navigation/g) || []).length, 1);
  assert.equal((html.match(/Realistic AI/g) || []).length, 1);
  assert.doesNotMatch(html, /aria-hidden|tabindex="-1"/);
  assert.match(html, /nofollow/);
});
