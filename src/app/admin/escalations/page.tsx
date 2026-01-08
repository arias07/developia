'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Search,
  RefreshCw,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import type {
  EscalationWithDetails,
  EscalationSeverity,
  EscalationStatus,
  Profile,
} from '@/types/database';

const severityConfig: Record<EscalationSeverity, { label: string; color: string; icon: React.ReactNode }> = {
  critical: {
    label: 'Crítica',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  medium: {
    label: 'Media',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: <Clock className="h-4 w-4" />,
  },
  low: {
    label: 'Baja',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Clock className="h-4 w-4" />,
  },
};

const statusConfig: Record<EscalationStatus, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400' },
  assigned: { label: 'Asignada', color: 'bg-blue-500/20 text-blue-400' },
  in_progress: { label: 'En Progreso', color: 'bg-purple-500/20 text-purple-400' },
  resolved: { label: 'Resuelta', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-500/20 text-slate-400' },
};

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<EscalationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending,assigned,in_progress');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationWithDetails | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolvedToday: 0,
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchEscalations = async () => {
    setLoading(true);

    let query = supabase
      .from('escalation_dashboard')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (filterStatus !== 'all') {
      const statuses = filterStatus.split(',');
      query = query.in('status', statuses);
    }

    // Apply severity filter
    if (filterSeverity !== 'all') {
      query = query.eq('severity', filterSeverity);
    }

    const { data, error } = await query;

    if (!error && data) {
      let filtered = data as EscalationWithDetails[];

      // Apply search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.project_name?.toLowerCase().includes(search) ||
            e.client_email?.toLowerCase().includes(search) ||
            e.error_message?.toLowerCase().includes(search)
        );
      }

      setEscalations(filtered);
    }

    setLoading(false);
  };

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, assigned, inProgress, resolvedToday] = await Promise.all([
      supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
      supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase
        .from('escalations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', today.toISOString()),
    ]);

    setStats({
      pending: pending.count || 0,
      assigned: assigned.count || 0,
      inProgress: inProgress.count || 0,
      resolvedToday: resolvedToday.count || 0,
    });
  };

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['admin', 'project_manager', 'developer']);

    if (data) {
      setTeamMembers(data as Profile[]);
    }
  };

  useEffect(() => {
    fetchEscalations();
    fetchStats();
    fetchTeamMembers();
  }, [filterStatus, filterSeverity]);

  const handleAssign = async (escalationId: string, assignedTo: string) => {
    setSubmitting(true);

    const { error } = await supabase
      .from('escalations')
      .update({
        assigned_to: assignedTo,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
      })
      .eq('id', escalationId);

    if (!error) {
      await fetchEscalations();
      await fetchStats();
    }

    setSubmitting(false);
  };

  const handleStatusChange = async (escalationId: string, newStatus: EscalationStatus) => {
    if (newStatus === 'resolved') {
      setShowResolveDialog(true);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('escalations')
      .update({ status: newStatus })
      .eq('id', escalationId);

    if (!error) {
      await fetchEscalations();
      await fetchStats();
    }

    setSubmitting(false);
  };

  const handleResolve = async () => {
    if (!selectedEscalation) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('escalations')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolveNotes,
      })
      .eq('id', selectedEscalation.id);

    if (!error) {
      // Update project status back to in_progress
      await supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', selectedEscalation.project_id);

      setShowResolveDialog(false);
      setResolveNotes('');
      setSelectedEscalation(null);
      await fetchEscalations();
      await fetchStats();
    }

    setSubmitting(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escalaciones</h1>
          <p className="text-slate-400">
            Gestiona los proyectos que requieren intervención humana
          </p>
        </div>
        <Button onClick={fetchEscalations} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={<Clock className="h-5 w-5 text-yellow-400" />}
          color="text-yellow-400"
        />
        <StatCard
          title="Asignadas"
          value={stats.assigned}
          icon={<User className="h-5 w-5 text-blue-400" />}
          color="text-blue-400"
        />
        <StatCard
          title="En Progreso"
          value={stats.inProgress}
          icon={<Loader2 className="h-5 w-5 text-purple-400" />}
          color="text-purple-400"
        />
        <StatCard
          title="Resueltas Hoy"
          value={stats.resolvedToday}
          icon={<CheckCircle className="h-5 w-5 text-green-400" />}
          color="text-green-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por proyecto, cliente o error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && fetchEscalations()}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending,assigned,in_progress">Activas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="assigned">Asignadas</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="resolved">Resueltas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Escalations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : escalations.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400 opacity-50" />
            <p className="text-slate-400">No hay escalaciones que mostrar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {escalations.map((escalation) => (
            <EscalationCard
              key={escalation.id}
              escalation={escalation}
              teamMembers={teamMembers}
              onAssign={handleAssign}
              onStatusChange={(status) => {
                setSelectedEscalation(escalation);
                handleStatusChange(escalation.id, status);
              }}
              onResolve={() => {
                setSelectedEscalation(escalation);
                setShowResolveDialog(true);
              }}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Resolver Escalación</DialogTitle>
            <DialogDescription className="text-slate-400">
              Describe cómo se resolvió el problema para mantener un registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Notas de resolución</label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe qué acciones se tomaron para resolver el problema..."
                className="mt-1 bg-slate-700 border-slate-600 text-white"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
              className="border-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={submitting || !resolveNotes.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Marcar como Resuelto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface EscalationCardProps {
  escalation: EscalationWithDetails;
  teamMembers: Profile[];
  onAssign: (escalationId: string, assignedTo: string) => void;
  onStatusChange: (status: EscalationStatus) => void;
  onResolve: () => void;
  submitting: boolean;
}

function EscalationCard({
  escalation,
  teamMembers,
  onAssign,
  onStatusChange,
  onResolve,
  submitting,
}: EscalationCardProps) {
  const severity = severityConfig[escalation.severity];
  const status = statusConfig[escalation.status];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${severity.color}`}>{severity.icon}</div>
            <div>
              <CardTitle className="text-white text-lg">{escalation.project_name}</CardTitle>
              <CardDescription className="text-slate-400">
                {escalation.client_email}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={severity.color}>{severity.label}</Badge>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Error Info */}
          <div className="p-3 rounded-lg bg-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">
              Tipo: <span className="text-white">{escalation.type}</span>
              {escalation.failed_phase && (
                <>
                  {' '}| Fase: <span className="text-white">{escalation.failed_phase}</span>
                </>
              )}
            </p>
            {escalation.error_message && (
              <p className="text-sm text-red-400 font-mono mt-2 line-clamp-3">
                {escalation.error_message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Assign dropdown */}
            {escalation.status === 'pending' && (
              <Select onValueChange={(value) => onAssign(escalation.id, value)}>
                <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Asignar a..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Status change */}
            {escalation.status === 'assigned' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange('in_progress')}
                disabled={submitting}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
              >
                Iniciar Trabajo
              </Button>
            )}

            {escalation.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={onResolve}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolver
              </Button>
            )}

            {/* View project link */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-slate-400 hover:text-white"
            >
              <a href={`/admin/projects?id=${escalation.project_id}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Proyecto
              </a>
            </Button>

            {/* Assigned info */}
            {escalation.assigned_name && (
              <span className="text-sm text-slate-400 ml-auto">
                Asignado a: <span className="text-white">{escalation.assigned_name}</span>
              </span>
            )}
          </div>

          {/* Resolution notes */}
          {escalation.resolution_notes && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-sm text-green-400 font-medium mb-1">Resolución:</p>
              <p className="text-sm text-slate-300">{escalation.resolution_notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              Creada:{' '}
              {new Date(escalation.created_at).toLocaleString('es-MX', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
            {escalation.resolved_at && (
              <span>
                Resuelta:{' '}
                {new Date(escalation.resolved_at).toLocaleString('es-MX', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
