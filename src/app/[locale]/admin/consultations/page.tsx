'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarPlus,
  Users,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Consultation {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  notes: string | null;
  client: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  consultant: {
    full_name: string;
  } | null;
}

const typeLabels: Record<string, string> = {
  discovery: 'Descubrimiento',
  technical: 'Consulta Tecnica',
  design: 'Diseno',
  strategy: 'Estrategia',
  support: 'Soporte',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Programada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistio',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  no_show: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    today: 0,
  });

  useEffect(() => {
    const fetchConsultations = async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('consultations')
        .select(
          `
          *,
          client:profiles!consultations_client_id_fkey(full_name, email, avatar_url),
          consultant:profiles!consultations_consultant_id_fkey(full_name)
        `
        )
        .order('scheduled_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;

      if (data) {
        setConsultations(data as Consultation[]);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const scheduled = data.filter((c: any) => c.status === 'scheduled').length;
        const completed = data.filter((c: any) => c.status === 'completed').length;
        const todayCount = data.filter((c: any) => {
          const date = new Date(c.scheduled_at);
          return date >= today && date < tomorrow;
        }).length;

        setStats({
          total: data.length,
          scheduled,
          completed,
          today: todayCount,
        });
      }

      setLoading(false);
    };

    fetchConsultations();
  }, [statusFilter]);

  const filteredConsultations = consultations.filter(
    (consultation) =>
      consultation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStatus = async (id: string, newStatus: string) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('consultations').update({ status: newStatus }).eq('id', id);

    if (!error) {
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total</p>
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
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Programadas</p>
                  <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
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
                <div className="p-3 rounded-xl bg-green-500/10">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Completadas</p>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/10">
                  <CalendarPlus className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Hoy</p>
                  <p className="text-2xl font-bold text-white">{stats.today}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar consultorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-white">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Consultations Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Consultorias ({filteredConsultations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando consultorias...</div>
          ) : filteredConsultations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No se encontraron consultorias</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Titulo</TableHead>
                    <TableHead className="text-slate-400">Cliente</TableHead>
                    <TableHead className="text-slate-400">Tipo</TableHead>
                    <TableHead className="text-slate-400">Fecha/Hora</TableHead>
                    <TableHead className="text-slate-400">Duracion</TableHead>
                    <TableHead className="text-slate-400">Estado</TableHead>
                    <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.map((consultation) => (
                    <TableRow
                      key={consultation.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <p className="font-medium text-white">{consultation.title}</p>
                      </TableCell>
                      <TableCell>
                        {consultation.client ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={consultation.client.avatar_url || undefined} />
                              <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                                {consultation.client.full_name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white text-sm">{consultation.client.full_name}</p>
                              <p className="text-slate-400 text-xs">{consultation.client.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {typeLabels[consultation.type] || consultation.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-white">
                          {new Date(consultation.scheduled_at).toLocaleDateString('es-MX')}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {new Date(consultation.scheduled_at).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3 h-3" />
                          {consultation.duration_minutes} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[consultation.status]}>
                          {statusLabels[consultation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            {consultation.meeting_url && (
                              <DropdownMenuItem
                                className="text-slate-300 hover:text-white cursor-pointer"
                                onClick={() => window.open(consultation.meeting_url!, '_blank')}
                              >
                                <Video className="w-4 h-4 mr-2" />
                                Unirse a reunion
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-green-400 hover:text-green-300 cursor-pointer"
                              onClick={() => updateStatus(consultation.id, 'completed')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar completada
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              onClick={() => updateStatus(consultation.id, 'cancelled')}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
