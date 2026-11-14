import { useState, type ReactNode } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export function MakerHeader({
  brand,
  links,
  loginLabel,
  startLabel,
  openLabel,
  closeLabel,
  account,
}: {
  brand: string;
  links: { href: string; label: string }[];
  loginLabel: string;
  startLabel: string;
  openLabel: string;
  closeLabel: string;
  account?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="maker-header">
      <div className="maker-container maker-header-inner">
        <Link href="/" className="maker-brand" aria-label={brand}>
          <img src="/logo.svg" width="38" height="38" alt="" />
          <span>{brand}</span>
        </Link>
        <nav className="maker-desktop-nav" aria-label={brand}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="maker-header-actions">
          {account || (
            <Link href="/sign-in" className="maker-login">
              {loginLabel}
            </Link>
          )}
          <Link href="/create" className="maker-button maker-button-ink">
            {startLabel}
            <ArrowUpRight size={16} />
          </Link>
          <button
            type="button"
            className="maker-menu-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? closeLabel : openLabel}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="maker-mobile-nav" aria-label={brand}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/sign-in" onClick={() => setOpen(false)}>
            {loginLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}
