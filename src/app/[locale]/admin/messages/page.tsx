'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Send,
  MessageSquare,
  Mail,
  Clock,
  CheckCheck,
  Bot,
  User,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  content: string;
  is_ai_generated: boolean;
  read_at: string | null;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  receiver: {
    id: string;
    full_name: string;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
}

interface Conversation {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  projectName: string | null;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    aiGenerated: 0,
  });

  useEffect(() => {
    const fetchMessages = async () => {
      const supabase = getSupabaseClient();

      const { data } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name),
          project:projects(id, name)
        `
        )
        .order('created_at', { ascending: false });

      if (data) {
        setMessages(data as Message[]);

        // Build conversations from messages
        const conversationsMap = new Map<string, Conversation>();
        data.forEach((msg: any) => {
          const senderId = msg.sender?.id;
          if (senderId && !conversationsMap.has(senderId)) {
            conversationsMap.set(senderId, {
              id: senderId,
              name: msg.sender.full_name,
              email: msg.sender.email,
              avatar_url: msg.sender.avatar_url,
              lastMessage: msg.content,
              lastMessageTime: msg.created_at,
              unreadCount: data.filter(
                (m: any) => m.sender?.id === senderId && !m.read_at
              ).length,
              projectName: msg.project?.name || null,
            });
          }
        });

        setConversations(Array.from(conversationsMap.values()));

        // Calculate stats
        const unread = data.filter((m: any) => !m.read_at).length;
        const aiGenerated = data.filter((m: any) => m.is_ai_generated).length;

        setStats({
          total: data.length,
          unread,
          aiGenerated,
        });
      }

      setLoading(false);
    };

    fetchMessages();
  }, []);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMessages = selectedConversation
    ? messages.filter(
        (m) => m.sender?.id === selectedConversation || m.receiver?.id === selectedConversation
      )
    : [];

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedConversation,
      content: newMessage,
      is_ai_generated: false,
    });

    if (!error) {
      setNewMessage('');
      // Refresh messages
      const { data } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name),
          project:projects(id, name)
        `
        )
        .order('created_at', { ascending: false });

      if (data) {
        setMessages(data as Message[]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Mensajes</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <Mail className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Sin leer</p>
                  <p className="text-2xl font-bold text-white">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Generados por IA</p>
                  <p className="text-2xl font-bold text-white">{stats.aiGenerated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Conversaciones</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="text-center py-8 text-slate-400">Cargando...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Sin conversaciones</div>
              ) : (
                <div className="space-y-1 px-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-500/20 text-blue-400">
                            {conv.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium truncate">{conv.name}</p>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-purple-500 text-white text-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm truncate">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500">
                              {new Date(conv.lastMessageTime).toLocaleDateString('es-MX')}
                            </span>
                            {conv.projectName && (
                              <Badge
                                variant="outline"
                                className="text-xs border-slate-600 text-slate-400"
                              >
                                {conv.projectName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="border-b border-slate-800">
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500/20 text-blue-400">
                    {conversations
                      .find((c) => c.id === selectedConversation)
                      ?.name?.slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-white">
                    {conversations.find((c) => c.id === selectedConversation)?.name}
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    {conversations.find((c) => c.id === selectedConversation)?.email}
                  </p>
                </div>
              </div>
            ) : (
              <CardTitle className="text-slate-400">Selecciona una conversacion</CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {selectedConversation ? (
              <>
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {selectedMessages.map((msg) => {
                      const isOwn = msg.receiver?.id === selectedConversation;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwn
                                ? 'bg-purple-500/20 text-white'
                                : 'bg-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {msg.is_ai_generated ? (
                                <Bot className="w-3 h-3 text-purple-400" />
                              ) : (
                                <User className="w-3 h-3 text-slate-400" />
                              )}
                              <span className="text-xs text-slate-400">
                                {msg.sender?.full_name}
                              </span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs text-slate-500">
                                {new Date(msg.created_at).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {msg.read_at && <CheckCheck className="w-3 h-3 text-blue-400" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-slate-800">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona una conversacion para ver los mensajes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
