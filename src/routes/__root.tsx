/// <reference types="vite/client" />
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ThemeProvider } from 'next-themes';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import {
  APPEARANCE_CONFIG_KEYS,
  APPEARANCE_ENABLED_KEY,
  APPEARANCE_KEYS,
  appearanceStyle,
  COLOR_MODE_CONFIG_KEY,
  DEFAULT_APPEARANCE,
  DEFAULT_COLOR_MODE,
  isColorMode,
  mergeAppearance,
  pickAppearance,
  THEME_COOKIE,
} from '@/config/appearance';
import { parseCookieConsent } from '@/lib/cookie-consent';
import { getQueryClient } from '@/lib/query-client';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { useAppearance } from '@/hooks/use-appearance';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { CookieConsent } from '@/blocks/cookie-consent';
import { Ads } from '@/components/analytics/ads';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { OperationsTracker } from '@/components/analytics/operations-tracker';
import { Plausible } from '@/components/analytics/plausible';
import { CustomerService } from '@/components/customer-service';
import { GoogleOneTap } from '@/components/google-one-tap';
import { SandboxPreviewBridge } from '@/components/sandbox-preview-bridge';
import { Toaster } from '@/components/ui/sonner';

import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/manrope';
import '@fontsource-variable/nunito';
import '@fontsource-variable/source-serif-4';
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@/styles/globals.css';

// Analytics IDs live in the DB config (1h-cached service). Fetched via a
// server function so drizzle/db code never reaches the client bundle.
const getAnalyticsConfigs = createServerFn().handler(async () => {
  const { getAllConfigs } = await import('@/modules/config/service');
  const { getStoredFooterBadges } =
    await import('@/modules/footer-badges/service');
  const { getCookie } = await import('@tanstack/react-start/server');
  const { safeEmbedSetting } = await import('@/lib/embed-ids');
  const [configs, storedFooterBadges] = await Promise.all([
    getAllConfigs(),
    getStoredFooterBadges(),
  ]);
  // Hosts come from the template trust list and runtime PLAUSIBLE_SCRIPT_HOSTS. A
  // configured src that fails it turns Plausible off rather than falling
  // back to the plausible.io script.
  const rawPlausibleSrc = configs.plausible_src?.trim() || '';
  const plausibleSrc = safeEmbedSetting('plausible_src', rawPlausibleSrc);
  const plausibleOff = !!rawPlausibleSrc && !plausibleSrc;
  const cookieConsentEnabled = configs.cookie_consent_enabled === 'true';
  // Appearance: off by default, and then the code's own styles apply
  // untouched. On: the admin's site settings; users may override only the
  // theme color (cookie) when allowed. Everything goes through the allow-list.
  const appearanceEnabled = configs[APPEARANCE_ENABLED_KEY] === 'true';
  const userThemeEnabled =
    appearanceEnabled && configs.user_theme_enabled === 'true';
  const site = pickAppearance(
    appearanceEnabled
      ? Object.fromEntries(
          APPEARANCE_KEYS.map((k) => [k, configs[APPEARANCE_CONFIG_KEYS[k]]])
        )
      : {}
  );
  const user = pickAppearance({
    theme: userThemeEnabled ? getCookie(THEME_COOKIE) : undefined,
  });
  const siteAppearance = mergeAppearance(site, DEFAULT_APPEARANCE);
  const rawColorMode = configs[COLOR_MODE_CONFIG_KEY];
  const colorMode =
    appearanceEnabled && isColorMode(rawColorMode)
      ? rawColorMode
      : DEFAULT_COLOR_MODE;
  return {
    footerBadges: storedFooterBadges ?? null,
    appearanceEnabled,
    colorMode,
    colorModeForced:
      appearanceEnabled && !userThemeEnabled && colorMode !== 'system',
    appearance: mergeAppearance(user, siteAppearance),
    siteAppearance,
    userTheme: user.theme,
    userThemeEnabled,
    cookieConsentEnabled,
    // The visitor's saved choice, so SSR can render consented scripts.
    cookieConsent: cookieConsentEnabled
      ? parseCookieConsent(getCookie('cookie_consent'))
      : null,
    gaId: configs.google_analytics_id?.trim() || '',
    plausibleDomain: plausibleOff ? '' : configs.plausible_domain?.trim() || '',
    plausibleSrc,
    adsenseCode: configs.adsense_code?.trim() || '',
    crispWebsiteId:
      configs.crisp_enabled === 'true'
        ? configs.crisp_website_id?.trim() || ''
        : '',
    tawkPropertyId:
      configs.tawk_enabled === 'true'
        ? configs.tawk_property_id?.trim() || ''
        : '',
    tawkWidgetId:
      configs.tawk_enabled === 'true'
        ? configs.tawk_widget_id?.trim() || ''
        : '',
  };
});

export const Route = createRootRoute({
  loader: () => getAnalyticsConfigs(),
  head: () => {
    // This project is English-only. Each public page owns its canonical URL.
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: envConfigs.app_name },
        { name: 'description', content: envConfigs.app_description },
      ],
      links: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
      ],
    };
  },
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootComponent() {
  const analytics = Route.useLoaderData();
  const consentEnabled = !!analytics?.cookieConsentEnabled;
  const consent = useCookieConsent(analytics?.cookieConsent ?? null);
  // With the banner on, ad scripts wait for an explicit "accept".
  const adsAllowed = !consentEnabled || consent === 'accepted';

  return (
    <QueryClientProvider client={getQueryClient()}>
      <ThemeProvider
        attribute="class"
        defaultTheme={analytics?.colorMode ?? DEFAULT_COLOR_MODE}
        forcedTheme={
          analytics?.colorModeForced ? analytics.colorMode : undefined
        }
        enableSystem
        disableTransitionOnChange
      >
        <Outlet />
        <OperationsTracker
          allowed={!consentEnabled || consent === 'accepted'}
        />
        <SandboxPreviewBridge />
        {/* Appearance on: toasts follow the theme (globals.css). */}
        <Toaster
          position="top-center"
          richColors={!analytics?.appearanceEnabled}
        />
        <GoogleOneTap />
        {analytics?.gaId ? (
          <GoogleAnalytics
            measurementId={analytics.gaId}
            consentMode={consentEnabled}
          />
        ) : null}
        {analytics?.plausibleDomain || analytics?.plausibleSrc ? (
          <Plausible
            domain={analytics.plausibleDomain}
            src={analytics.plausibleSrc || undefined}
          />
        ) : null}
        {analytics?.adsenseCode ? (
          <Ads code={analytics.adsenseCode} loadScript={adsAllowed} />
        ) : null}
        <CustomerService
          crispWebsiteId={analytics?.crispWebsiteId || undefined}
          tawkPropertyId={analytics?.tawkPropertyId || undefined}
          tawkWidgetId={analytics?.tawkWidgetId || undefined}
        />
        {consentEnabled ? (
          <CookieConsent initial={analytics?.cookieConsent ?? null} />
        ) : null}
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const { appearance, appearanceEnabled } = useAppearance();
  return (
    <html
      lang={getLocale()}
      data-theme={appearanceEnabled ? appearance.theme : undefined}
      style={appearanceEnabled ? appearanceStyle(appearance) : undefined}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="maker-page maker-status-page">
      <Link href="/" className="maker-brand">
        <img src="/logo.svg" width="36" height="36" alt="" />
        {envConfigs.app_name}
      </Link>
      <p className="maker-status-code">404</p>
      <h1>{m['common.not_found.title']()}</h1>
      <p>{m['common.not_found.description']()}</p>
      <div className="maker-status-actions">
        <Link href="/create" className="maker-button maker-button-primary">
          {m['common.not_found.create']()}
        </Link>
        <Link href="/" className="maker-button maker-button-outline">
          {m['common.not_found.home']()}
        </Link>
      </div>
    </main>
  );
}

function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <main className="maker-page maker-status-page">
      <Link href="/" className="maker-brand">
        <img src="/logo.svg" width="36" height="36" alt="" />
        {envConfigs.app_name}
      </Link>
      <h1>{m['common.error.title']()}</h1>
      <p>{m['common.error.description']()}</p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="bg-muted mt-2 max-w-lg overflow-auto rounded p-4 text-xs">
          {error.message}
        </pre>
      )}
      <div className="maker-status-actions">
        <button
          type="button"
          onClick={reset}
          className="maker-button maker-button-primary"
        >
          {m['common.error.retry']()}
        </button>
        <Link href="/" className="maker-button maker-button-outline">
          {m['common.not_found.home']()}
        </Link>
      </div>
    </main>
  );
}
