import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';

export function MakerLegal({ children }: { children: ReactNode }) {
  return (
    <div className="maker-page">
      <Header />
      <main className="maker-container maker-legal-layout">
        <aside className="maker-legal-nav">
          <h2>{m['maker.legal.title']()}</h2>
          <p>{m['maker.legal.description']()}</p>
          <nav aria-label={m['maker.legal.nav']()}>
            <Link href="/">
              <ArrowLeft className="mr-2 inline" size={13} />
              {m['common.pages.back_to_home']()}
            </Link>
            <Link href="/privacy-policy">{m['landing.footer.privacy']()}</Link>
            <Link href="/terms-of-service">{m['landing.footer.terms']()}</Link>
          </nav>
        </aside>
        <div className="maker-legal-content">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
