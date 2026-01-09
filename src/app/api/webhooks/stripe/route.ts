import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { assignFictionalTeam } from '@/lib/team/fictional-team-generator';
import { notifyTeamAssignment } from '@/lib/notifications/multi-channel';
import type { ProjectType } from '@/types/database';
import { logger } from '@/lib/logger';

// Use service role for webhook (no user context) - lazy initialization
let supabaseClient: SupabaseClient | null = null;

// ============================================
// IDEMPOTENCY - Prevent duplicate webhook processing
// ============================================
// In-memory store for processed event IDs (use Redis in production)
const processedEvents = new Map<string, { timestamp: number; status: string }>();

// Cleanup old entries every 10 minutes
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

let cleanupTimer: NodeJS.Timeout | null = null;

function startIdempotencyCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [eventId, data] of processedEvents.entries()) {
      if (now - data.timestamp > IDEMPOTENCY_TTL) {
        processedEvents.delete(eventId);
      }
    }
  }, CLEANUP_INTERVAL);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

startIdempotencyCleanup();

/**
 * Check if event was already processed (idempotency check)
 */
function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed
 */
function markEventProcessed(eventId: string, status: string): void {
  processedEvents.set(eventId, { timestamp: Date.now(), status });
}

// ============================================

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
    logger.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check - prevent duplicate processing
  if (isEventProcessed(event.id)) {
    logger.info('Webhook event already processed (idempotent)', { eventId: event.id, type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
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
        logger.debug(`Unhandled event type: ${event.type}`);
    }

    // Mark event as successfully processed
    markEventProcessed(event.id, 'success');
    logger.audit('webhook_processed', { eventId: event.id, type: event.type });

    return NextResponse.json({ received: true });
  } catch (error) {
    // Mark event as failed (but still mark it to prevent re-processing of broken events)
    markEventProcessed(event.id, 'failed');
    logger.error('Error processing webhook', error, { eventId: event.id, type: event.type });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { projectId, clientId, paymentType, milestoneId } = session.metadata || {};

  if (!projectId || !clientId) {
    logger.error('Missing metadata in checkout session', null, { sessionId: session.id });
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

    // Get project details for team assignment
    const { data: project } = await supabase
      .from('projects')
      .select('name, type')
      .eq('id', projectId)
      .single();

    if (project) {
      // Assign fictional team to the project
      try {
        const team = await assignFictionalTeam({
          projectId,
          projectType: project.type as ProjectType,
          projectName: project.name,
        });

        // Notify client about team assignment
        if (team && team.length > 0) {
          await notifyTeamAssignment(
            clientId,
            projectId,
            project.name,
            team.length
          );

          logger.audit('fictional_team_assigned', { projectId, teamSize: team.length });
        }
      } catch (teamError) {
        logger.error('Error assigning fictional team', teamError, { projectId });
        // Don't fail the webhook if team assignment fails
      }
    }
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
