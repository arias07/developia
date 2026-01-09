import { NextRequest, NextResponse } from 'next/server';
import { generateQuotation } from '@/lib/openai/prd-generator';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

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

    const { requirements, projectId } = await request.json();

    if (!requirements) {
      return NextResponse.json({ error: 'Requirements are required' }, { status: 400 });
    }

    const quotation = await generateQuotation(requirements);

    // If projectId is provided, create a quotation record
    if (projectId) {
      await supabase.from('quotations').insert({
        project_id: projectId,
        amount: quotation.totalCost,
        currency: 'USD',
        breakdown: quotation.breakdown,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days validity
        notes: quotation.notes.join('\n'),
        status: 'draft',
      });

      // Update project with estimated price
      await supabase.from('projects').update({
        estimated_price: quotation.totalCost,
        updated_at: new Date().toISOString(),
      }).eq('id', projectId);
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    logger.error('Error generating quotation', error, { route: 'generate/quotation' });
    return NextResponse.json(
      { error: 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}
