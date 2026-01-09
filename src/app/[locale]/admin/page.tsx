'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Briefcase,
  AlertTriangle,
  Star,
  Play,
  Pause,
  UserCheck,
  FileWarning,
  Activity,
  Timer,
  Target,
  Zap,
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
  // Freelancer stats
  totalFreelancers: number;
  activeFreelancers: number;
  pendingApplications: number;
  // Escalation stats
  pendingEscalations: number;
  criticalEscalations: number;
  resolvedToday: number;
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

interface FreelancerSummary {
  id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  status: string;
  availability: string;
  average_rating: number;
  total_tasks_completed: number;
  active_tasks: number;
}

interface EscalationSummary {
  id: string;
  project_name: string;
  type: string;
  severity: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface ProjectPipeline {
  status: string;
  count: number;
  projects: { id: string; name: string; client_name: string }[];
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
  failed: 'bg-red-500',
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
  failed: 'Fallido',
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white',
};

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500/20 text-green-400 border-green-500/30',
  busy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  unavailable: 'bg-red-500/20 text-red-400 border-red-500/30',
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
    totalFreelancers: 0,
    activeFreelancers: 0,
    pendingApplications: 0,
    pendingEscalations: 0,
    criticalEscalations: 0,
    resolvedToday: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [freelancers, setFreelancers] = useState<FreelancerSummary[]>([]);
  const [escalations, setEscalations] = useState<EscalationSummary[]>([]);
  const [pipeline, setPipeline] = useState<ProjectPipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient();

      // Fetch projects count by status
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, estimated_price, progress_percentage, profiles!projects_client_id_fkey(full_name)');

      if (projects) {
        const typedProjects = projects as any[];
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
          revenueGrowth: 15.3,
        }));

        // Build pipeline
        const pipelineStatuses = ['draft', 'requirements', 'quoted', 'paid', 'in_progress', 'review', 'completed'];
        const pipelineData = pipelineStatuses.map(status => ({
          status,
          count: typedProjects.filter(p => p.status === status).length,
          projects: typedProjects
            .filter(p => p.status === status)
            .slice(0, 3)
            .map(p => ({
              id: p.id,
              name: p.name,
              client_name: p.profiles?.full_name || 'Cliente',
            })),
        }));
        setPipeline(pipelineData);

        // Recent projects
        setRecentProjects(
          typedProjects
            .slice(0, 5)
            .map((p) => ({
              id: p.id,
              name: p.name,
              client_name: p.profiles?.full_name || 'Cliente',
              status: p.status,
              progress_percentage: p.progress_percentage || 0,
              estimated_price: p.estimated_price || 0,
              deadline: null,
            }))
        );
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
          newClientsThisMonth: Math.floor(clientsCount * 0.2),
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

      // Fetch freelancer stats
      const { data: freelancersData } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .order('average_rating', { ascending: false });

      if (freelancersData) {
        const approved = freelancersData.filter((f: any) => f.status === 'approved');
        const available = approved.filter((f: any) => f.availability === 'available');

        setStats((prev) => ({
          ...prev,
          totalFreelancers: freelancersData.length,
          activeFreelancers: available.length,
        }));

        // Get active tasks for each freelancer
        const freelancerSummaries: FreelancerSummary[] = await Promise.all(
          approved.slice(0, 5).map(async (f: any) => {
            const { count } = await supabase
              .from('freelancer_tasks')
              .select('id', { count: 'exact' })
              .eq('freelancer_id', f.id)
              .in('status', ['accepted', 'in_progress', 'review']);

            return {
              id: f.id,
              full_name: f.full_name,
              avatar_url: f.avatar_url,
              title: f.title,
              status: f.status,
              availability: f.availability,
              average_rating: f.average_rating || 0,
              total_tasks_completed: f.total_tasks_completed || 0,
              active_tasks: count || 0,
            };
          })
        );
        setFreelancers(freelancerSummaries);
      }

      // Fetch pending applications
      const { count: applicationsCount } = await supabase
        .from('freelancer_applications')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (applicationsCount) {
        setStats((prev) => ({
          ...prev,
          pendingApplications: applicationsCount,
        }));
      }

      // Fetch escalation stats
      const { data: escalationsData } = await supabase
        .from('escalations')
        .select('*, projects(name)')
        .in('status', ['pending', 'assigned', 'in_progress'])
        .order('created_at', { ascending: false });

      if (escalationsData) {
        const pending = escalationsData.filter((e: any) => e.status === 'pending').length;
        const critical = escalationsData.filter((e: any) => e.severity === 'critical').length;

        setStats((prev) => ({
          ...prev,
          pendingEscalations: pending,
          criticalEscalations: critical,
        }));

        setEscalations(
          escalationsData.slice(0, 5).map((e: any) => ({
            id: e.id,
            project_name: e.projects?.name || 'Proyecto',
            type: e.type,
            severity: e.severity,
            status: e.status,
            error_message: e.error_message,
            created_at: e.created_at,
          }))
        );
      }

      // Fetch resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: resolvedCount } = await supabase
        .from('escalations')
        .select('id', { count: 'exact' })
        .eq('status', 'resolved')
        .gte('resolved_at', today.toISOString());

      if (resolvedCount) {
        setStats((prev) => ({
          ...prev,
          resolvedToday: resolvedCount,
        }));
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const mainStatCards = [
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
      href: '/admin/projects',
    },
    {
      title: 'Freelancers activos',
      value: stats.activeFreelancers,
      subValue: `${stats.totalFreelancers} total`,
      icon: Briefcase,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      href: '/admin/freelancers',
    },
    {
      title: 'Escalaciones pendientes',
      value: stats.pendingEscalations,
      alert: stats.criticalEscalations > 0,
      alertText: `${stats.criticalEscalations} críticas`,
      icon: AlertTriangle,
      color: stats.criticalEscalations > 0 ? 'text-red-400' : 'text-yellow-400',
      bgColor: stats.criticalEscalations > 0 ? 'bg-red-500/10' : 'bg-yellow-500/10',
      href: '/admin/escalations',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStatCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href || '#'}>
              <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
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
                        {Math.abs(stat.change)}%
                      </div>
                    )}
                    {stat.alert && (
                      <Badge variant="destructive" className="text-xs">
                        {stat.alertText}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  {stat.subValue && (
                    <p className="text-xs text-slate-500 mt-1">{stat.subValue}</p>
                  )}
                  {stat.changeLabel && (
                    <p className="text-xs text-slate-500 mt-1">{stat.changeLabel}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Project Pipeline */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Pipeline de Proyectos
          </CardTitle>
          <Link href="/admin/projects">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-4">
            {pipeline.map((stage, index) => (
              <div
                key={stage.status}
                className="flex-shrink-0 w-48 bg-slate-800/50 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`${statusColors[stage.status]} text-white border-none text-xs`}>
                    {statusLabels[stage.status]}
                  </Badge>
                  <span className="text-lg font-bold text-white">{stage.count}</span>
                </div>
                <div className="space-y-2">
                  {stage.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.id}`}
                      className="block p-2 bg-slate-900/50 rounded border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <p className="text-sm text-white truncate">{project.name}</p>
                      <p className="text-xs text-slate-500 truncate">{project.client_name}</p>
                    </Link>
                  ))}
                  {stage.count > 3 && (
                    <p className="text-xs text-slate-500 text-center">+{stage.count - 3} más</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Freelancers Section */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              Freelancers
            </CardTitle>
            <div className="flex items-center gap-2">
              {stats.pendingApplications > 0 && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                  {stats.pendingApplications} aplicaciones
                </Badge>
              )}
              <Link href="/admin/freelancers">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  Gestionar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400">Cargando...</div>
            ) : freelancers.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No hay freelancers aprobados</p>
                <Link href="/admin/freelancers">
                  <Button variant="outline" size="sm" className="mt-3">
                    Ver aplicaciones
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {freelancers.map((freelancer) => (
                  <div
                    key={freelancer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={freelancer.avatar_url || undefined} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400">
                          {freelancer.full_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{freelancer.full_name}</p>
                        <p className="text-xs text-slate-400">{freelancer.title || 'Freelancer'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-sm">{freelancer.average_rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {freelancer.active_tasks} tareas activas
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={availabilityColors[freelancer.availability]}
                      >
                        {freelancer.availability === 'available' ? 'Disponible' :
                         freelancer.availability === 'busy' ? 'Ocupado' : 'No disponible'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escalations Section */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Escalaciones Activas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {stats.resolvedToday} resueltas hoy
              </Badge>
              <Link href="/admin/escalations">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400">Cargando...</div>
            ) : escalations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-400">Sin escalaciones pendientes</p>
                <p className="text-sm text-slate-500">Todo está funcionando correctamente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {escalations.map((escalation) => (
                  <Link
                    key={escalation.id}
                    href="/admin/escalations"
                    className="block p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-medium">{escalation.project_name}</p>
                        <p className="text-xs text-slate-400 capitalize">
                          {escalation.type.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge className={`${severityColors[escalation.severity]} text-xs`}>
                        {escalation.severity}
                      </Badge>
                    </div>
                    {escalation.error_message && (
                      <p className="text-xs text-slate-500 truncate">
                        {escalation.error_message}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Proyectos Recientes</CardTitle>
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

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Resumen del Día
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400">Clientes totales</span>
                </div>
                <span className="text-white font-medium">{stats.totalClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400">Consultorías</span>
                </div>
                <span className="text-white font-medium">{stats.pendingConsultations}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400">Equipo interno</span>
                </div>
                <span className="text-white font-medium">{stats.teamMembers}</span>
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

          {/* Quick Actions */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/freelancers">
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-800">
                  <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                  Gestionar Freelancers
                  {stats.pendingApplications > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-400">
                      {stats.pendingApplications}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/escalations">
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-800">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />
                  Ver Escalaciones
                  {stats.pendingEscalations > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-yellow-500/20 text-yellow-400">
                      {stats.pendingEscalations}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/code-generator">
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-800">
                  <Play className="w-4 h-4 mr-2 text-cyan-400" />
                  Generador de Código
                </Button>
              </Link>
              <Link href="/admin/finances">
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-800">
                  <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                  Reportes Financieros
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
