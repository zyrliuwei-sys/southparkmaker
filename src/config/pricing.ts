/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  /**
   * Price in fen for CNY-only providers (Alipay, WeChat Pay) when `currency`
   * isn't CNY. Without it those providers refuse the product — the amount is
   * never reused across currencies.
   */
  cnyPriceInCents?: number;
  /** Stripe Tax category for the service sold by this catalog product. */
  stripeTaxCode?: string;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
  /**
   * 'guest_post': a guest post package. Sold only through
   * /api/guest-posts/$id/checkout (tied to an approved submission); the
   * generic checkout refuses it.
   */
  kind?: 'guest_post';
  /** Guest post packages: most external links the article may contain. */
  maxLinks?: number;
};

/** Product IDs are stable checkout keys. Each app credit costs one US cent. */
export const characterProducts: PricingProduct[] = [
  ...[
    ['explorer', 'Explorer', 500],
    ['creator', 'Creator', 1500],
    ['studio', 'Studio', 4000],
  ].map(([key, name, cents]) => ({
    productId: `character_${key}_pack`,
    productName: String(name),
    planName: String(name),
    description: `${name} one-time character credits`,
    type: PaymentType.ONE_TIME,
    priceInCents: Number(cents),
    currency: 'usd',
    stripeTaxCode: 'txcd_10105001', // Cloud-based AI tools for personal use.
    credits: Number(cents),
    creditsValidDays: 0,
  })),
  ...[
    ['explorer', 'Explorer', 900],
    ['creator', 'Creator', 2500],
    ['studio', 'Studio', 4900],
  ].map(([key, name, cents]) => ({
    productId: `character_${key}_monthly`,
    productName: String(name),
    planName: String(name),
    description: `${name} monthly character credits`,
    type: PaymentType.SUBSCRIPTION,
    priceInCents: Number(cents),
    currency: 'usd',
    stripeTaxCode: 'txcd_10105001', // Cloud-based AI tools for personal use.
    credits: Number(cents),
    creditsValidDays: 31,
    plan: {
      name: String(name),
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  })),
];

export const pricingCatalog: Record<string, PricingProduct> = {
  ...Object.fromEntries(
    characterProducts.map((product) => [product.productId, product])
  ),
  // Guest posts (see src/modules/guest-posts). Published permanently, every
  // external link rendered rel="sponsored nofollow".
  guest_post_standard: {
    productId: 'guest_post_standard',
    productName: 'Guest Post',
    planName: 'Standard',
    description: 'Guest post (1 link)',
    type: PaymentType.ONE_TIME,
    priceInCents: 9900,
    currency: 'usd',
    cnyPriceInCents: 69900,
    credits: 0,
    kind: 'guest_post',
    maxLinks: 1,
  },
  guest_post_premium: {
    productId: 'guest_post_premium',
    productName: 'Guest Post',
    planName: 'Premium',
    description: 'Guest post (3 links)',
    type: PaymentType.ONE_TIME,
    priceInCents: 19900,
    currency: 'usd',
    cnyPriceInCents: 139900,
    credits: 0,
    kind: 'guest_post',
    maxLinks: 3,
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}

export function listGuestPostPackages(): PricingProduct[] {
  return listPricingProducts().filter((p) => p.kind === 'guest_post');
}
