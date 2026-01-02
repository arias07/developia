import { NextRequest, NextResponse } from 'next/server';
import { generateComponent } from '@/lib/claude/code-generator';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const { spec, projectContext } = await request.json();

    if (!spec || !spec.name || !spec.type) {
      return NextResponse.json(
        { error: 'Component spec with name and type is required' },
        { status: 400 }
      );
    }

    const result = await generateComponent(spec, projectContext);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error generating component:', error);
    return NextResponse.json(
      { error: 'Failed to generate component' },
      { status: 500 }
    );
  }
}
