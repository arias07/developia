'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  FolderKanban,
  Search,
  Filter,
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
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

const typeLabels: Record<string, string> = {
  landing_page: 'Landing Page',
  website: 'Sitio Web',
  web_app: 'Aplicación Web',
  mobile_app: 'App Móvil',
  ecommerce: 'E-commerce',
  saas: 'SaaS',
  api: 'API/Backend',
  game: 'Juego',
  custom: 'Personalizado',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data as Project[]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'draft', label: 'Borradores' },
    { value: 'in_progress', label: 'En desarrollo' },
    { value: 'completed', label: 'Completados' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Proyectos</h1>
          <p className="text-slate-400">Gestiona todos tus proyectos</p>
        </div>
        <Link href="/funnel">
          <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Nuevo proyecto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(option.value)}
                  className={
                    statusFilter === option.value
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'border-slate-700 hover:bg-slate-800'
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron proyectos con esos filtros'
                : 'No tienes proyectos aún'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link href="/funnel">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600">
                  Crear mi primer proyecto
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/projects/${project.id}`}>
                <Card className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Project Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                              {project.name}
                            </h3>
                            <p className="text-sm text-slate-400 line-clamp-1">
                              {project.description}
                            </p>
                          </div>
                          <Badge
                            className={`${statusColors[project.status]} text-white border-none ml-2`}
                          >
                            {statusLabels[project.status]}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <FolderKanban className="w-4 h-4" />
                            {typeLabels[project.type] || project.type}
                          </span>
                          {project.estimated_price && (
                            <span>
                              ${project.estimated_price.toLocaleString()} {project.currency}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(project.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="md:w-48">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progreso</span>
                          <span>{project.progress_percentage}%</span>
                        </div>
                        <Progress
                          value={project.progress_percentage}
                          className="h-2 bg-slate-700"
                        />
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors hidden md:block" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{projects.length}</p>
              <p className="text-sm text-slate-400">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-cyan-400">
                {projects.filter((p) => ['paid', 'in_progress', 'review'].includes(p.status)).length}
              </p>
              <p className="text-sm text-slate-400">En desarrollo</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {projects.filter((p) => p.status === 'completed').length}
              </p>
              <p className="text-sm text-slate-400">Completados</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {projects.filter((p) => ['draft', 'requirements', 'quoted'].includes(p.status)).length}
              </p>
              <p className="text-sm text-slate-400">Pendientes</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
