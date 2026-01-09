'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500',
  requirements: 'bg-yellow-500',
  quoted: 'bg-blue-500',
  paid: 'bg-purple-500',
  in_progress: 'bg-cyan-500',
  in_development: 'bg-indigo-500',
  deploying: 'bg-violet-500',
  review: 'bg-orange-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  requirements: 'Definiendo requerimientos',
  quoted: 'Cotizado',
  paid: 'Pagado',
  in_progress: 'En desarrollo',
  in_development: 'En construcción',
  deploying: 'Desplegando',
  review: 'En revisión',
  completed: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
};

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setProjects(data as Project[]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const activeProjects = projects.filter((p) =>
    ['paid', 'in_progress', 'review'].includes(p.status)
  );
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const pendingProjects = projects.filter((p) =>
    ['draft', 'requirements', 'quoted'].includes(p.status)
  );

  const stats = [
    {
      title: 'Proyectos activos',
      value: activeProjects.length,
      icon: FolderKanban,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'En proceso',
      value: pendingProjects.length,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Completados',
      value: completedProjects.length,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              ¡Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}!
            </h1>
            {profile?.role && profile.role !== 'client' && (
              <Badge className={`${
                profile.role === 'admin' ? 'bg-red-500' :
                profile.role === 'project_manager' ? 'bg-purple-500' :
                'bg-blue-500'
              } text-white border-none text-xs`}>
                {profile.role === 'admin' ? 'Admin' :
                 profile.role === 'project_manager' ? 'PM' :
                 profile.role}
              </Badge>
            )}
          </div>
          <p className="text-slate-400">Aquí está el resumen de tus proyectos</p>
        </div>
        <Link href="/funnel">
          <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Nuevo proyecto
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Proyectos recientes</CardTitle>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-400">Cargando proyectos...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No tienes proyectos aún</p>
                  <Link href="/funnel">
                    <Button className="bg-gradient-to-r from-purple-600 to-cyan-600">
                      Crear mi primer proyecto
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="block"
                    >
                      <div className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                              {project.name}
                            </h3>
                            <p className="text-sm text-slate-400 line-clamp-1">
                              {project.description}
                            </p>
                          </div>
                          <Badge
                            className={`${
                              statusColors[project.status]
                            } text-white border-none`}
                          >
                            {statusLabels[project.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Progreso</span>
                              <span>{project.progress_percentage}%</span>
                            </div>
                            <Progress
                              value={project.progress_percentage}
                              className="h-1.5 bg-slate-700"
                            />
                          </div>
                          {project.deadline && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {new Date(project.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/funnel" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 hover:bg-slate-800"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                  Iniciar nuevo proyecto
                </Button>
              </Link>
              <Link href="/consultation" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 hover:bg-slate-800"
                >
                  <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
                  Agendar consultoría
                </Button>
              </Link>
              <Link href="/dashboard/messages" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 hover:bg-slate-800"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-green-400" />
                  Ver mensajes
                </Button>
              </Link>
              <Link href="/dashboard/documents" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 hover:bg-slate-800"
                >
                  <FileText className="w-4 h-4 mr-2 text-yellow-400" />
                  Documentos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* ERPHYX promo */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">¿Necesitas un ERP?</h3>
                  <p className="text-xs text-slate-400">Sistema empresarial completo</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Conoce ERPHYX, nuestra solución empresarial integral para gestión de recursos.
              </p>
              <a
                href="https://erphyx.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-white text-slate-900 hover:bg-slate-200">
                  Conocer ERPHYX
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
