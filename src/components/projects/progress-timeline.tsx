'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Milestone,
  FileCode,
  Rocket,
  TestTube,
  Eye,
  PartyPopper,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface MilestoneData {
  id: string;
  project_id: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  progress_percentage: number;
  due_date?: string;
  completed_at?: string;
  deliverables: string[];
  created_at: string;
}

interface ProgressTimelineProps {
  projectId: string;
}

const phaseIcons: Record<string, React.ReactNode> = {
  planning: <FileCode className="w-5 h-5" />,
  design: <Eye className="w-5 h-5" />,
  development: <Rocket className="w-5 h-5" />,
  testing: <TestTube className="w-5 h-5" />,
  review: <Eye className="w-5 h-5" />,
  deployment: <Rocket className="w-5 h-5" />,
  completed: <PartyPopper className="w-5 h-5" />,
};

const defaultMilestones = [
  {
    name: 'Planificación',
    description: 'Definición de requerimientos y arquitectura',
    deliverables: ['PRD', 'User Stories', 'Especificación Técnica'],
    phase: 'planning',
  },
  {
    name: 'Diseño',
    description: 'Diseño UI/UX y prototipos',
    deliverables: ['Wireframes', 'Mockups', 'Design System'],
    phase: 'design',
  },
  {
    name: 'Desarrollo Frontend',
    description: 'Implementación de la interfaz de usuario',
    deliverables: ['Componentes', 'Páginas', 'Integración API'],
    phase: 'development',
  },
  {
    name: 'Desarrollo Backend',
    description: 'Implementación de la lógica de negocio',
    deliverables: ['API', 'Base de datos', 'Autenticación'],
    phase: 'development',
  },
  {
    name: 'Testing',
    description: 'Pruebas y aseguramiento de calidad',
    deliverables: ['Tests unitarios', 'Tests de integración', 'QA'],
    phase: 'testing',
  },
  {
    name: 'Revisión',
    description: 'Revisión con el cliente y ajustes',
    deliverables: ['Demo', 'Feedback', 'Ajustes finales'],
    phase: 'review',
  },
  {
    name: 'Despliegue',
    description: 'Publicación en producción',
    deliverables: ['Deploy', 'Configuración DNS', 'Monitoreo'],
    phase: 'deployment',
  },
];

export function ProgressTimeline({ projectId }: ProgressTimelineProps) {
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (!error && data && data.length > 0) {
      setMilestones(data as MilestoneData[]);
    } else {
      // Si no hay milestones, usar los predeterminados
      setMilestones(
        defaultMilestones.map((m, i) => ({
          id: `default-${i}`,
          project_id: projectId,
          name: m.name,
          description: m.description,
          order: i,
          status: i === 0 ? 'in_progress' : 'pending',
          progress_percentage: i === 0 ? 50 : 0,
          deliverables: m.deliverables,
          created_at: new Date().toISOString(),
        })) as MilestoneData[]
      );
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    if (isCompleted || status === 'completed') {
      return <CheckCircle2 className="w-6 h-6 text-green-400" />;
    }
    if (status === 'in_progress') {
      return <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />;
    }
    if (status === 'blocked') {
      return <Clock className="w-6 h-6 text-red-400" />;
    }
    return <Circle className="w-6 h-6 text-slate-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500/10';
      case 'in_progress':
        return 'border-purple-500 bg-purple-500/10';
      case 'blocked':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-slate-600 bg-slate-800/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const overallProgress = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Progreso General</h3>
              <p className="text-sm text-slate-400">
                {completedCount} de {milestones.length} fases completadas
              </p>
            </div>
            <div className="text-3xl font-bold text-purple-400">{overallProgress}%</div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Milestone className="w-5 h-5 text-purple-400" />
            Timeline del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-700" />

            <div className="space-y-6">
              {milestones.map((milestone, index) => {
                const isCompleted = milestone.status === 'completed';
                const isActive = milestone.status === 'in_progress';

                return (
                  <div key={milestone.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 shrink-0 ${
                        isCompleted
                          ? 'border-green-500 bg-green-500/20'
                          : isActive
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {getStatusIcon(milestone.status, isCompleted)}
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 p-4 rounded-lg border transition-all ${getStatusColor(
                        milestone.status
                      )}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-white flex items-center gap-2">
                            {milestone.name}
                            {isActive && (
                              <Badge className="bg-purple-600 text-white border-none text-xs">
                                En Progreso
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge className="bg-green-600 text-white border-none text-xs">
                                Completado
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-slate-400">{milestone.description}</p>
                        </div>
                        {milestone.due_date && (
                          <span className="text-xs text-slate-500">
                            {new Date(milestone.due_date).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Progress bar for active milestone */}
                      {isActive && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progreso</span>
                            <span>{milestone.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${milestone.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Deliverables */}
                      <div className="flex flex-wrap gap-2">
                        {milestone.deliverables.map((deliverable, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className={`text-xs ${
                              isCompleted
                                ? 'border-green-600 text-green-400'
                                : 'border-slate-600 text-slate-400'
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {deliverable}
                          </Badge>
                        ))}
                      </div>

                      {milestone.completed_at && (
                        <p className="text-xs text-green-400 mt-2">
                          Completado el{' '}
                          {new Date(milestone.completed_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
