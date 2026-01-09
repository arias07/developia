'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  FileCode,
  Database,
  Loader2,
  Copy,
  Check,
  Download,
  Sparkles,
  FolderTree,
} from 'lucide-react';
import type { GeneratedFile, ProjectStructure } from '@/lib/openai/code-generator';

interface CodeGeneratorProps {
  projectId?: string;
  projectRequirements?: Record<string, unknown>;
}

export function CodeGenerator({ projectId, projectRequirements }: CodeGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [projectStructure, setProjectStructure] = useState<ProjectStructure | null>(null);
  const [activeTab, setActiveTab] = useState('prompt');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: {
            projectRequirements,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();
      setGeneratedFiles(data.result);
      setActiveTab('files');
    } catch {
      setError('Error generando código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStructure = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project-structure',
          context: {
            projectRequirements,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate project structure');
      }

      const data = await response.json();
      setProjectStructure(data.result);
      setGeneratedFiles(data.result.files || []);
      setActiveTab('structure');
    } catch {
      setError('Error generando estructura. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    generatedFiles.forEach((file) => {
      downloadFile(file);
    });
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      typescript: 'bg-blue-500',
      javascript: 'bg-yellow-500',
      tsx: 'bg-blue-500',
      jsx: 'bg-yellow-500',
      css: 'bg-purple-500',
      html: 'bg-orange-500',
      sql: 'bg-green-500',
      json: 'bg-gray-500',
    };
    return colors[lang.toLowerCase()] || 'bg-slate-500';
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Generador de Código Avanzado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 mb-6">
            <TabsTrigger value="prompt" className="data-[state=active]:bg-purple-600">
              <Code className="w-4 h-4 mr-2" />
              Prompt
            </TabsTrigger>
            <TabsTrigger value="structure" className="data-[state=active]:bg-purple-600">
              <FolderTree className="w-4 h-4 mr-2" />
              Estructura
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-purple-600">
              <FileCode className="w-4 h-4 mr-2" />
              Archivos ({generatedFiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Describe qué código necesitas generar:
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Crea un componente de tabla de usuarios con paginación, búsqueda y filtros. Debe mostrar nombre, email, rol y fecha de registro..."
                className="bg-slate-800 border-slate-700 text-white min-h-[150px]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar código
                  </>
                )}
              </Button>

              <Button
                onClick={handleGenerateStructure}
                disabled={loading}
                variant="outline"
                className="border-slate-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FolderTree className="w-4 h-4 mr-2" />
                    Generar estructura completa
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h4 className="text-sm font-medium text-white mb-2">Ejemplos de prompts:</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li
                  className="cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() =>
                    setPrompt(
                      'Crea un componente de formulario de contacto con validación, campos para nombre, email, teléfono y mensaje'
                    )
                  }
                >
                  • Formulario de contacto con validación
                </li>
                <li
                  className="cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() =>
                    setPrompt(
                      'Genera una API REST completa para gestionar productos: listar, crear, actualizar y eliminar'
                    )
                  }
                >
                  • API REST para gestión de productos
                </li>
                <li
                  className="cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() =>
                    setPrompt(
                      'Crea un hook personalizado para manejar paginación con estado local y parámetros de URL'
                    )
                  }
                >
                  • Hook de paginación reutilizable
                </li>
                <li
                  className="cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() =>
                    setPrompt(
                      'Genera un dashboard con gráficos de ventas, usuarios activos y métricas principales usando Recharts'
                    )
                  }
                >
                  • Dashboard con gráficos de métricas
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            {projectStructure ? (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-2">{projectStructure.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{projectStructure.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {projectStructure.techStack.map((tech, i) => (
                      <Badge key={i} variant="outline" className="border-purple-500 text-purple-400">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-3">Estructura de carpetas</h4>
                  <pre className="text-sm text-slate-300 font-mono whitespace-pre overflow-x-auto">
                    {projectStructure.folderStructure}
                  </pre>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-3">Instrucciones de setup</h4>
                  <ol className="space-y-2">
                    {projectStructure.setupInstructions.map((instruction, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-purple-400 font-medium">{i + 1}.</span>
                        <code className="bg-slate-700 px-2 py-0.5 rounded">{instruction}</code>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">
                  Genera una estructura completa de proyecto basada en los requerimientos
                </p>
                <Button
                  onClick={handleGenerateStructure}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FolderTree className="w-4 h-4 mr-2" />
                      Generar estructura
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            {generatedFiles.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-slate-400 text-sm">
                    {generatedFiles.length} archivo(s) generado(s)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAllFiles}
                    className="border-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar todos
                  </Button>
                </div>

                <div className="space-y-4">
                  {generatedFiles.map((file, index) => (
                    <div key={index} className="rounded-lg bg-slate-800 border border-slate-700 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getLanguageColor(file.language)} text-white border-none text-xs`}>
                            {file.language}
                          </Badge>
                          <span className="text-sm text-white font-mono">{file.path}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(file.content, index)}
                            className="text-slate-400 hover:text-white"
                          >
                            {copiedIndex === index ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 max-h-[400px] overflow-auto">
                        <pre className="text-sm text-slate-300 font-mono whitespace-pre">
                          {file.content}
                        </pre>
                      </div>
                      {file.description && (
                        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
                          <p className="text-xs text-slate-500">{file.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileCode className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Los archivos generados aparecerán aquí
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
