'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Star,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LocalizedLink } from '@/components/i18n';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { FreelancerProfile, FreelancerTask, FreelancerAssignment } from '@/types/database';

const content: Record<string, Record<string, string>> = {
  es: {
    welcome: 'Bienvenido de vuelta',
    dashboard: 'Panel de Freelancer',
    activeTasks: 'Tareas Activas',
    hoursThisWeek: 'Horas esta Semana',
    pendingEarnings: 'Ganancias Pendientes',
    completedTasks: 'Tareas Completadas',
    recentTasks: 'Tareas Recientes',
    viewAll: 'Ver todas',
    noTasks: 'No tienes tareas asignadas',
    activeProjects: 'Proyectos Activos',
    noProjects: 'No tienes proyectos asignados',
    quickStats: 'Estadísticas Rápidas',
    rating: 'Calificación',
    reviews: 'reseñas',
    thisMonth: 'Este mes',
    allTime: 'Total',
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    pending: 'Pendiente',
    in_progress: 'En progreso',
    review: 'En revisión',
    accepted: 'Aceptada',
    deadline: 'Fecha límite',
    estimatedHours: 'Horas estimadas',
  },
  en: {
    welcome: 'Welcome back',
    dashboard: 'Freelancer Dashboard',
    activeTasks: 'Active Tasks',
    hoursThisWeek: 'Hours This Week',
    pendingEarnings: 'Pending Earnings',
    completedTasks: 'Completed Tasks',
    recentTasks: 'Recent Tasks',
    viewAll: 'View all',
    noTasks: 'You have no assigned tasks',
    activeProjects: 'Active Projects',
    noProjects: 'You have no assigned projects',
    quickStats: 'Quick Stats',
    rating: 'Rating',
    reviews: 'reviews',
    thisMonth: 'This month',
    allTime: 'All time',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    pending: 'Pending',
    in_progress: 'In progress',
    review: 'In review',
    accepted: 'Accepted',
    deadline: 'Deadline',
    estimatedHours: 'Estimated hours',
  },
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors: Record<string, string> = {
  pending: 'bg-slate-500/20 text-slate-400',
  accepted: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-emerald-500/20 text-emerald-400',
  review: 'bg-purple-500/20 text-purple-400',
  completed: 'bg-green-500/20 text-green-400',
};

export default function FreelancerDashboardPage() {
  const locale = useLocale();
  const t = content[locale] || content.es;
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [tasks, setTasks] = useState<FreelancerTask[]>([]);
  const [assignments, setAssignments] = useState<FreelancerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeTasks: 0,
    hoursThisWeek: 0,
    pendingEarnings: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get freelancer profile
      const { data: profileData } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profileData) return;
      setProfile(profileData as FreelancerProfile);

      // Get tasks
      const { data: tasksData } = await supabase
        .from('freelancer_tasks')
        .select(`
          *,
          project:projects(id, name, type)
        `)
        .eq('freelancer_id', profileData.id)
        .in('status', ['pending', 'accepted', 'in_progress', 'review'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasksData) {
        setTasks(tasksData as FreelancerTask[]);
      }

      // Get active assignments
      const { data: assignmentsData } = await supabase
        .from('freelancer_assignments')
        .select(`
          *,
          project:projects(id, name, type, status, progress_percentage)
        `)
        .eq('freelancer_id', profileData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (assignmentsData) {
        setAssignments(assignmentsData as FreelancerAssignment[]);
      }

      // Calculate stats
      const activeTasks = tasksData?.filter((t: FreelancerTask) =>
        ['accepted', 'in_progress', 'review'].includes(t.status)
      ).length || 0;

      // Get hours logged this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: timeLogs } = await supabase
        .from('freelancer_time_logs')
        .select('duration_minutes')
        .eq('freelancer_id', profileData.id)
        .gte('started_at', weekStart.toISOString());

      const hoursThisWeek = timeLogs?.reduce((sum: number, log: { duration_minutes?: number }) =>
        sum + (log.duration_minutes || 0), 0
      ) / 60 || 0;

      // Get pending earnings (tasks completed but not paid)
      const { data: pendingTasks } = await supabase
        .from('freelancer_tasks')
        .select('hourly_rate, actual_hours, fixed_amount, total_paid')
        .eq('freelancer_id', profileData.id)
        .eq('status', 'completed');

      const pendingEarnings = pendingTasks?.reduce((sum: number, task: { fixed_amount?: number; hourly_rate?: number; actual_hours?: number; total_paid?: number }) => {
        const earned = task.fixed_amount || ((task.hourly_rate || 0) * (task.actual_hours || 0));
        return sum + earned - (task.total_paid || 0);
      }, 0) || 0;

      setStats({
        activeTasks,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        pendingEarnings,
        completedTasks: profileData.total_tasks_completed,
      });

      setLoading(false);
    };

    fetchData();
  }, []);

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
        <h1 className="text-2xl font-bold text-white">
          {t.welcome}, {profile?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-slate-400">{t.dashboard}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{t.activeTasks}</p>
                  <p className="text-3xl font-bold text-white">{stats.activeTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-emerald-400" />
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
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{t.hoursThisWeek}</p>
                  <p className="text-3xl font-bold text-white">{stats.hoursThisWeek}h</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
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
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{t.pendingEarnings}</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(stats.pendingEarnings, profile?.currency || 'USD')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{t.completedTasks}</p>
                  <p className="text-3xl font-bold text-white">{stats.completedTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">{t.recentTasks}</CardTitle>
              <LocalizedLink href="/freelancer/tasks">
                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                  {t.viewAll}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </LocalizedLink>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">{t.noTasks}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white truncate">{task.title}</h4>
                            <Badge className={priorityColors[task.priority]}>
                              {t[task.priority]}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {task.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.deadline)}
                              </span>
                            )}
                            {task.estimated_hours && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.estimated_hours}h
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={statusColors[task.status]}>
                          {t[task.status] || task.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">{t.quickStats}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.rating}</span>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">
                    {profile?.average_rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-slate-500 text-sm">
                    ({profile?.total_reviews || 0} {t.reviews})
                  </span>
                </div>
              </div>

              {/* Total Earnings */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.allTime}</span>
                <span className="text-white font-medium">
                  {formatCurrency(profile?.total_earnings || 0, profile?.currency || 'USD')}
                </span>
              </div>

              {/* Projects Completed */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.completedTasks}</span>
                <span className="text-white font-medium">{profile?.total_projects_completed || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">{t.activeProjects}</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">{t.noProjects}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white text-sm truncate">
                          {(assignment.project as { name?: string })?.name || 'Project'}
                        </h4>
                        <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                          {assignment.role}
                        </Badge>
                      </div>
                      <Progress
                        value={(assignment.project as { progress_percentage?: number })?.progress_percentage || 0}
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
