'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Code2,
  MessageSquare,
  CreditCard,
  Clock,
  Calendar,
  ExternalLink,
  Github,
  Globe,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Zap,
  Database,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { Project, ProjectRequirements } from '@/types/database';
import { PRDViewer } from '@/components/documents/prd-viewer';
import { TicketList } from '@/components/tickets/ticket-list';
import { ProjectChat } from '@/components/chat/project-chat';
import { PaymentHistory } from '@/components/payments/payment-history';
import { ProgressTimeline } from '@/components/projects/progress-timeline';
import { ReviewPanel } from '@/components/reviews/review-panel';

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

const projectTypeLabels: Record<string, string> = {
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<ProjectRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const projectId = params.id as string;

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        router.push('/dashboard');
        return;
      }

      setProject(data as Project);
      if (data.requirements_json) {
        setRequirements(data.requirements_json as ProjectRequirements);
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Proyecto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                <Badge className={`${statusColors[project.status]} text-white border-none`}>
                  {statusLabels[project.status]}
                </Badge>
              </div>
              <p className="text-slate-400">{project.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {project.github_repo_url && (
                <a
                  href={project.github_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              )}
              {project.deployment_url && (
                <a
                  href={project.deployment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Ver en vivo
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Tipo</p>
                  <p className="text-white font-medium">
                    {projectTypeLabels[project.type] || project.type}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CreditCard className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Precio</p>
                  <p className="text-white font-medium">
                    ${project.estimated_price?.toLocaleString()} {project.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Duración Est.</p>
                  <p className="text-white font-medium">
                    {project.estimated_duration_days} días
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Rocket className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Progreso</p>
                  <p className="text-white font-medium">{project.progress_percentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Progreso del proyecto</span>
                <span className="text-sm text-white font-medium">
                  {project.progress_percentage}%
                </span>
              </div>
              <Progress value={project.progress_percentage} className="h-3 bg-slate-700" />
              {project.current_phase && (
                <p className="text-sm text-slate-400 mt-2">
                  Fase actual: <span className="text-white">{project.current_phase}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-800/50 border border-slate-700 p-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Code2 className="w-4 h-4 mr-2" />
                Documentos
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="tickets"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Soporte
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagos
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Revisiones
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Requirements Summary */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-400" />
                      Requerimientos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {requirements ? (
                      <>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Audiencia objetivo</p>
                          <p className="text-white">{requirements.target_audience}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Objetivos principales</p>
                          <ul className="list-disc list-inside text-white">
                            {requirements.main_goals?.map((goal, i) => (
                              <li key={i}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Funcionalidades core ({requirements.core_features?.length || 0})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {requirements.core_features?.slice(0, 5).map((feature, i) => (
                              <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                                {feature.name}
                              </Badge>
                            ))}
                            {(requirements.core_features?.length || 0) > 5 && (
                              <Badge variant="outline" className="border-slate-600 text-slate-400">
                                +{(requirements.core_features?.length || 0) - 5} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-400">No hay requerimientos definidos</p>
                    )}
                  </CardContent>
                </Card>

                {/* Technical Stack */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-cyan-400" />
                      Stack Técnico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.tech_stack && project.tech_stack.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.map((tech, i) => (
                          <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-none">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-none">Next.js</Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-none">React</Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-none">TypeScript</Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-none">Tailwind CSS</Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-none">Supabase</Badge>
                      </div>
                    )}

                    {requirements?.technical_requirements && (
                      <>
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Plataformas</p>
                          <div className="flex gap-2">
                            {requirements.technical_requirements.platform?.map((p, i) => (
                              <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                                {p === 'web' ? 'Web' : p === 'ios' ? 'iOS' : 'Android'}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            {requirements.technical_requirements.authentication_needed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-slate-300">Autenticación</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {requirements.technical_requirements.payment_processing ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-slate-300">Pagos</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {requirements.technical_requirements.admin_panel ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-slate-300">Panel Admin</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {requirements.technical_requirements.multi_language ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-slate-300">Multi-idioma</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Dates */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      Fechas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Creado</span>
                      <span className="text-white">
                        {new Date(project.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {project.started_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Iniciado</span>
                        <span className="text-white">
                          {new Date(project.started_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fecha límite</span>
                        <span className="text-white">
                          {new Date(project.deadline).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {project.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Completado</span>
                        <span className="text-green-400">
                          {new Date(project.completed_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Generated Info */}
                {project.ai_generated && (
                  <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Generado Automáticamente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-slate-300 text-sm">
                        Este proyecto fue desarrollado de forma autónoma por nuestro sistema.
                      </p>
                      {project.github_repo_url && (
                        <a
                          href={project.github_repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                        >
                          <Github className="w-4 h-4" />
                          Ver código fuente
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {project.deployment_url && (
                        <a
                          href={project.deployment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                        >
                          <Globe className="w-4 h-4" />
                          Ver sitio desplegado
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <PRDViewer projectId={projectId} prdDocument={project.prd_document} />
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <ProgressTimeline projectId={projectId} />
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <ProjectChat projectId={projectId} />
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <TicketList projectId={projectId} />
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <PaymentHistory projectId={projectId} />
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <ReviewPanel projectId={projectId} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
