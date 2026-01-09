/**
 * Project Development Job Handler
 *
 * Handles async project development jobs.
 */

import { jobQueue, JobTypes, type Job } from '../job-queue';
import { developProject, type DevelopmentConfig } from '@/lib/agents/development-agent';
import { EscalationManager } from '@/lib/escalation/escalation-manager';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface ProjectDevelopmentPayload {
  projectId: string;
  userId: string;
  requirements: Record<string, unknown>;
  options: {
    createGitHubRepo: boolean;
    deployToVercel: boolean;
    generateSupabase: boolean;
    sendNotifications: boolean;
  };
}

export interface ProjectDevelopmentResult {
  success: boolean;
  repositoryUrl?: string;
  deploymentUrl?: string;
  generatedFiles: string[];
  errors: string[];
}

// ============================================
// SUPABASE
// ============================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================
// HANDLER
// ============================================

async function handleProjectDevelopment(
  job: Job<ProjectDevelopmentPayload>
): Promise<ProjectDevelopmentResult> {
  const { projectId, userId, requirements, options } = job.payload;
  const supabase = getSupabase();

  logger.debug('Starting project development job', {
    jobId: job.id,
    projectId,
    attempt: job.attempts,
  });

  // Update project status to in_development
  await supabase
    .from('projects')
    .update({
      status: 'in_development',
      metadata: {
        job_id: job.id,
        job_attempt: job.attempts,
        job_started_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  try {
    // Configure development agent
    const config: DevelopmentConfig = {
      projectId,
      userId,
      requirements: requirements as DevelopmentConfig['requirements'],
      options,
    };

    // Execute development
    const result = await developProject(config);

    // Update project with results
    await supabase
      .from('projects')
      .update({
        status: result.success ? 'completed' : 'failed',
        repository_url: result.repositoryUrl,
        deployment_url: result.deploymentUrl,
        metadata: {
          job_id: job.id,
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

    if (!result.success && result.errors.length > 0) {
      // Escalate if failed
      await EscalationManager.handleFailure(
        projectId,
        new Error(result.errors.join('; ')),
        'code_generation',
        job.attempts
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update project as failed
    await supabase
      .from('projects')
      .update({
        status: 'failed',
        metadata: {
          job_id: job.id,
          development_error: errorMessage,
          failed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    // Escalate on final attempt
    if (job.attempts >= job.max_attempts - 1) {
      await EscalationManager.handleFailure(
        projectId,
        error instanceof Error ? error : new Error(errorMessage),
        'code_generation',
        job.attempts + 1
      );
    }

    throw error; // Re-throw to trigger retry
  }
}

// ============================================
// REGISTER HANDLER
// ============================================

export function registerProjectDevelopmentHandler(): void {
  jobQueue.registerHandler<ProjectDevelopmentPayload, ProjectDevelopmentResult>(
    JobTypes.PROJECT_DEVELOPMENT,
    handleProjectDevelopment
  );

  logger.debug('Project development handler registered');
}

// ============================================
// HELPER TO CREATE JOB
// ============================================

export async function queueProjectDevelopment(
  params: ProjectDevelopmentPayload & { createdBy?: string }
): Promise<string> {
  const job = await jobQueue.createJob({
    type: JobTypes.PROJECT_DEVELOPMENT,
    payload: {
      projectId: params.projectId,
      userId: params.userId,
      requirements: params.requirements,
      options: params.options,
    },
    priority: 'high',
    maxAttempts: 3,
    createdBy: params.createdBy || params.userId,
    metadata: {
      projectId: params.projectId,
    },
  });

  logger.audit('project_development_queued', {
    jobId: job.id,
    projectId: params.projectId,
  });

  return job.id;
}
