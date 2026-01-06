'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, MessageSquare, User, Bot } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface ProjectChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name, avatar_url, role)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const supabase = getSupabaseClient();

    channelRef.current = supabase
      .channel(`messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload: { new: { id: string } }) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id(full_name, avatar_url, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as Message]);
          }
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('messages').insert({
      project_id: projectId,
      sender_id: user.id,
      content: newMessage,
      is_ai_generated: false,
    });

    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 h-[600px] flex flex-col">
      <CardHeader className="border-b border-slate-700 shrink-0">
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          Chat del Proyecto
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="w-12 h-12 text-slate-500 mb-4" />
            <p className="text-slate-400 text-center">
              No hay mensajes aún. ¡Inicia la conversación!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            const senderName = message.sender?.full_name || 'Usuario';
            const isAdmin =
              message.sender?.role === 'admin' || message.sender?.role === 'project_manager';

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  {message.is_ai_generated ? (
                    <AvatarFallback className="bg-purple-600">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback
                        className={isAdmin ? 'bg-cyan-600' : 'bg-slate-600'}
                      >
                        {getInitials(senderName)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div
                  className={`max-w-[70%] ${
                    isOwnMessage ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium ${
                        isOwnMessage
                          ? 'text-purple-400'
                          : isAdmin
                          ? 'text-cyan-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {message.is_ai_generated
                        ? 'Asistente Devvy'
                        : isOwnMessage
                        ? 'Tú'
                        : senderName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.is_ai_generated
                        ? 'bg-purple-900/50 border border-purple-700'
                        : isOwnMessage
                        ? 'bg-purple-600 text-white'
                        : isAdmin
                        ? 'bg-cyan-900/50 border border-cyan-700'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-slate-700 shrink-0">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="bg-slate-900 border-slate-700 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
