import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { developProject, type DevelopmentConfig } from '@/lib/agents/development-agent';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase environment variables are not set');
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, options } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'projectId y userId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener los requerimientos del proyecto
    const supabase = getSupabase();
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, project_requirements(*)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene permiso
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Actualizar estado del proyecto
    await supabase
      .from('projects')
      .update({
        status: 'in_development',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // Configurar el agente de desarrollo
    const config: DevelopmentConfig = {
      projectId,
      userId,
      requirements: project.project_requirements || {},
      options: {
        createGitHubRepo: options?.createGitHubRepo ?? true,
        deployToVercel: options?.deployToVercel ?? true,
        generateSupabase: options?.generateSupabase ?? true,
        sendNotifications: options?.sendNotifications ?? true,
      },
    };

    // Ejecutar desarrollo en background
    // Nota: En producción, esto debería usar un job queue como Bull o similar
    developProject(config)
      .then(async (result) => {
        // Actualizar proyecto con resultados
        await supabase
          .from('projects')
          .update({
            status: result.success ? 'completed' : 'failed',
            repository_url: result.repositoryUrl,
            deployment_url: result.deploymentUrl,
            metadata: {
              ...project.metadata,
              development_result: {
                success: result.success,
                generatedFiles: result.generatedFiles,
                errors: result.errors,
                completedAt: new Date().toISOString(),
              },
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);
      })
      .catch(async (error) => {
        console.error('Development failed:', error);
        await supabase
          .from('projects')
          .update({
            status: 'failed',
            metadata: {
              ...project.metadata,
              development_error: error.message,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);
      });

    return NextResponse.json({
      success: true,
      message: 'Desarrollo iniciado',
      projectId,
    });
  } catch (error) {
    console.error('Error starting development:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Obtener estado del desarrollo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, status, repository_url, deployment_url, metadata, updated_at')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      projectId: project.id,
      status: project.status,
      repositoryUrl: project.repository_url,
      deploymentUrl: project.deployment_url,
      developmentResult: project.metadata?.development_result,
      updatedAt: project.updated_at,
    });
  } catch (error) {
    console.error('Error getting development status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
