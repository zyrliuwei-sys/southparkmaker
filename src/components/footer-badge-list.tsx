import { getRouteApi } from '@tanstack/react-router';
import { DEFAULT_FOOTER_BADGES } from '@/features/footer-badges/defaults';
import type { FooterBadge } from '@/features/footer-badges/types';
import { parseStoredFooterBadges } from '@/features/footer-badges/validation';

import { cn } from '@/lib/utils';
import { usePublicConfig } from '@/hooks/use-public-config';
import { FooterBadgeLink } from '@/components/footer-badge-link';

const rootRoute = getRouteApi('__root__');

export function FooterBadgeList({ className }: { className?: string }) {
  const { data } = usePublicConfig();
  const ssrStored = rootRoute.useLoaderData({ select: (d) => d.footerBadges });
  const stored = data ? data.footer_badges : (ssrStored ?? undefined);
  const source =
    stored === undefined
      ? DEFAULT_FOOTER_BADGES
      : parseStoredFooterBadges(stored);
  return <FooterBadgeLinks badges={source} className={className} />;
}

/** Keep one real link per destination while the single row scrolls. */
export function FooterBadgeLinks({
  badges: source,
  className,
}: {
  badges: FooterBadge[];
  className?: string;
}) {
  const seen = new Set<string>();
  const badges = source.filter((badge) => {
    const url = new URL(badge.href);
    url.hash = '';
    const key = `${url.origin}${url.pathname.replace(/\/+$/, '')}${url.search}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!badges.length) return null;
  return (
    <div className={cn('badge-marquee w-full', className)}>
      <ul className="badge-marquee-track">
        {badges.map((badge) => (
          <li key={badge.href} className="shrink-0">
            <FooterBadgeLink
              badge={badge}
              className="flex min-h-11 items-center text-sm whitespace-nowrap transition-opacity hover:opacity-75"
              imageClassName="max-h-10 w-auto max-w-[220px] object-contain"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
