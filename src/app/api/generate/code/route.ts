import { NextRequest, NextResponse } from 'next/server';
import { generateFromPrompt, generateProjectStructure } from '@/lib/claude/code-generator';
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

    const { prompt, context, type } = await request.json();

    if (!prompt && type !== 'project-structure') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let result;

    if (type === 'project-structure') {
      // Generate full project structure from requirements
      result = await generateProjectStructure(context?.projectRequirements || {});
    } else {
      // Generate code from custom prompt
      result = await generateFromPrompt(prompt, context);
    }

    return NextResponse.json({ result });
  } catch (error) {
    logger.error('Error generating code', error, { route: 'generate/code' });
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}
