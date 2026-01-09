import { NextRequest, NextResponse } from 'next/server';
import { generateUserStories } from '@/lib/openai/prd-generator';
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

    const stories = await generateUserStories(requirements);

    // If projectId is provided, save user stories to the database
    if (projectId) {
      await supabase.from('projects').update({
        user_stories: stories,
        updated_at: new Date().toISOString(),
      }).eq('id', projectId);
    }

    return NextResponse.json({ stories });
  } catch (error) {
    logger.error('Error generating user stories', error, { route: 'generate/user-stories' });
    return NextResponse.json(
      { error: 'Failed to generate user stories' },
      { status: 500 }
    );
  }
}
