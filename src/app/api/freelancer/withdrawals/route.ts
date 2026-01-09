import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MIN_WITHDRAWAL = 100; // Minimum withdrawal amount in USD

// GET - Get withdrawal requests for the current freelancer
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get freelancer profile
    const { data: profile } = await supabaseAdmin
      .from('freelancer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Freelancer profile not found' }, { status: 404 });
    }

    // Get withdrawal requests
    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('freelancer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    }

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Error in GET /api/freelancer/withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new withdrawal request
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, payment_method, payment_details } = body;

    // Validate input
    if (!amount || amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    if (!payment_method || !payment_details) {
      return NextResponse.json(
        { error: 'Payment method and details are required' },
        { status: 400 }
      );
    }

    // Get freelancer profile
    const { data: profile } = await supabaseAdmin
      .from('freelancer_profiles')
      .select('id, total_earnings, currency')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Freelancer profile not found' }, { status: 404 });
    }

    // Check pending balance (completed tasks not yet paid)
    const { data: pendingTasks } = await supabaseAdmin
      .from('freelancer_tasks')
      .select('hourly_rate, actual_hours, fixed_amount, total_paid')
      .eq('freelancer_id', profile.id)
      .eq('status', 'completed');

    const availableBalance = pendingTasks?.reduce((sum: number, task: any) => {
      const earned = task.fixed_amount || ((task.hourly_rate || 0) * (task.actual_hours || 0));
      return sum + earned - (task.total_paid || 0);
    }, 0) || 0;

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check for pending withdrawal requests
    const { data: existingPending } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('id')
      .eq('freelancer_id', profile.id)
      .in('status', ['pending', 'approved', 'processing'])
      .limit(1);

    if (existingPending && existingPending.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending withdrawal request' },
        { status: 400 }
      );
    }

    // Calculate fee (example: 2% with minimum $2)
    const feePercentage = 0.02;
    const minFee = 2;
    const fee = Math.max(amount * feePercentage, minFee);

    // Create withdrawal request
    const { data: withdrawal, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        freelancer_id: profile.id,
        amount,
        currency: profile.currency || 'USD',
        fee,
        payment_method,
        payment_details,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating withdrawal:', error);
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 });
    }

    // Update freelancer profile payment method for next time
    await supabaseAdmin
      .from('freelancer_profiles')
      .update({
        payment_method,
        payment_details,
      })
      .eq('id', profile.id);

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/freelancer/withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
