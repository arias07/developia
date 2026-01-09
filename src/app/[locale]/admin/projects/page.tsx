'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, MoreVertical, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Project, ProjectStatus } from '@/types/database';

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

interface ProjectWithClient extends Project {
  client?: {
    full_name: string;
    email: string;
  };
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('projects')
        .select(
          `
          *,
          client:profiles!projects_client_id_fkey(full_name, email)
        `
        )
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;

      if (data) {
        setProjects(data as ProjectWithClient[]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [statusFilter]);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateProjectStatus = async (projectId: string, newStatus: ProjectStatus) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar proyectos o clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Proyectos ({filteredProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando proyectos...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No se encontraron proyectos</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Proyecto</TableHead>
                    <TableHead className="text-slate-400">Cliente</TableHead>
                    <TableHead className="text-slate-400">Estado</TableHead>
                    <TableHead className="text-slate-400">Progreso</TableHead>
                    <TableHead className="text-slate-400">Precio</TableHead>
                    <TableHead className="text-slate-400">Fecha límite</TableHead>
                    <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{project.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{project.type.replace('_', ' ')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{project.client?.full_name}</p>
                          <p className="text-xs text-slate-400">{project.client?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={project.status}
                          onValueChange={(value) =>
                            updateProjectStatus(project.id, value as ProjectStatus)
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8 bg-transparent border-none p-0">
                            <Badge
                              className={`${statusColors[project.status]} text-white border-none`}
                            >
                              {statusLabels[project.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress
                            value={project.progress_percentage}
                            className="h-2 flex-1 bg-slate-700"
                          />
                          <span className="text-xs text-slate-400 w-8">
                            {project.progress_percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        ${project.estimated_price?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {project.deadline ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.deadline).toLocaleDateString()}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-slate-800 border-slate-700"
                          >
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/projects/${project.id}`}
                                className="text-slate-300 hover:text-white cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-slate-300 hover:text-white cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:text-red-300 cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
