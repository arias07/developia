'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Clock,
  Play,
  Pause,
  Square,
  Calendar,
  BarChart3,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { FreelancerTask, FreelancerTimeLog, FreelancerProfile } from '@/types/database';

const content = {
  es: {
    title: 'Registro de Tiempo',
    subtitle: 'Controla y registra tus horas de trabajo',
    activeTimer: 'Timer Activo',
    noActiveTimer: 'Sin timer activo',
    startTimer: 'Iniciar Timer',
    stopTimer: 'Detener',
    pauseTimer: 'Pausar',
    selectTask: 'Selecciona una tarea',
    todayHours: 'Horas Hoy',
    weekHours: 'Horas esta Semana',
    monthHours: 'Horas este Mes',
    pendingApproval: 'Pendiente Aprobación',
    recentLogs: 'Registros Recientes',
    noLogs: 'No hay registros de tiempo',
    noLogsDesc: 'Los registros aparecerán aquí cuando registres tiempo',
    description: 'Descripción del trabajo',
    descriptionPlaceholder: 'Describe lo que trabajaste...',
    logged: 'Registrado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    paid: 'Pagado',
    task: 'Tarea',
    project: 'Proyecto',
    duration: 'Duración',
    date: 'Fecha',
    status: 'Estado',
    weekView: 'Vista Semanal',
    hours: 'horas',
    minutes: 'minutos',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mié',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sáb',
    sun: 'Dom',
  },
  en: {
    title: 'Time Tracking',
    subtitle: 'Track and log your working hours',
    activeTimer: 'Active Timer',
    noActiveTimer: 'No active timer',
    startTimer: 'Start Timer',
    stopTimer: 'Stop',
    pauseTimer: 'Pause',
    selectTask: 'Select a task',
    todayHours: 'Hours Today',
    weekHours: 'Hours This Week',
    monthHours: 'Hours This Month',
    pendingApproval: 'Pending Approval',
    recentLogs: 'Recent Logs',
    noLogs: 'No time logs',
    noLogsDesc: 'Logs will appear here when you track time',
    description: 'Work description',
    descriptionPlaceholder: 'Describe what you worked on...',
    logged: 'Logged',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
    task: 'Task',
    project: 'Project',
    duration: 'Duration',
    date: 'Date',
    status: 'Status',
    weekView: 'Weekly View',
    hours: 'hours',
    minutes: 'minutes',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  },
};

interface TimeLogWithTask extends FreelancerTimeLog {
  task?: FreelancerTask & { project?: { name: string } };
}

export default function FreelancerTimePage() {
  const locale = useLocale();
  const t = content[locale as keyof typeof content] || content.es;
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [tasks, setTasks] = useState<FreelancerTask[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLogWithTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Timer state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  // Fetch profile and data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const supabase = getSupabaseClient();

      // Fetch freelancer profile
      const { data: profileData } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as FreelancerProfile);

        // Fetch active tasks
        const { data: tasksData } = await supabase
          .from('freelancer_tasks')
          .select('*, project:projects(name)')
          .eq('freelancer_id', profileData.id)
          .in('status', ['accepted', 'in_progress'])
          .order('created_at', { ascending: false });

        if (tasksData) {
          setTasks(tasksData as FreelancerTask[]);
        }

        // Fetch time logs
        const { data: logsData } = await supabase
          .from('freelancer_time_logs')
          .select('*, task:freelancer_tasks(*, project:projects(name))')
          .eq('freelancer_id', profileData.id)
          .order('started_at', { ascending: false })
          .limit(50);

        if (logsData) {
          setTimeLogs(logsData as TimeLogWithTask[]);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerRunning && timerStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - timerStartTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerStartTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const startTimer = () => {
    if (!activeTaskId) return;
    setTimerRunning(true);
    setTimerStartTime(new Date());
    setElapsedTime(0);
  };

  const stopTimer = async () => {
    if (!timerStartTime || !activeTaskId || !profile) return;

    const supabase = getSupabaseClient();
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - timerStartTime.getTime()) / 60000);

    // Save time log
    const { data: newLog, error } = await supabase
      .from('freelancer_time_logs')
      .insert({
        freelancer_id: profile.id,
        task_id: activeTaskId,
        started_at: timerStartTime.toISOString(),
        ended_at: endTime.toISOString(),
        duration_minutes: durationMinutes,
        description: description || null,
        status: 'logged',
      })
      .select('*, task:freelancer_tasks(*, project:projects(name))')
      .single();

    if (!error && newLog) {
      setTimeLogs([newLog as TimeLogWithTask, ...timeLogs]);
    }

    // Reset timer
    setTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
    setDescription('');
  };

  // Calculate stats
  const calculateStats = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;
    let pendingMinutes = 0;

    timeLogs.forEach((log) => {
      const logDate = new Date(log.started_at);
      const duration = log.duration_minutes || 0;

      if (logDate >= todayStart) todayMinutes += duration;
      if (logDate >= weekStart) weekMinutes += duration;
      if (logDate >= monthStart) monthMinutes += duration;
      if (log.status === 'logged') pendingMinutes += duration;
    });

    return {
      today: todayMinutes / 60,
      week: weekMinutes / 60,
      month: monthMinutes / 60,
      pending: pendingMinutes / 60,
    };
  }, [timeLogs]);

  const stats = calculateStats();

  // Calculate week data
  const getWeekData = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);

      const dayLogs = timeLogs.filter((log) => {
        const logDate = new Date(log.started_at);
        return (
          logDate.getFullYear() === day.getFullYear() &&
          logDate.getMonth() === day.getMonth() &&
          logDate.getDate() === day.getDate()
        );
      });

      const totalMinutes = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

      days.push({
        date: day,
        minutes: totalMinutes,
        hours: totalMinutes / 60,
      });
    }

    return days;
  }, [timeLogs, weekOffset]);

  const weekData = getWeekData();
  const maxWeekHours = Math.max(...weekData.map((d) => d.hours), 8);

  const statusColors: Record<string, string> = {
    logged: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    paid: 'bg-blue-500',
  };

  const dayLabels = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-emerald-400" />
          {t.title}
        </h1>
        <p className="text-slate-400 mt-1">{t.subtitle}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Timer className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.todayHours}</p>
                <p className="text-2xl font-bold text-white">{stats.today.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.weekHours}</p>
                <p className="text-2xl font-bold text-white">{stats.week.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.monthHours}</p>
                <p className="text-2xl font-bold text-white">{stats.month.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.pendingApproval}</p>
                <p className="text-2xl font-bold text-white">{stats.pending.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                {timerRunning ? t.activeTimer : t.noActiveTimer}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Task Selection */}
              <div className="space-y-2">
                <label className="text-sm text-slate-400">{t.selectTask}</label>
                <Select
                  value={activeTaskId || ''}
                  onValueChange={setActiveTaskId}
                  disabled={timerRunning}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder={t.selectTask} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timer Display */}
              <div className="text-center py-6">
                <p
                  className={`text-5xl font-mono font-bold ${timerRunning ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  {formatTime(elapsedTime)}
                </p>
              </div>

              {/* Description */}
              {timerRunning && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">{t.description}</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descriptionPlaceholder}
                    className="bg-slate-900 border-slate-700 text-white resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Timer Controls */}
              <div className="flex gap-2">
                {!timerRunning ? (
                  <Button
                    onClick={startTimer}
                    disabled={!activeTaskId}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t.startTimer}
                  </Button>
                ) : (
                  <Button onClick={stopTimer} variant="destructive" className="flex-1">
                    <Square className="w-4 h-4 mr-2" />
                    {t.stopTimer}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Week View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  {t.weekView}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    disabled={weekOffset >= 0}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-48">
                {weekData.map((day, index) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const heightPercent = (day.hours / maxWeekHours) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-700 rounded-t relative h-36 flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`w-full rounded-t ${isToday ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        />
                      </div>
                      <p className="text-xs text-slate-400">{day.hours.toFixed(1)}h</p>
                      <p className={`text-xs ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {dayLabels[day.date.getDay()]}
                      </p>
                      <p className="text-xs text-slate-600">{day.date.getDate()}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t.recentLogs}</CardTitle>
          </CardHeader>
          <CardContent>
            {timeLogs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-white mb-2">{t.noLogs}</p>
                <p className="text-slate-400 text-sm">{t.noLogsDesc}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-800">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {log.task?.title || t.task}
                        </p>
                        <p className="text-sm text-slate-400">
                          {log.task?.project?.name || t.project} &bull;{' '}
                          {new Date(log.started_at).toLocaleDateString(
                            locale === 'es' ? 'es-MX' : 'en-US',
                            { month: 'short', day: 'numeric' }
                          )}
                        </p>
                        {log.description && (
                          <p className="text-xs text-slate-500 mt-1">{log.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-white">
                          {formatDuration(log.duration_minutes || 0)}
                        </p>
                      </div>
                      <Badge className={`${statusColors[log.status]} text-white border-none`}>
                        {t[log.status as keyof typeof t] || log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
