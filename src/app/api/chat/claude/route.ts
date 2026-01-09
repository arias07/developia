import { NextRequest, NextResponse } from 'next/server';
import { chatWithClaude } from '@/lib/claude/code-generator';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { RateLimiters, getRequestIdentifier, rateLimitResponse } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  // Rate limiting for AI endpoints (expensive operations)
  const identifier = getRequestIdentifier(request);
  const rateLimit = RateLimiters.aiGeneration(identifier);

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

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

    const { message, conversationHistory, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await chatWithClaude(message, conversationHistory || [], context);

    return NextResponse.json({ response });
  } catch (error) {
    logger.error('Error chatting with Claude', error, { route: 'chat/claude' });
    return NextResponse.json(
      { error: 'Failed to get response from Claude' },
      { status: 500 }
    );
  }
}
