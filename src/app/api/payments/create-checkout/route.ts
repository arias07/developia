import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/stripe/checkout';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, amount, paymentType, milestoneId, description } = await request.json();

    if (!projectId || !amount || !paymentType) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, amount, paymentType' },
        { status: 400 }
      );
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get client profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', project.client_id)
      .single();

    const session = await createCheckoutSession({
      projectId,
      projectName: project.name,
      amount: Math.round(amount * 100), // Convert to cents
      clientEmail: profile?.email || user.email || '',
      clientId: project.client_id,
      paymentType,
      milestoneId,
      description,
    });

    // Create pending payment record
    await supabase.from('payments').insert({
      project_id: projectId,
      client_id: project.client_id,
      amount,
      currency: 'USD',
      status: 'pending',
      payment_type: paymentType,
      stripe_session_id: session.id,
      milestone_id: milestoneId || null,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
