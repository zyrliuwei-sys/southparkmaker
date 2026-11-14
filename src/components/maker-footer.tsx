import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export function MakerFooter({
  brand,
  description,
  columns,
  copyright,
  disclaimer,
}: {
  brand: string;
  description: string;
  columns: { title: string; links: { href: string; label: string }[] }[];
  copyright: string;
  disclaimer: string;
}) {
  return (
    <footer className="maker-footer">
      <div className="maker-color-rule" />
      <div className="maker-container maker-footer-grid">
        <div className="maker-footer-brand">
          <Link href="/" className="maker-brand">
            <img src="/logo.svg" width="38" height="38" alt="" />
            <span>{brand}</span>
          </Link>
          <p>{description}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="maker-footer-column">
            <h3>{column.title}</h3>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="maker-container maker-footer-bottom">
        <p>{copyright}</p>
        <p>{disclaimer}</p>
      </div>
    </footer>
  );
}
