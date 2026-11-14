import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/dynamic';
import { Link, useRouter } from '@/core/i18n/navigation';
import { characterProducts } from '@/config/pricing';
import { apiPost } from '@/lib/api-client';
import { characterCreditCost } from '@/lib/character-pricing';
import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { MakerPricing } from '@/components/maker-pricing';
import {
  PaymentProviderModal,
  type PaymentProvider,
} from '@/components/payment-provider-modal';

const c = (key: string) => tDynamic(`maker.pricing.${key}`);
const providers: PaymentProvider[] = ['stripe', 'creem', 'paypal'];
export function Pricing({ heading = 'h2' }: { heading?: 'h1' | 'h2' } = {}) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const configQuery = usePublicConfig();
  const { data: configs, isPending: configPending } = configQuery;
  const initialGroup = useLocation({
    select: (location) =>
      (location.search as Record<string, unknown>).billing === 'monthly'
        ? 'monthly'
        : 'pack',
  });
  const [pendingId, setPendingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] =
    useState<PaymentProvider | null>(null);
  const enabled = providers.filter((p) => configs?.[`${p}_enabled`] === 'true');
  const checkout = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider: PaymentProvider }) =>
      apiPost<{ checkout_url: string }>('/api/payment/checkout', {
        product_id: id,
        payment_provider: provider,
        redirect: '/create?mode=ai',
        locale: 'en',
      }),
    onSuccess: (data) => {
      if (data.checkout_url) window.location.assign(data.checkout_url);
      else {
        toast.error(c('checkout_error'));
        setLoadingProvider(null);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setLoadingProvider(null);
    },
  });
  const groups = ['pack', 'monthly'].map((kind) => ({
    id: kind,
    label: c(kind),
    note: c(`${kind}_note`),
    plans: characterProducts
      .filter((p) => p.productId.endsWith(`_${kind}`))
      .map((p, index) => ({
        id: p.productId,
        name: c(`name_${index + 1}`),
        description: c(`description_${index + 1}`),
        price: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: p.currency,
          maximumFractionDigits: 0,
        }).format(p.priceInCents / 100),
        interval: c(`${kind}_interval`),
        credits: m['maker.pricing.credits']({
          count: p.credits.toLocaleString('en-US'),
        }),
        generations: m['maker.pricing.generations']({
          count: Math.floor(
            p.credits / characterCreditCost('1K')
          ).toLocaleString('en-US'),
        }),
        expiry: c(`${kind}_expiry`),
        action: c(`${kind}_action`),
        featured: index === 1,
        features: [c('feature_1'), c('feature_2'), c('feature_3')],
      })),
  }));
  function choose(id: string) {
    if (!enabled.length) {
      toast.error(c('checkout_unavailable'));
      return;
    }
    if (!session?.user) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(`/pricing?billing=${id.endsWith('_monthly') ? 'monthly' : 'pack'}`)}`
      );
      return;
    }
    setPendingId(id);
    if (enabled.length > 1 && configs?.select_payment_enabled === 'true') {
      setModalOpen(true);
      return;
    }
    const preferred = configs?.default_payment_provider as PaymentProvider;
    const provider = enabled.includes(preferred) ? preferred : enabled[0];
    setLoadingProvider(provider);
    checkout.mutate({ id, provider });
  }
  return (
    <>
      <MakerPricing
        title={c('title')}
        description={c('description')}
        heading={heading}
        initialGroup={initialGroup}
        purchaseDisabled={
          configQuery.isError || (configQuery.isSuccess && !enabled.length)
        }
        disabledLabel={c('unavailable_action')}
        notice={
          configQuery.isError ? (
            <>
              <p>{c('options_error')}</p>
              <button
                type="button"
                className="maker-text-link"
                onClick={() => void configQuery.refetch()}
              >
                {m['maker.ai.retry']()}
              </button>
            </>
          ) : configQuery.isSuccess && !enabled.length ? (
            <>
              <p>{c('unavailable_notice')}</p>
              <Link className="maker-text-link" href="/create">
                {c('builder_action')}
              </Link>
            </>
          ) : undefined
        }
        groups={groups}
        costNote={c('cost_note')}
        freeNote={c('free_note')}
        busyId={
          checkout.isPending
            ? pendingId
            : sessionPending || configPending
              ? 'loading'
              : undefined
        }
        onChoose={choose}
        labels={{
          tabs: c('tabs'),
          recommended: c('recommended'),
          loading: c('loading'),
        }}
      />
      <PaymentProviderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        providers={enabled}
        loadingProvider={loadingProvider}
        onSelect={(provider) => {
          setLoadingProvider(provider);
          checkout.mutate({ id: pendingId, provider });
        }}
      />
    </>
  );
}

export function PricingQuestions() {
  return (
    <section className="maker-section atelier-pricing-questions">
      <div className="maker-container maker-faq-grid">
        <div>
          <h2>{c('questions_title')}</h2>
          <p className="atelier-pricing-help">{c('questions_description')}</p>
          <Link className="maker-text-link" href="/create">
            {c('builder_action')}
          </Link>
        </div>
        <div className="maker-faq">
          {[1, 2, 3, 4].map((index) => (
            <details key={index}>
              <summary>
                {c(`question_${index}`)}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{c(`answer_${index}`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
