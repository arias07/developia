'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  Download,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { FreelancerProfile, FreelancerPayment, FreelancerTask } from '@/types/database';

const content: Record<string, Record<string, string>> = {
  es: {
    title: 'Ganancias',
    subtitle: 'Resumen de tus ingresos y pagos',
    totalEarnings: 'Ganancias Totales',
    pendingPayment: 'Pago Pendiente',
    thisMonth: 'Este Mes',
    hoursWorked: 'Horas Trabajadas',
    recentPayments: 'Pagos Recientes',
    noPayments: 'Aún no tienes pagos registrados',
    completedTasks: 'Tareas Completadas',
    noTasks: 'No hay tareas completadas',
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    allTime: 'Todo el tiempo',
    lastMonth: 'Último mes',
    last3Months: 'Últimos 3 meses',
    lastYear: 'Último año',
    paymentMethod: 'Método de pago',
    reference: 'Referencia',
    period: 'Período',
    amount: 'Monto',
    status: 'Estado',
    date: 'Fecha',
    task: 'Tarea',
    project: 'Proyecto',
    hours: 'Horas',
    rate: 'Tarifa',
    earned: 'Ganado',
    downloadInvoice: 'Descargar factura',
    requestWithdrawal: 'Solicitar retiro',
    withdrawalInfo: 'Los pagos se procesan cada 15 días',
    minWithdrawal: 'Mínimo para retiro',
  },
  en: {
    title: 'Earnings',
    subtitle: 'Overview of your income and payments',
    totalEarnings: 'Total Earnings',
    pendingPayment: 'Pending Payment',
    thisMonth: 'This Month',
    hoursWorked: 'Hours Worked',
    recentPayments: 'Recent Payments',
    noPayments: 'No payments yet',
    completedTasks: 'Completed Tasks',
    noTasks: 'No completed tasks',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    allTime: 'All time',
    lastMonth: 'Last month',
    last3Months: 'Last 3 months',
    lastYear: 'Last year',
    paymentMethod: 'Payment method',
    reference: 'Reference',
    period: 'Period',
    amount: 'Amount',
    status: 'Status',
    date: 'Date',
    task: 'Task',
    project: 'Project',
    hours: 'Hours',
    rate: 'Rate',
    earned: 'Earned',
    downloadInvoice: 'Download invoice',
    requestWithdrawal: 'Request withdrawal',
    withdrawalInfo: 'Payments are processed every 15 days',
    minWithdrawal: 'Minimum withdrawal',
  },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function FreelancerEarningsPage() {
  const locale = useLocale();
  const t = content[locale] || content.es;
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [payments, setPayments] = useState<FreelancerPayment[]>([]);
  const [completedTasks, setCompletedTasks] = useState<FreelancerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayment: 0,
    thisMonth: 0,
    hoursWorked: 0,
  });

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  const fetchData = async () => {
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

    // Date filter
    let dateFilter = null;
    const now = new Date();
    if (timeFilter === 'lastMonth') {
      dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    } else if (timeFilter === 'last3Months') {
      dateFilter = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    } else if (timeFilter === 'lastYear') {
      dateFilter = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
    }

    // Get payments
    let paymentsQuery = supabase
      .from('freelancer_payments')
      .select('*')
      .eq('freelancer_id', profileData.id)
      .order('created_at', { ascending: false });

    if (dateFilter) {
      paymentsQuery = paymentsQuery.gte('created_at', dateFilter);
    }

    const { data: paymentsData } = await paymentsQuery;
    if (paymentsData) {
      setPayments(paymentsData as FreelancerPayment[]);
    }

    // Get completed tasks
    let tasksQuery = supabase
      .from('freelancer_tasks')
      .select(`
        *,
        project:projects(id, name)
      `)
      .eq('freelancer_id', profileData.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (dateFilter) {
      tasksQuery = tasksQuery.gte('completed_at', dateFilter);
    }

    const { data: tasksData } = await tasksQuery;
    if (tasksData) {
      setCompletedTasks(tasksData as FreelancerTask[]);
    }

    // Calculate stats
    const totalEarnings = profileData.total_earnings || 0;

    // Pending payment (completed tasks not yet paid)
    const { data: pendingTasks } = await supabase
      .from('freelancer_tasks')
      .select('hourly_rate, actual_hours, fixed_amount, total_paid')
      .eq('freelancer_id', profileData.id)
      .eq('status', 'completed');

    const pendingPayment = pendingTasks?.reduce((sum: number, task: { fixed_amount?: number; hourly_rate?: number; actual_hours?: number; total_paid?: number }) => {
      const earned = task.fixed_amount || ((task.hourly_rate || 0) * (task.actual_hours || 0));
      return sum + earned - (task.total_paid || 0);
    }, 0) || 0;

    // This month earnings
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: monthPayments } = await supabase
      .from('freelancer_payments')
      .select('amount')
      .eq('freelancer_id', profileData.id)
      .eq('status', 'completed')
      .gte('processed_at', monthStart);

    const thisMonth = monthPayments?.reduce((sum: number, p: { amount?: number }) => sum + (p.amount || 0), 0) || 0;

    // Hours worked this month
    const { data: monthLogs } = await supabase
      .from('freelancer_time_logs')
      .select('duration_minutes')
      .eq('freelancer_id', profileData.id)
      .gte('started_at', monthStart);

    const hoursWorked = (monthLogs?.reduce((sum: number, l: { duration_minutes?: number }) => sum + (l.duration_minutes || 0), 0) || 0) / 60;

    setStats({
      totalEarnings,
      pendingPayment,
      thisMonth,
      hoursWorked: Math.round(hoursWorked * 10) / 10,
    });

    setLoading(false);
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">{t.allTime}</SelectItem>
              <SelectItem value="lastMonth">{t.lastMonth}</SelectItem>
              <SelectItem value="last3Months">{t.last3Months}</SelectItem>
              <SelectItem value="lastYear">{t.lastYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={stats.pendingPayment < 100}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {t.requestWithdrawal}
          </Button>
        </div>
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
                  <p className="text-slate-400 text-sm">{t.totalEarnings}</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(stats.totalEarnings, profile?.currency || 'USD')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
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
                  <p className="text-slate-400 text-sm">{t.pendingPayment}</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(stats.pendingPayment, profile?.currency || 'USD')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
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
                  <p className="text-slate-400 text-sm">{t.thisMonth}</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(stats.thisMonth, profile?.currency || 'USD')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
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
                  <p className="text-slate-400 text-sm">{t.hoursWorked}</p>
                  <p className="text-2xl font-bold text-white">{stats.hoursWorked}h</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Withdrawal Info */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{t.withdrawalInfo}</p>
            <p className="text-slate-400 text-sm">
              {t.minWithdrawal}: {formatCurrency(100, profile?.currency || 'USD')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">{t.recentPayments}</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">{t.noPayments}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-medium text-white">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                      <Badge className={statusColors[payment.status]}>
                        {t[payment.status] || payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.created_at)}
                      </span>
                      {payment.payment_method && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {payment.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">{t.completedTasks}</CardTitle>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">{t.noTasks}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => {
                  const earned = task.fixed_amount || ((task.hourly_rate || 0) * (task.actual_hours || 0));
                  return (
                    <div
                      key={task.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white truncate">{task.title}</span>
                        <span className="text-emerald-400 font-medium">
                          {formatCurrency(earned, profile?.currency || 'USD')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {task.project && (
                          <span>📁 {(task.project as { name?: string }).name}</span>
                        )}
                        {task.actual_hours > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.actual_hours.toFixed(1)}h
                          </span>
                        )}
                        {task.completed_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {formatDate(task.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
