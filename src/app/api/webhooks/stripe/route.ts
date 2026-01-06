import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// Use service role for webhook (no user context) - lazy initialization
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase environment variables are not set');
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { projectId, clientId, paymentType, milestoneId } = session.metadata || {};

  if (!projectId || !clientId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update payment status
  const supabase = getSupabase();
  await supabase
    .from('payments')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_session_id', session.id);

  // Update project status if it's a deposit payment
  if (paymentType === 'deposit') {
    await supabase
      .from('projects')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);
  }

  // Update milestone if applicable
  if (milestoneId) {
    await supabase
      .from('milestones')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', milestoneId);
  }

  // Create notification for admin
  await supabase.from('notifications').insert({
    user_id: clientId,
    title: 'Pago recibido',
    message: `Se ha recibido un pago de $${(session.amount_total || 0) / 100} USD`,
    type: 'payment',
    data: { projectId, paymentType, amount: (session.amount_total || 0) / 100 },
  });

  // Log activity
  await supabase.from('activity_logs').insert({
    project_id: projectId,
    user_id: clientId,
    action: 'payment_received',
    details: {
      amount: (session.amount_total || 0) / 100,
      paymentType,
      stripeSessionId: session.id,
    },
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Update payment record if found by payment intent ID
  await getSupabase()
    .from('payments')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Update payment record to failed
  const supabase = getSupabase();
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Create notification for client
  const { projectId, clientId } = paymentIntent.metadata || {};
  if (clientId) {
    await supabase.from('notifications').insert({
      user_id: clientId,
      title: 'Pago fallido',
      message: 'Tu pago no pudo ser procesado. Por favor, intenta de nuevo.',
      type: 'payment',
      data: { projectId, error: paymentIntent.last_payment_error?.message },
    });
  }
}

async function handleRefund(charge: Stripe.Charge) {
  // Update payment record to refunded
  if (charge.payment_intent) {
    await getSupabase()
      .from('payments')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', charge.payment_intent as string);
  }
}
