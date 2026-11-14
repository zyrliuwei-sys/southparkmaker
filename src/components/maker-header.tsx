import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  accountLink,
  skipLabel,
}: {
  brand: string;
  links: { href: string; label: string }[];
  loginLabel: string;
  startLabel: string;
  openLabel: string;
  closeLabel: string;
  account?: ReactNode;
  accountLink?: { href: string; label: string };
  skipLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);
  return (
    <header className="maker-header" ref={headerRef}>
      <a
        className="atelier-skip-link"
        href="#main-content"
        onClick={(event) => {
          const main = document.querySelector('main');
          if (main) {
            event.preventDefault();
            main.tabIndex = -1;
            main.focus({ preventScroll: true });
            main.scrollIntoView();
          }
        }}
      >
        {skipLabel}
      </a>
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
            ref={menuRef}
            type="button"
            className="maker-menu-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? closeLabel : openLabel}
            aria-expanded={open}
            aria-controls="maker-mobile-navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="maker-mobile-navigation"
          className="maker-mobile-nav"
          aria-label={brand}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={accountLink?.href ?? '/sign-in'}
            onClick={() => setOpen(false)}
          >
            {accountLink?.label ?? loginLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}
