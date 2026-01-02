'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CodeGenerator } from '@/components/code-generator/code-generator';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2, FolderKanban } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  requirements: Record<string, unknown> | null;
}

export default function AdminCodeGeneratorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('projects')
        .select('id, name, requirements')
        .order('created_at', { ascending: false });

      if (data) {
        setProjects(data as Project[]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      setSelectedProject(project || null);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Generador de Código</h1>
          <p className="text-slate-400">
            Genera código automáticamente basado en los requerimientos del proyecto
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            Seleccionar Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-2 block">
                Proyecto (opcional - para usar sus requerimientos como contexto)
              </label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecciona un proyecto..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProjectId && selectedProjectId !== 'none' && (
              <Button
                variant="outline"
                onClick={() => setSelectedProjectId('')}
                className="border-slate-700"
              >
                Limpiar selección
              </Button>
            )}
          </div>

          {selectedProject?.requirements && (
            <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Requerimientos del proyecto:</p>
              <div className="text-sm text-slate-300 max-h-[200px] overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(selectedProject.requirements, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Generator */}
      <CodeGenerator
        projectId={selectedProjectId !== 'none' ? selectedProjectId : undefined}
        projectRequirements={selectedProject?.requirements || undefined}
      />

      {/* Quick Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Landing Page"
              description="Genera una landing page completa"
              onClick={() => {}}
            />
            <QuickActionCard
              title="Dashboard"
              description="Genera un dashboard con métricas"
              onClick={() => {}}
            />
            <QuickActionCard
              title="CRUD API"
              description="Genera endpoints CRUD completos"
              onClick={() => {}}
            />
            <QuickActionCard
              title="Auth System"
              description="Genera sistema de autenticación"
              onClick={() => {}}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500 hover:bg-slate-800 transition-all text-left"
    >
      <h4 className="font-medium text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </button>
  );
}
