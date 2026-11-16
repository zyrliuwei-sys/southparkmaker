import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';

import { characterProducts, pricingCatalog } from '../src/config/pricing';
import { StripeProvider } from '../src/core/payment/stripe';
import { PaymentInterval, PaymentType } from '../src/core/payment/types';

test('all six AI credit products carry the eligible AIaaS classification, without classifying guest posts as AI', () => {
  assert.equal(characterProducts.length, 6);
  assert.ok(
    characterProducts.every((p) => p.stripeTaxCode === 'txcd_10105001')
  );
  assert.equal(pricingCatalog.guest_post_standard.stripeTaxCode, undefined);
});

test('Stripe creates one-time and monthly Checkout sessions with the catalog tax code and exact price', async () => {
  const provider = new StripeProvider({
    secretKey: 'sk_test_isolated_not_real',
    publishableKey: '',
  });
  const sessions: any[] = [];
  (provider as any).client = {
    checkout: {
      sessions: {
        create: async (params: any) => {
          sessions.push(params);
          return {
            id: 'cs_test_isolated',
            url: 'https://checkout.stripe.com/test',
          };
        },
      },
    },
  };
  for (const product of characterProducts) {
    const result = await provider.createPayment({
      order: {
        productId: product.productId,
        type: product.type,
        price: { amount: product.priceInCents, currency: product.currency },
        taxCode: product.stripeTaxCode,
        description: product.description,
        plan: product.plan,
        successUrl: 'https://southparkmaker.com/return',
        cancelUrl: 'https://southparkmaker.com/pricing',
      },
    });
    const s = sessions.at(-1);
    const price = s.line_items[0].price_data;
    assert.equal(result.provider, 'stripe');
    assert.equal(price.unit_amount, product.priceInCents);
    assert.equal(price.currency, 'usd');
    assert.equal(price.product_data.tax_code, product.stripeTaxCode);
    assert.equal(
      s.mode,
      product.type === PaymentType.SUBSCRIPTION ? 'subscription' : 'payment'
    );
    assert.equal(
      price.recurring?.interval,
      product.type === PaymentType.SUBSCRIPTION
        ? PaymentInterval.MONTH
        : undefined
    );
    assert.equal(
      s.managed_payments,
      undefined,
      'keep the existing Stripe account default'
    );
  }
});

test('Managed Payments owns payment methods and invoicing; standard Stripe retains its invoice behavior', async () => {
  for (const managedPayments of [true, false]) {
    const p = new StripeProvider({
      secretKey: 'sk_test_isolated_not_real',
      publishableKey: '',
      managedPayments,
      allowedPaymentMethods: ['card'],
    });
    let sent: any;
    (p as any).client = {
      checkout: {
        sessions: {
          create: async (params: any) => {
            sent = params;
            return { id: 'cs_test', url: 'https://checkout.stripe.com/test' };
          },
        },
      },
    };
    await p.createPayment({
      order: {
        type: PaymentType.ONE_TIME,
        price: { amount: 500, currency: 'usd' },
        taxCode: 'txcd_10105001',
      },
    });
    assert.equal(
      sent.managed_payments?.enabled,
      managedPayments ? true : undefined
    );
    assert.equal(
      sent.invoice_creation?.enabled,
      managedPayments ? undefined : true
    );
    assert.equal(sent.payment_method_types, undefined);
  }
});

test('signed delayed-payment events keep pending checkouts unpaid until payment actually succeeds', async () => {
  const secret = 'whsec_isolated_delayed_test';
  const provider = new StripeProvider({
    secretKey: 'sk_test_isolated_not_real',
    publishableKey: '',
    signingSecret: secret,
  });
  for (const [type, paymentStatus, expected] of [
    ['checkout.session.completed', 'unpaid', 'processing'],
    ['checkout.session.async_payment_succeeded', 'paid', 'paid'],
    ['checkout.session.async_payment_failed', 'unpaid', 'failed'],
  ]) {
    const now = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      id: 'evt_isolated',
      object: 'event',
      type,
      data: {
        object: {
          id: 'cs_test_isolated',
          object: 'checkout.session',
          status: 'complete',
          payment_status: paymentStatus,
          currency: 'usd',
          amount_total: 500,
        },
      },
      created: now,
      livemode: false,
    });
    const signature = createHmac('sha256', secret)
      .update(`${now}.${body}`)
      .digest('hex');
    const event = await provider.getPaymentEvent({
      req: new Request('https://example.test/webhook', {
        method: 'POST',
        body,
        headers: { 'stripe-signature': `t=${now},v1=${signature}` },
      }),
    });
    assert.equal(event.eventType, 'checkout.success');
    assert.ok(event.paymentSession);
    assert.equal(event.paymentSession.paymentStatus, expected);
  }
});
