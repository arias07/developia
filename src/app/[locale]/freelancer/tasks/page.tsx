'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Clock,
  Calendar,
  Filter,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { FreelancerTask, FreelancerProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const content: Record<string, Record<string, string>> = {
  es: {
    title: 'Mis Tareas',
    subtitle: 'Gestiona y da seguimiento a tus tareas asignadas',
    search: 'Buscar tareas...',
    allStatuses: 'Todos los estados',
    allPriorities: 'Todas las prioridades',
    noTasks: 'No tienes tareas asignadas',
    noTasksDesc: 'Las tareas aparecerán aquí cuando te sean asignadas',
    pending: 'Pendiente',
    accepted: 'Aceptada',
    in_progress: 'En progreso',
    review: 'En revisión',
    completed: 'Completada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    deadline: 'Fecha límite',
    estimatedHours: 'Horas est.',
    actualHours: 'Horas reales',
    project: 'Proyecto',
    accept: 'Aceptar',
    reject: 'Rechazar',
    start: 'Iniciar',
    pause: 'Pausar',
    complete: 'Completar',
    submitReview: 'Enviar a revisión',
    viewDetails: 'Ver detalles',
    taskDetails: 'Detalles de la Tarea',
    description: 'Descripción',
    deliverables: 'Entregables',
    deliverableUrl: 'URL del entregable',
    deliverableNotes: 'Notas del entregable',
    submit: 'Enviar',
    cancel: 'Cancelar',
    development: 'Desarrollo',
    bugfix: 'Corrección',
    design: 'Diseño',
    consultation: 'Consultoría',
    other: 'Otro',
    hourlyRate: 'Tarifa por hora',
    fixedAmount: 'Monto fijo',
    earnings: 'Ganancias',
    timeTracking: 'Seguimiento de tiempo',
    startTimer: 'Iniciar timer',
    stopTimer: 'Detener timer',
    timerRunning: 'Timer activo',
  },
  en: {
    title: 'My Tasks',
    subtitle: 'Manage and track your assigned tasks',
    search: 'Search tasks...',
    allStatuses: 'All statuses',
    allPriorities: 'All priorities',
    noTasks: 'You have no assigned tasks',
    noTasksDesc: 'Tasks will appear here when assigned to you',
    pending: 'Pending',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    review: 'In Review',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    deadline: 'Deadline',
    estimatedHours: 'Est. hours',
    actualHours: 'Actual hours',
    project: 'Project',
    accept: 'Accept',
    reject: 'Reject',
    start: 'Start',
    pause: 'Pause',
    complete: 'Complete',
    submitReview: 'Submit for Review',
    viewDetails: 'View Details',
    taskDetails: 'Task Details',
    description: 'Description',
    deliverables: 'Deliverables',
    deliverableUrl: 'Deliverable URL',
    deliverableNotes: 'Deliverable notes',
    submit: 'Submit',
    cancel: 'Cancel',
    development: 'Development',
    bugfix: 'Bug Fix',
    design: 'Design',
    consultation: 'Consultation',
    other: 'Other',
    hourlyRate: 'Hourly rate',
    fixedAmount: 'Fixed amount',
    earnings: 'Earnings',
    timeTracking: 'Time Tracking',
    startTimer: 'Start timer',
    stopTimer: 'Stop timer',
    timerRunning: 'Timer running',
  },
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors: Record<string, string> = {
  pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  accepted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const typeIcons: Record<string, string> = {
  development: '💻',
  bugfix: '🐛',
  review: '👀',
  design: '🎨',
  consultation: '💬',
  other: '📋',
};

export default function FreelancerTasksPage() {
  const locale = useLocale();
  const t = content[locale] || content.es;
  const { toast } = useToast();
  const [tasks, setTasks] = useState<FreelancerTask[]>([]);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<FreelancerTask | null>(null);
  const [showDeliverableDialog, setShowDeliverableDialog] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const supabase = getSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('freelancer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profileData) return;
    setProfile(profileData as FreelancerProfile);

    const { data: tasksData } = await supabase
      .from('freelancer_tasks')
      .select(`
        *,
        project:projects(id, name, type)
      `)
      .eq('freelancer_id', profileData.id)
      .order('created_at', { ascending: false });

    if (tasksData) {
      setTasks(tasksData as FreelancerTask[]);
    }

    setLoading(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const supabase = getSupabaseClient();

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'accepted') {
      updates.accepted_at = new Date().toISOString();
    } else if (newStatus === 'in_progress') {
      updates.started_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('freelancer_tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: locale === 'es' ? 'Tarea actualizada' : 'Task updated',
      description: locale === 'es' ? 'El estado ha sido actualizado' : 'Status has been updated',
    });

    fetchTasks();
  };

  const submitDeliverable = async () => {
    if (!selectedTask) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('freelancer_tasks')
      .update({
        status: 'review',
        deliverable_url: deliverableUrl,
        deliverable_notes: deliverableNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTask.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: locale === 'es' ? 'Entregable enviado' : 'Deliverable submitted',
      description: locale === 'es' ? 'Tu trabajo ha sido enviado a revisión' : 'Your work has been submitted for review',
    });

    setShowDeliverableDialog(false);
    setDeliverableUrl('');
    setDeliverableNotes('');
    setSelectedTask(null);
    fetchTasks();
  };

  const startTimer = async (taskId: string) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('freelancer_time_logs')
      .insert({
        freelancer_id: profile?.id,
        task_id: taskId,
        started_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setActiveTimer(taskId);
    setTimerStartTime(new Date());

    toast({
      title: locale === 'es' ? 'Timer iniciado' : 'Timer started',
    });
  };

  const stopTimer = async (taskId: string) => {
    if (!timerStartTime) return;

    const supabase = getSupabaseClient();
    const now = new Date();
    const durationMinutes = Math.round((now.getTime() - timerStartTime.getTime()) / 60000);

    // Update the most recent time log for this task
    const { data: logs } = await supabase
      .from('freelancer_time_logs')
      .select('id')
      .eq('freelancer_id', profile?.id)
      .eq('task_id', taskId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1);

    if (logs && logs.length > 0) {
      await supabase
        .from('freelancer_time_logs')
        .update({
          ended_at: now.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', logs[0].id);

      // Update task actual hours
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await supabase
          .from('freelancer_tasks')
          .update({
            actual_hours: (task.actual_hours || 0) + durationMinutes / 60,
            updated_at: now.toISOString(),
          })
          .eq('id', taskId);
      }
    }

    setActiveTimer(null);
    setTimerStartTime(null);

    toast({
      title: locale === 'es' ? 'Timer detenido' : 'Timer stopped',
      description: `${durationMinutes} ${locale === 'es' ? 'minutos registrados' : 'minutes logged'}`,
    });

    fetchTasks();
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <p className="text-slate-400">{t.subtitle}</p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder={t.allStatuses} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="accepted">{t.accepted}</SelectItem>
                <SelectItem value="in_progress">{t.in_progress}</SelectItem>
                <SelectItem value="review">{t.review}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder={t.allPriorities} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">{t.allPriorities}</SelectItem>
                <SelectItem value="urgent">{t.urgent}</SelectItem>
                <SelectItem value="high">{t.high}</SelectItem>
                <SelectItem value="medium">{t.medium}</SelectItem>
                <SelectItem value="low">{t.low}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">{t.noTasks}</h3>
              <p className="text-slate-400">{t.noTasksDesc}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{typeIcons[task.type] || '📋'}</span>
                        <h3 className="text-lg font-medium text-white truncate">{task.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{task.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge className={statusColors[task.status]}>
                          {t[task.status] || task.status}
                        </Badge>
                        <Badge className={priorityColors[task.priority]}>
                          {t[task.priority]}
                        </Badge>
                        <Badge variant="outline" className="border-slate-700 text-slate-400">
                          {t[task.type] || task.type}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                        {task.project && (
                          <span className="flex items-center gap-1">
                            📁 {(task.project as { name?: string }).name}
                          </span>
                        )}
                        {task.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.deadline)}
                          </span>
                        )}
                        {task.estimated_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.estimatedHours}: {task.estimated_hours}h
                          </span>
                        )}
                        {task.actual_hours > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Clock className="w-3 h-3" />
                            {t.actualHours}: {task.actual_hours.toFixed(1)}h
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="lg:text-right">
                      {task.fixed_amount ? (
                        <div className="text-emerald-400 font-medium">
                          {formatCurrency(task.fixed_amount, profile?.currency || 'USD')}
                          <span className="text-xs text-slate-500 block">{t.fixedAmount}</span>
                        </div>
                      ) : task.hourly_rate ? (
                        <div className="text-emerald-400 font-medium">
                          {formatCurrency(task.hourly_rate, profile?.currency || 'USD')}/h
                          <span className="text-xs text-slate-500 block">{t.hourlyRate}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      {task.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => updateTaskStatus(task.id, 'accepted')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t.accept}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => updateTaskStatus(task.id, 'rejected')}
                          >
                            {t.reject}
                          </Button>
                        </>
                      )}

                      {task.status === 'accepted' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {t.start}
                        </Button>
                      )}

                      {task.status === 'in_progress' && (
                        <>
                          {activeTimer === task.id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                              onClick={() => stopTimer(task.id)}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              {t.stopTimer}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700 text-slate-300"
                              onClick={() => startTimer(task.id)}
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              {t.startTimer}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                              setSelectedTask(task);
                              setShowDeliverableDialog(true);
                            }}
                          >
                            {t.submitReview}
                          </Button>
                        </>
                      )}

                      {task.status === 'review' && (
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                          {t.review}
                        </Badge>
                      )}

                      {task.status === 'completed' && (
                        <Badge variant="outline" className="border-green-500/30 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t.completed}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Deliverable Dialog */}
      <Dialog open={showDeliverableDialog} onOpenChange={setShowDeliverableDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.submitReview}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">{t.deliverableUrl}</label>
              <Input
                placeholder="https://github.com/..."
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">{t.deliverableNotes}</label>
              <Textarea
                placeholder={locale === 'es' ? 'Describe tu trabajo...' : 'Describe your work...'}
                value={deliverableNotes}
                onChange={(e) => setDeliverableNotes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={() => setShowDeliverableDialog(false)}
            >
              {t.cancel}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={submitDeliverable}
              disabled={!deliverableUrl}
            >
              {t.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
