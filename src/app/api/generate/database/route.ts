import { NextRequest, NextResponse } from 'next/server';
import { generateDatabaseSchema } from '@/lib/claude/code-generator';
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

    const { requirements } = await request.json();

    if (!requirements) {
      return NextResponse.json({ error: 'Requirements are required' }, { status: 400 });
    }

    const result = await generateDatabaseSchema(requirements);

    return NextResponse.json({ result });
  } catch (error) {
    logger.error('Error generating database schema', error, { route: 'generate/database' });
    return NextResponse.json(
      { error: 'Failed to generate database schema' },
      { status: 500 }
    );
  }
}
