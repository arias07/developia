'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Github,
  Globe,
  Database,
  Code2,
  Rocket,
  RefreshCw
} from 'lucide-react';

interface DevelopmentStatus {
  projectId: string;
  status: string;
  repositoryUrl?: string;
  deploymentUrl?: string;
  developmentResult?: {
    success: boolean;
    generatedFiles: string[];
    errors: string[];
    completedAt: string;
  };
  updatedAt: string;
}

interface DevelopmentOptions {
  createGitHubRepo: boolean;
  deployToVercel: boolean;
  generateSupabase: boolean;
  sendNotifications: boolean;
}

interface AutonomousDeveloperProps {
  projectId: string;
  userId: string;
  projectName: string;
}

export function AutonomousDeveloper({ projectId, userId, projectName }: AutonomousDeveloperProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [status, setStatus] = useState<DevelopmentStatus | null>(null);
  const [options, setOptions] = useState<DevelopmentOptions>({
    createGitHubRepo: true,
    deployToVercel: true,
    generateSupabase: true,
    sendNotifications: true,
  });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    fetchStatus();
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [projectId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/projects/develop?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);

        // Si está en desarrollo, iniciar polling
        if (data.status === 'in_development' && !pollingInterval) {
          const interval = setInterval(fetchStatus, 5000);
          setPollingInterval(interval);
        }

        // Si terminó, detener polling
        if (data.status === 'completed' || data.status === 'failed') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const startDevelopment = async () => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/projects/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          options,
        }),
      });

      if (response.ok) {
        // Iniciar polling
        const interval = setInterval(fetchStatus, 5000);
        setPollingInterval(interval);
        await fetchStatus();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error starting development:', error);
      alert('Error al iniciar el desarrollo');
    } finally {
      setIsStarting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'in_development': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      case 'failed': return <XCircle className="w-5 h-5" />;
      case 'in_development': return <Loader2 className="w-5 h-5 animate-spin" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      case 'in_development': return 'En Desarrollo...';
      case 'pending': return 'Pendiente';
      case 'quoted': return 'Cotizado';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-purple-600" />
            Desarrollo Autónomo
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Genera y despliega el proyecto automáticamente
          </p>
        </div>

        {status && (
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${getStatusColor(status.status)}`}>
            {getStatusIcon(status.status)}
            <span className="font-medium">{getStatusText(status.status)}</span>
          </div>
        )}
      </div>

      {/* Opciones de desarrollo */}
      {(!status || status.status === 'pending' || status.status === 'quoted') && (
        <div className="mb-6 space-y-3">
          <h3 className="font-medium text-gray-700 mb-2">Opciones de Desarrollo</h3>

          <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={options.createGitHubRepo}
              onChange={(e) => setOptions({ ...options, createGitHubRepo: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <Github className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Crear repositorio en GitHub</p>
              <p className="text-sm text-gray-500">Sube el código a un nuevo repositorio</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={options.deployToVercel}
              onChange={(e) => setOptions({ ...options, deployToVercel: e.target.checked })}
              disabled={!options.createGitHubRepo}
              className="w-4 h-4 text-purple-600 rounded disabled:opacity-50"
            />
            <Globe className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Desplegar en Vercel</p>
              <p className="text-sm text-gray-500">Publica el proyecto en línea automáticamente</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={options.generateSupabase}
              onChange={(e) => setOptions({ ...options, generateSupabase: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <Database className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Generar backend con Supabase</p>
              <p className="text-sm text-gray-500">Crea esquema de base de datos, RLS y Edge Functions</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={options.sendNotifications}
              onChange={(e) => setOptions({ ...options, sendNotifications: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <Code2 className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Enviar notificaciones de progreso</p>
              <p className="text-sm text-gray-500">Recibe actualizaciones en tiempo real</p>
            </div>
          </label>
        </div>
      )}

      {/* Botón de inicio */}
      {(!status || status.status === 'pending' || status.status === 'quoted') && (
        <button
          onClick={startDevelopment}
          disabled={isStarting}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Iniciar Desarrollo Autónomo
            </>
          )}
        </button>
      )}

      {/* Estado en desarrollo */}
      {status?.status === 'in_development' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto" />
                <Rocket className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-700">
                Desarrollando {projectName}...
              </p>
              <p className="text-sm text-gray-500">
                Esto puede tomar unos minutos
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            className="w-full py-2 text-purple-600 hover:text-purple-800 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar estado
          </button>
        </div>
      )}

      {/* Resultado completado */}
      {status?.status === 'completed' && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">¡Proyecto completado!</span>
            </div>
            <p className="text-sm text-green-600">
              El desarrollo se completó exitosamente.
            </p>
          </div>

          {status.repositoryUrl && (
            <a
              href={status.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Github className="w-6 h-6" />
              <div className="flex-1">
                <p className="font-medium">Repositorio GitHub</p>
                <p className="text-sm text-gray-500 truncate">{status.repositoryUrl}</p>
              </div>
            </a>
          )}

          {status.deploymentUrl && (
            <a
              href={status.deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Sitio en Vivo</p>
                <p className="text-sm text-gray-500 truncate">{status.deploymentUrl}</p>
              </div>
            </a>
          )}

          {status.developmentResult?.generatedFiles && (
            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Archivos Generados ({status.developmentResult.generatedFiles.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {status.developmentResult.generatedFiles.slice(0, 20).map((file, i) => (
                  <p key={i} className="text-sm text-gray-600 font-mono">
                    {file}
                  </p>
                ))}
                {status.developmentResult.generatedFiles.length > 20 && (
                  <p className="text-sm text-gray-400">
                    ... y {status.developmentResult.generatedFiles.length - 20} más
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resultado fallido */}
      {status?.status === 'failed' && (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Error en el desarrollo</span>
            </div>
            {status.developmentResult?.errors && (
              <ul className="text-sm text-red-600 list-disc list-inside">
                {status.developmentResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => {
              setStatus(null);
            }}
            className="w-full py-3 px-4 border border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
