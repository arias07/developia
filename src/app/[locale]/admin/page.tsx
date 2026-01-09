'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  Users,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  totalClients: number;
  newClientsThisMonth: number;
  teamMembers: number;
  pendingConsultations: number;
}

interface RecentProject {
  id: string;
  name: string;
  client_name: string;
  status: string;
  progress_percentage: number;
  estimated_price: number;
  deadline: string | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500',
  requirements: 'bg-yellow-500',
  quoted: 'bg-blue-500',
  paid: 'bg-purple-500',
  in_progress: 'bg-cyan-500',
  review: 'bg-orange-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  requirements: 'Requerimientos',
  quoted: 'Cotizado',
  paid: 'Pagado',
  in_progress: 'En desarrollo',
  review: 'En revisión',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueGrowth: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
    totalClients: 0,
    newClientsThisMonth: 0,
    teamMembers: 0,
    pendingConsultations: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient();

      // Fetch projects count by status
      const { data: projects } = await supabase.from('projects').select('id, status, estimated_price');

      if (projects) {
        const typedProjects = projects as { id: string; status: string; estimated_price: number | null }[];
        const active = typedProjects.filter((p) =>
          ['paid', 'in_progress', 'review'].includes(p.status)
        ).length;
        const completed = typedProjects.filter((p) => p.status === 'completed').length;
        const pending = typedProjects.filter((p) =>
          ['draft', 'requirements', 'quoted'].includes(p.status)
        ).length;
        const revenue = typedProjects
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + (p.estimated_price || 0), 0);

        setStats((prev) => ({
          ...prev,
          activeProjects: active,
          completedProjects: completed,
          pendingProjects: pending,
          totalRevenue: revenue,
          revenueGrowth: 15.3, // Placeholder
        }));
      }

      // Fetch clients count
      const { count: clientsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'client');

      if (clientsCount) {
        setStats((prev) => ({
          ...prev,
          totalClients: clientsCount,
          newClientsThisMonth: Math.floor(clientsCount * 0.2), // Placeholder
        }));
      }

      // Fetch team members count
      const { count: teamCount } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' });

      if (teamCount) {
        setStats((prev) => ({
          ...prev,
          teamMembers: teamCount,
        }));
      }

      // Fetch pending consultations
      const { count: consultationsCount } = await supabase
        .from('consultations')
        .select('id', { count: 'exact' })
        .eq('status', 'scheduled');

      if (consultationsCount) {
        setStats((prev) => ({
          ...prev,
          pendingConsultations: consultationsCount,
        }));
      }

      // Fetch recent projects with client info
      const { data: recentProjectsData } = await supabase
        .from('projects')
        .select(
          `
          id,
          name,
          status,
          progress_percentage,
          estimated_price,
          deadline,
          profiles!projects_client_id_fkey(full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentProjectsData) {
        setRecentProjects(
          recentProjectsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            client_name: p.profiles?.full_name || 'Cliente',
            status: p.status,
            progress_percentage: p.progress_percentage,
            estimated_price: p.estimated_price,
            deadline: p.deadline,
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Ingresos totales',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: stats.revenueGrowth,
      changeLabel: 'vs mes anterior',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Proyectos activos',
      value: stats.activeProjects,
      icon: FolderKanban,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Clientes totales',
      value: stats.totalClients,
      change: stats.newClientsThisMonth,
      changeLabel: 'nuevos este mes',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Consultorías pendientes',
      value: stats.pendingConsultations,
      icon: Calendar,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.change !== undefined && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        stat.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stat.change >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(stat.change)}
                      {stat.changeLabel && (
                        <span className="text-slate-500 text-xs ml-1">{stat.changeLabel}</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Proyectos recientes</CardTitle>
              <Link href="/admin/projects">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-400">Cargando...</div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No hay proyectos aún</div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link key={project.id} href={`/admin/projects/${project.id}`} className="block">
                      <div className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-white">{project.name}</h3>
                            <p className="text-sm text-slate-400">{project.client_name}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${statusColors[project.status]} text-white border-none`}>
                              {statusLabels[project.status]}
                            </Badge>
                            <p className="text-sm text-slate-400 mt-1">
                              ${project.estimated_price?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress value={project.progress_percentage} className="h-1.5 bg-slate-700" />
                          </div>
                          <span className="text-xs text-slate-400">{project.progress_percentage}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick stats & actions */}
        <div className="space-y-6">
          {/* Project status breakdown */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Estado de proyectos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400">Pendientes</span>
                </div>
                <span className="text-white font-medium">{stats.pendingProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">En desarrollo</span>
                </div>
                <span className="text-white font-medium">{stats.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400">Completados</span>
                </div>
                <span className="text-white font-medium">{stats.completedProjects}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/team/new">
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-800">
                  <UserPlus className="w-4 h-4 mr-2 text-purple-400" />
                  Agregar miembro al equipo
                </Button>
              </Link>
              <Link href="/admin/consultations">
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-800">
                  <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
                  Ver consultorías
                </Button>
              </Link>
              <Link href="/admin/finances">
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-800">
                  <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                  Reportes financieros
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Team members */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-lg">Equipo</CardTitle>
              <Link href="/admin/team">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  Ver todo
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-white">{stats.teamMembers}</p>
                <p className="text-sm text-slate-400">miembros activos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
