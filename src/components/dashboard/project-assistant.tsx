'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import type { ProjectAssistant, AssistantMessage } from '@/types/database';

interface ProjectAssistantChatProps {
  projectId: string;
  userId: string;
}

export function ProjectAssistantChat({ projectId, userId }: ProjectAssistantChatProps) {
  const [assistant, setAssistant] = useState<ProjectAssistant | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function fetchAssistant() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('project_assistants')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (!error && data) {
        setAssistant(data as ProjectAssistant);
      }
      setLoading(false);
    }

    fetchAssistant();
  }, [projectId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage: AssistantMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch(`/api/assistant/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: AssistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: AssistantMessage = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bot className="h-5 w-5 text-purple-400" />
            Asistente del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assistant) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bot className="h-5 w-5 text-purple-400" />
            Asistente del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>El asistente estará disponible una vez que el proyecto sea completado.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            {assistant.avatar_url ? (
              <img
                src={assistant.avatar_url}
                alt={assistant.assistant_name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <Bot className="h-5 w-5 text-purple-400" />
            )}
            {assistant.assistant_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-500/30">
              24/7 Disponible
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-slate-400 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400 mb-4">
                Hola! Soy tu asistente para este proyecto.
              </p>
              <p className="text-sm text-slate-500">
                Puedo ayudarte con preguntas sobre el sistema, resetear contraseñas, limpiar caché, y más.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {[
                  '¿Cómo funciona el sistema?',
                  'Verificar estado',
                  '¿Qué puedes hacer?',
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => {
                      setInput(suggestion);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Escribiendo...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={sending}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: AssistantMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-purple-600 text-white'
            : 'bg-slate-700 text-slate-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Action Result */}
        {message.action && (
          <div
            className={`mt-2 p-2 rounded text-sm ${
              message.action.success
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.action.success ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="font-medium">
                {message.action.success ? 'Acción ejecutada' : 'Acción fallida'}
              </span>
            </div>
          </div>
        )}

        <span className="text-xs opacity-60 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

export default ProjectAssistantChat;
