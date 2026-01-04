'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  User,
  Headphones,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

interface Ticket {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

interface TicketListProps {
  projectId: string;
}

const statusConfig = {
  open: { label: 'Abierto', color: 'bg-blue-500', icon: AlertCircle },
  in_progress: { label: 'En Proceso', color: 'bg-yellow-500', icon: Clock },
  resolved: { label: 'Resuelto', color: 'bg-green-500', icon: CheckCircle2 },
  closed: { label: 'Cerrado', color: 'bg-slate-500', icon: CheckCircle2 },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-slate-500' },
  medium: { label: 'Media', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500' },
};

export function TicketList({ projectId }: TicketListProps) {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as Ticket['priority'],
    category: 'general',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [projectId]);

  const fetchTickets = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data as Ticket[]);
    }
    setLoading(false);
  };

  const createTicket = async () => {
    if (!user || !newTicket.title.trim()) return;

    setCreating(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        status: 'open',
      })
      .select()
      .single();

    if (!error && data) {
      setTickets([data as Ticket, ...tickets]);
      setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
      setIsCreateDialogOpen(false);
    }
    setCreating(false);
  };

  const fetchTicketMessages = async (ticketId: string) => {
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (data) {
      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: data as TicketMessage[] } : null
      );
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user) return;

    setSendingMessage(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: newMessage,
        is_staff: false,
      })
      .select()
      .single();

    if (!error && data) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: [...(prev.messages || []), data as TicketMessage],
            }
          : null
      );
      setNewMessage('');
    }
    setSendingMessage(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketMessages(ticket.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Tickets de Soporte</h2>
          <p className="text-sm text-slate-400">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nuevo Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Título</label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Describe brevemente el problema"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Descripción</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Proporciona más detalles..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Prioridad</label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) =>
                      setNewTicket({ ...newTicket, priority: value as Ticket['priority'] })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Categoría</label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="bug">Bug / Error</SelectItem>
                      <SelectItem value="feature">Nueva Funcionalidad</SelectItem>
                      <SelectItem value="billing">Facturación</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={createTicket}
                disabled={creating || !newTicket.title.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Ticket
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Headphones className="w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Sin tickets</h3>
            <p className="text-slate-400 text-center mb-4">
              ¿Tienes alguna pregunta o problema? Crea un ticket de soporte.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ticket List */}
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status];
              const priority = priorityConfig[ticket.priority];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={ticket.id}
                  className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:bg-slate-800 ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => openTicket(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white line-clamp-1">{ticket.title}</h3>
                      <Badge className={`${status.color} text-white border-none shrink-0 ml-2`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{ticket.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={`${priority.color} text-white border-none text-xs`}>
                        {priority.label}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Ticket Detail / Chat */}
          <Card className="bg-slate-800/50 border-slate-700 h-[500px] flex flex-col">
            {selectedTicket ? (
              <>
                <CardHeader className="border-b border-slate-700 shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{selectedTicket.title}</CardTitle>
                      <p className="text-sm text-slate-400 mt-1">{selectedTicket.description}</p>
                    </div>
                    <Badge
                      className={`${statusConfig[selectedTicket.status].color} text-white border-none`}
                    >
                      {statusConfig[selectedTicket.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedTicket.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_staff ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.is_staff
                            ? 'bg-slate-700 text-white'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.is_staff ? (
                            <Headphones className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          <span className="text-xs opacity-75">
                            {msg.is_staff ? 'Soporte' : 'Tú'} •{' '}
                            {new Date(msg.created_at).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-slate-400">No hay mensajes aún</p>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 border-t border-slate-700 shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="bg-slate-900 border-slate-700 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-slate-400">Selecciona un ticket para ver los detalles</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
