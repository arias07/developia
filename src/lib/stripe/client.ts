import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }

  return stripeInstance;
}

// Legacy export for backwards compatibility - will throw if STRIPE_SECRET_KEY is not set
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get paymentIntents() { return getStripe().paymentIntents; },
  get refunds() { return getStripe().refunds; },
  get webhooks() { return getStripe().webhooks; },
};

export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethods: ['card'],
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/cancelled`,
};
