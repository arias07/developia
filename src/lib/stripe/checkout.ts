import { getStripe, STRIPE_CONFIG } from './client';
import type Stripe from 'stripe';

export interface CreateCheckoutSessionParams {
  projectId: string;
  projectName: string;
  amount: number; // in cents
  clientEmail: string;
  clientId: string;
  paymentType: 'deposit' | 'milestone' | 'final' | 'consultation';
  milestoneId?: string;
  description?: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const {
    projectId,
    projectName,
    amount,
    clientEmail,
    clientId,
    paymentType,
    milestoneId,
    description,
  } = params;

  const metadata: Record<string, string> = {
    projectId,
    clientId,
    paymentType,
  };

  if (milestoneId) {
    metadata.milestoneId = milestoneId;
  }

  const paymentTypeLabels: Record<string, string> = {
    deposit: 'Anticipo',
    milestone: 'Pago de hito',
    final: 'Pago final',
    consultation: 'Consultoría',
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: STRIPE_CONFIG.paymentMethods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    mode: 'payment',
    customer_email: clientEmail,
    line_items: [
      {
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: `${paymentTypeLabels[paymentType]} - ${projectName}`,
            description: description || `Pago para el proyecto: ${projectName}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata,
    success_url: `${STRIPE_CONFIG.successUrl}&project_id=${projectId}`,
    cancel_url: `${STRIPE_CONFIG.cancelUrl}?project_id=${projectId}`,
  });

  return session;
}

export async function createPaymentIntent(params: {
  amount: number;
  clientEmail: string;
  projectId: string;
  paymentType: string;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: STRIPE_CONFIG.currency,
    receipt_email: params.clientEmail,
    metadata: {
      projectId: params.projectId,
      paymentType: params.paymentType,
    },
  });

  return paymentIntent;
}

export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer'],
  });
}

export async function refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
  const stripe = getStripe();
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // If undefined, full refund
  });

  return refund;
}
