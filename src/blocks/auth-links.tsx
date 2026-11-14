import { useLocation } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { authReturnQuery } from '@/lib/redirect';
import { m } from '@/paraglide/messages.js';

export function AuthLinks() {
  const query = useLocation({
    select: (location) =>
      authReturnQuery(location.search as Record<string, unknown>),
  });
  return (
    <nav className="maker-auth-links" aria-label={m['maker.auth.help_label']()}>
      <div>
        <Link href="/create">{m['maker.auth.free_builder']()}</Link>
        <Link href={`/forgot-password${query}`}>
          {m['common.sign.sign_in_help']()}
        </Link>
      </div>
      <div>
        {[
          { href: '/privacy-policy', label: m['landing.footer.privacy']() },
          { href: '/terms-of-service', label: m['landing.footer.terms']() },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={m['common.links.new_tab']({ title: link.label })}
          >
            {link.label}
            <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
