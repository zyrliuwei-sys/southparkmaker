import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/dynamic';
import { envConfigs } from '@/config';
import { MakerHeader } from '@/components/maker-header';
import { SiteUserMenu } from '@/components/site-user-menu';

export function Header() {
  const { data: session } = useSession();
  return (
    <MakerHeader
      brand={envConfigs.app_name}
      links={[
        { href: '/#gallery', label: tDynamic('maker.nav.gallery') },
        { href: '/#how-it-works', label: tDynamic('maker.nav.how') },
        { href: '/#character-guide', label: tDynamic('maker.nav.guide') },
        { href: '/pricing', label: tDynamic('maker.nav.pricing') },
        { href: '/#faq', label: tDynamic('maker.nav.faq') },
      ]}
      loginLabel={tDynamic('maker.nav.login')}
      startLabel={tDynamic('maker.nav.start')}
      openLabel={tDynamic('maker.nav.menu_open')}
      closeLabel={tDynamic('maker.nav.menu_close')}
      account={
        session?.user ? (
          <SiteUserMenu
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
          />
        ) : undefined
      }
    />
  );
}
