import { tDynamic } from '@/core/i18n/dynamic';
import { envConfigs } from '@/config';
import { FooterBadgeList } from '@/components/footer-badge-list';
import { MakerFooter } from '@/components/maker-footer';

export function Footer() {
  return (
    <MakerFooter
      brand={envConfigs.app_name}
      badges={<FooterBadgeList className="py-6" />}
      signature={tDynamic('maker.footer.signature')}
      description={tDynamic('maker.footer.description')}
      columns={[
        {
          title: tDynamic('maker.footer.create'),
          links: [
            { href: '/create', label: tDynamic('maker.nav.builder') },
            { href: '/create?mode=ai', label: tDynamic('maker.nav.ai') },
            { href: '/pricing', label: tDynamic('maker.nav.pricing') },
            { href: '/#examples', label: tDynamic('maker.nav.gallery') },
            { href: '/#how-it-works', label: tDynamic('maker.nav.how') },
          ],
        },
        {
          title: tDynamic('maker.footer.useful'),
          links: [
            {
              href: `mailto:${tDynamic('common.support.email')}`,
              label: tDynamic('common.support.open_label'),
            },
            { href: '/#faq', label: tDynamic('maker.nav.faq') },
            { href: '/#character-guide', label: tDynamic('maker.nav.guide') },
            { href: '/settings', label: tDynamic('maker.nav.account') },
            {
              href: '/privacy-policy',
              label: tDynamic('landing.footer.privacy'),
            },
            {
              href: '/terms-of-service',
              label: tDynamic('landing.footer.terms'),
            },
          ],
        },
      ]}
      copyright={`© ${new Date().getFullYear()} ${envConfigs.app_name}. ${tDynamic('maker.footer.copyright')}`}
      disclaimer={tDynamic('maker.footer.disclaimer')}
    />
  );
}
