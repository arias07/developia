import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { queueProjectDevelopment } from '@/lib/queue';
import { logger } from '@/lib/logger';

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

    // Queue the development job instead of running directly
    const jobId = await queueProjectDevelopment({
      projectId,
      userId,
      requirements: project.project_requirements || {},
      options: {
        createGitHubRepo: options?.createGitHubRepo ?? true,
        deployToVercel: options?.deployToVercel ?? true,
        generateSupabase: options?.generateSupabase ?? true,
        sendNotifications: options?.sendNotifications ?? true,
      },
      createdBy: userId,
    });

    // Update project status to queued
    await supabase
      .from('projects')
      .update({
        status: 'queued',
        metadata: {
          ...project.metadata,
          job_id: jobId,
          queued_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    logger.audit('project_development_started', { projectId, jobId });

    return NextResponse.json({
      success: true,
      message: 'Desarrollo en cola',
      projectId,
      jobId,
    });
  } catch (error) {
    logger.error('Error starting development', error, { route: 'projects/develop' });
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

    // Get job status if available
    let jobStatus = null;
    const jobId = project.metadata?.job_id;
    if (jobId) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id, status, attempts, max_attempts, error_message, started_at, completed_at')
        .eq('id', jobId)
        .single();

      if (job) {
        jobStatus = {
          id: job.id,
          status: job.status,
          attempts: job.attempts,
          maxAttempts: job.max_attempts,
          error: job.error_message,
          startedAt: job.started_at,
          completedAt: job.completed_at,
        };
      }
    }

    return NextResponse.json({
      projectId: project.id,
      status: project.status,
      repositoryUrl: project.repository_url,
      deploymentUrl: project.deployment_url,
      developmentResult: project.metadata?.development_result,
      job: jobStatus,
      updatedAt: project.updated_at,
    });
  } catch (error) {
    logger.error('Error getting development status', error, { route: 'projects/develop GET' });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
