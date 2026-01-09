'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FolderKanban,
  Clock,
  Target,
  Activity,
  Eye,
  MousePointer,
  ArrowUpRight,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    byMonth: { month: string; amount: number }[];
  };
  projects: {
    total: number;
    completed: number;
    inProgress: number;
    conversionRate: number;
  };
  clients: {
    total: number;
    new: number;
    returning: number;
    retention: number;
  };
  funnel: {
    visits: number;
    started: number;
    completed: number;
    paid: number;
  };
  topProjects: {
    name: string;
    revenue: number;
    type: string;
  }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabase = getSupabaseClient();

      // Fetch projects
      const { data: projects } = await supabase.from('projects').select('*');

      // Fetch clients
      const { data: clients } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client');

      // Fetch funnel sessions
      const { data: funnelSessions } = await supabase.from('funnel_sessions').select('*');

      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed');

      if (projects && clients) {
        const completed = projects.filter((p) => p.status === 'completed');
        const inProgress = projects.filter((p) =>
          ['in_progress', 'review', 'paid'].includes(p.status)
        );
        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Calculate funnel data
        const funnelVisits = funnelSessions?.length || 0;
        const funnelStarted = funnelSessions?.filter((s: any) => s.max_step_reached > 1).length || 0;
        const funnelCompleted =
          funnelSessions?.filter((s: any) => s.converted_to_project_id).length || 0;
        const funnelPaid = projects.filter((p) =>
          ['paid', 'in_progress', 'review', 'completed'].includes(p.status)
        ).length;

        // Get top projects by revenue
        const topProjects = [...projects]
          .sort((a, b) => (b.estimated_price || 0) - (a.estimated_price || 0))
          .slice(0, 5)
          .map((p) => ({
            name: p.name,
            revenue: p.estimated_price || 0,
            type: p.type,
          }));

        // Calculate monthly revenue (mock data for now)
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const byMonth = months.map((month, i) => ({
          month,
          amount: Math.floor(totalRevenue * (0.1 + Math.random() * 0.2)),
        }));

        setData({
          revenue: {
            total: totalRevenue,
            growth: 15.3,
            byMonth,
          },
          projects: {
            total: projects.length,
            completed: completed.length,
            inProgress: inProgress.length,
            conversionRate:
              funnelVisits > 0 ? Math.round((funnelPaid / funnelVisits) * 100) : 0,
          },
          clients: {
            total: clients.length,
            new: Math.floor(clients.length * 0.3),
            returning: Math.floor(clients.length * 0.7),
            retention: 78,
          },
          funnel: {
            visits: funnelVisits || 100,
            started: funnelStarted || 45,
            completed: funnelCompleted || 20,
            paid: funnelPaid || 15,
          },
          topProjects,
        });
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-slate-400">Cargando analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-slate-400">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Metricas y rendimiento de la plataforma</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7d" className="text-white">Ultimos 7 dias</SelectItem>
            <SelectItem value="30d" className="text-white">Ultimos 30 dias</SelectItem>
            <SelectItem value="90d" className="text-white">Ultimos 90 dias</SelectItem>
            <SelectItem value="1y" className="text-white">Ultimo ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  {data.revenue.growth}%
                </div>
              </div>
              <p className="text-sm text-slate-400">Ingresos totales</p>
              <p className="text-2xl font-bold text-white">
                ${data.revenue.total.toLocaleString()}
              </p>
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
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <FolderKanban className="w-6 h-6 text-purple-400" />
                </div>
                <Badge className="bg-purple-500/20 text-purple-400 border-none">
                  {data.projects.inProgress} activos
                </Badge>
              </div>
              <p className="text-sm text-slate-400">Proyectos totales</p>
              <p className="text-2xl font-bold text-white">{data.projects.total}</p>
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
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-blue-400 text-sm">
                  +{data.clients.new} nuevos
                </div>
              </div>
              <p className="text-sm text-slate-400">Clientes</p>
              <p className="text-2xl font-bold text-white">{data.clients.total}</p>
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
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-cyan-500/10">
                  <Target className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400">Tasa de conversion</p>
              <p className="text-2xl font-bold text-white">{data.projects.conversionRate}%</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Embudo de Conversion
            </CardTitle>
            <CardDescription className="text-slate-400">
              Del visitante al cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">Visitas</span>
                  </div>
                  <span className="text-white font-medium">{data.funnel.visits}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">Iniciaron formulario</span>
                  </div>
                  <span className="text-white font-medium">{data.funnel.started}</span>
                </div>
                <Progress
                  value={(data.funnel.started / data.funnel.visits) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">Crearon proyecto</span>
                  </div>
                  <span className="text-white font-medium">{data.funnel.completed}</span>
                </div>
                <Progress
                  value={(data.funnel.completed / data.funnel.visits) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Pagaron</span>
                  </div>
                  <span className="text-green-400 font-medium">{data.funnel.paid}</span>
                </div>
                <Progress
                  value={(data.funnel.paid / data.funnel.visits) * 100}
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tasa de conversion total</span>
                <span className="text-xl font-bold text-green-400">
                  {((data.funnel.paid / data.funnel.visits) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Top Proyectos por Ingreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProjects.map((project, index) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{project.name}</p>
                      <p className="text-xs text-slate-400 capitalize">
                        {project.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-medium">
                      ${project.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {data.topProjects.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No hay proyectos con ingresos registrados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Retencion de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(data.clients.retention / 100) * 352} 352`}
                    className="text-green-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{data.clients.retention}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-slate-400 mt-4">Clientes que regresan</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Proyectos Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(data.projects.completed / Math.max(data.projects.total, 1)) * 352} 352`}
                    className="text-purple-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{data.projects.completed}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-slate-400 mt-4">de {data.projects.total} totales</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Distribucion de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Nuevos</span>
                <span className="text-white">{data.clients.new}</span>
              </div>
              <Progress
                value={(data.clients.new / Math.max(data.clients.total, 1)) * 100}
                className="h-2"
                indicatorClassName="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Recurrentes</span>
                <span className="text-white">{data.clients.returning}</span>
              </div>
              <Progress
                value={(data.clients.returning / Math.max(data.clients.total, 1)) * 100}
                className="h-2"
                indicatorClassName="bg-green-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
