import { NextRequest, NextResponse } from 'next/server';
import { generatePRD } from '@/lib/openai/prd-generator';
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

    const prd = await generatePRD(requirements);

    // If projectId is provided, save the PRD to the database
    if (projectId) {
      await supabase.from('projects').update({
        prd_document: prd,
        updated_at: new Date().toISOString(),
      }).eq('id', projectId);
    }

    return NextResponse.json({ prd });
  } catch (error) {
    logger.error('Error generating PRD', error, { route: 'generate/prd' });
    return NextResponse.json(
      { error: 'Failed to generate PRD' },
      { status: 500 }
    );
  }
}
