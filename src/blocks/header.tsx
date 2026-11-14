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
      skipLabel={tDynamic('maker.nav.skip')}
      links={[
        { href: '/#gallery', label: tDynamic('maker.nav.gallery') },
        { href: '/#character-guide', label: tDynamic('maker.nav.guide') },
        { href: '/pricing', label: tDynamic('maker.nav.pricing') },
      ]}
      loginLabel={tDynamic('maker.nav.login')}
      startLabel={tDynamic('maker.nav.start')}
      openLabel={tDynamic('maker.nav.menu_open')}
      closeLabel={tDynamic('maker.nav.menu_close')}
      accountLink={
        session?.user
          ? { href: '/settings', label: tDynamic('maker.nav.account') }
          : undefined
      }
      account={
        session?.user ? (
          <SiteUserMenu
            label={tDynamic('maker.nav.account')}
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
          />
        ) : undefined
      }
    />
  );
}
