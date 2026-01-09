// Project Assistant Chat API
// Handles conversations with the personalized project assistant

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getProjectAssistant } from '@/lib/assistants/project-assistant-generator';
import {
  executeAction,
  parseActionFromResponse,
  type ActionContext,
} from '@/lib/assistants/assistant-actions';
import type { AssistantMessage, AssistantConversation } from '@/types/database';
import { logger } from '@/lib/logger';
import { RateLimiters, getRequestIdentifier, rateLimitResponse } from '@/lib/security/rate-limiter';

// Supabase client
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Claude client
function getClaude() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

interface ChatRequest {
  message: string;
  conversationId?: string;
  userId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // Rate limiting for AI endpoints
  const identifier = getRequestIdentifier(request);
  const rateLimit = RateLimiters.aiGeneration(identifier);

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const { projectId } = await params;
    const body: ChatRequest = await request.json();
    const { message, conversationId, userId } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const claude = getClaude();

    // Get the assistant for this project
    const assistant = await getProjectAssistant(projectId);

    if (!assistant) {
      return NextResponse.json(
        { error: 'No assistant found for this project' },
        { status: 404 }
      );
    }

    // Get or create conversation
    let conversation: AssistantConversation | null = null;

    if (conversationId) {
      const { data } = await supabase
        .from('assistant_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      conversation = data as AssistantConversation;
    }

    if (!conversation) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('assistant_conversations')
        .insert({
          project_id: projectId,
          assistant_id: assistant.id,
          user_id: userId,
          messages: [],
          topics_discussed: [],
          actions_requested: [],
          actions_executed: [],
        })
        .select()
        .single();

      if (createError) {
        logger.error('Error creating conversation', createError, { projectId, userId });
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      conversation = newConversation as AssistantConversation;
    }

    // Build conversation history for Claude
    const previousMessages = (conversation.messages || []).map((msg: AssistantMessage) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add the new user message
    const userMessage: AssistantMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Call Claude with the assistant's system prompt
    const response = await claude.messages.create({
      model: assistant.model || 'claude-sonnet-4-20250514',
      max_tokens: assistant.max_tokens || 4096,
      system: assistant.system_prompt,
      messages: [
        ...previousMessages,
        { role: 'user', content: message },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    let assistantResponseText = textContent?.text || 'Lo siento, no pude procesar tu solicitud.';

    // Check if the response contains an action
    const actionRequest = parseActionFromResponse(assistantResponseText);
    let actionResult = null;

    if (actionRequest) {
      // Build action context
      const actionContext: ActionContext = {
        projectId,
        userId,
        vercelProjectId: assistant.vercel_project_id || undefined,
        supabaseProjectRef: assistant.supabase_project_ref || undefined,
      };

      // Execute the action
      actionResult = await executeAction(
        actionRequest.action,
        actionContext,
        actionRequest.params
      );

      // Append action result to response - remove action tags from response
      assistantResponseText = assistantResponseText
        .replace(/\[ACTION:[^\]]*\]/gi, '')
        .replace(/\[PARAMS:[^\]]*\]/gi, '')
        .trim();

      if (actionResult.success) {
        assistantResponseText += `\n\n✅ **Acción ejecutada:** ${actionResult.message}`;
      } else {
        assistantResponseText += `\n\n❌ **Error:** ${actionResult.message}`;
      }

      // Update conversation with action info
      if (!conversation.actions_requested.includes(actionRequest.action)) {
        conversation.actions_requested.push(actionRequest.action);
      }
      if (actionResult.success && !conversation.actions_executed.includes(actionRequest.action)) {
        conversation.actions_executed.push(actionRequest.action);
      }
    }

    // Build assistant message
    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      content: assistantResponseText,
      timestamp: new Date().toISOString(),
      ...(actionResult && {
        action: {
          type: actionRequest!.action,
          params: actionRequest!.params,
          result: actionResult.data,
          success: actionResult.success,
        },
      }),
    };

    // Update conversation with new messages
    const updatedMessages = [...(conversation.messages || []), userMessage, assistantMessage];

    const { error: updateError } = await supabase
      .from('assistant_conversations')
      .update({
        messages: updatedMessages,
        last_message_at: new Date().toISOString(),
        message_count: updatedMessages.length,
        actions_requested: conversation.actions_requested,
        actions_executed: conversation.actions_executed,
      })
      .eq('id', conversation.id);

    if (updateError) {
      logger.error('Error updating conversation', updateError, { conversationId: conversation.id });
    }

    // Update assistant stats
    await supabase
      .from('project_assistants')
      .update({
        total_messages: assistant.total_messages + 2,
        total_actions_executed: actionResult?.success
          ? assistant.total_actions_executed + 1
          : assistant.total_actions_executed,
        last_interaction: new Date().toISOString(),
      })
      .eq('id', assistant.id);

    return NextResponse.json({
      conversationId: conversation.id,
      response: assistantResponseText,
      action: actionResult
        ? {
            type: actionRequest!.action,
            success: actionResult.success,
            message: actionResult.message,
            data: actionResult.data,
          }
        : null,
    });
  } catch (error) {
    logger.error('Error in assistant chat', error, { route: 'assistant/chat POST' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (conversationId) {
      // Get specific conversation
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversation: data });
    } else {
      // Get all conversations for user and project
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('id, title, started_at, last_message_at, message_count')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false });

      if (error) {
        logger.error('Error fetching conversations list', error, { projectId, userId });
        return NextResponse.json(
          { error: 'Failed to fetch conversations' },
          { status: 500 }
        );
      }

      return NextResponse.json({ conversations: data || [] });
    }
  } catch (error) {
    logger.error('Error fetching conversations', error, { route: 'assistant/chat GET' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
