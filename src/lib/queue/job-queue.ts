/**
 * Job Queue System
 *
 * Database-backed job queue for async task processing.
 * Compatible with serverless (Vercel) - uses Supabase for persistence.
 *
 * For production scale, migrate to Redis + BullMQ.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Job<T = Record<string, unknown>> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  error_stack?: string;
  result?: Record<string, unknown>;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateJobParams<T = Record<string, unknown>> {
  type: string;
  payload: T;
  priority?: JobPriority;
  maxAttempts?: number;
  scheduledFor?: Date;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

export interface JobHandler<T = Record<string, unknown>, R = unknown> {
  (job: Job<T>): Promise<R>;
}

// ============================================
// SUPABASE CLIENT
// ============================================

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

// ============================================
// JOB QUEUE CLASS
// ============================================

export class JobQueue {
  private handlers: Map<string, JobHandler> = new Map();
  private isProcessing = false;
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Register a job handler for a specific job type
   */
  registerHandler<T = Record<string, unknown>, R = unknown>(
    type: string,
    handler: JobHandler<T, R>
  ): void {
    this.handlers.set(type, handler as JobHandler);
    logger.debug('Job handler registered', { type });
  }

  /**
   * Create a new job
   */
  async createJob<T = Record<string, unknown>>(params: CreateJobParams<T>): Promise<Job<T>> {
    const supabase = getSupabase();

    const job = {
      type: params.type,
      payload: params.payload,
      status: 'pending' as JobStatus,
      priority: params.priority || 'normal',
      attempts: 0,
      max_attempts: params.maxAttempts || 3,
      scheduled_for: params.scheduledFor?.toISOString(),
      created_by: params.createdBy,
      metadata: params.metadata,
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create job', error, { type: params.type });
      throw new Error(`Failed to create job: ${error.message}`);
    }

    logger.audit('job_created', { jobId: data.id, type: params.type, priority: params.priority });
    return data as Job<T>;
  }

  /**
   * Get a job by ID
   */
  async getJob<T = Record<string, unknown>>(jobId: string): Promise<Job<T> | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as Job<T>;
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: JobStatus, limit = 50): Promise<Job[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data as Job[];
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .in('status', ['pending', 'processing']);

    if (error) {
      logger.error('Failed to cancel job', error, { jobId });
      return false;
    }

    logger.audit('job_cancelled', { jobId });
    return true;
  }

  /**
   * Process the next available job
   */
  async processNextJob(): Promise<Job | null> {
    if (this.isProcessing) return null;
    this.isProcessing = true;

    try {
      const supabase = getSupabase();

      // Get next pending job (priority first, then FIFO)
      // Use row-level locking to prevent race conditions
      const now = new Date().toISOString();

      const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'pending')
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (fetchError || !job) {
        return null;
      }

      // Claim the job
      const { error: claimError } = await supabase
        .from('jobs')
        .update({
          status: 'processing',
          started_at: now,
          attempts: job.attempts + 1,
          updated_at: now,
        })
        .eq('id', job.id)
        .eq('status', 'pending'); // Ensure still pending

      if (claimError) {
        // Another worker claimed it
        return null;
      }

      // Get handler
      const handler = this.handlers.get(job.type);
      if (!handler) {
        await this.failJob(job.id, `No handler registered for job type: ${job.type}`);
        return null;
      }

      // Execute handler
      try {
        logger.debug('Processing job', { jobId: job.id, type: job.type, attempt: job.attempts + 1 });

        const result = await handler(job);
        await this.completeJob(job.id, result);

        return job;
      } catch (handlerError) {
        const error = handlerError instanceof Error ? handlerError : new Error(String(handlerError));

        if (job.attempts + 1 >= job.max_attempts) {
          await this.failJob(job.id, error.message, error.stack);
        } else {
          // Retry - put back to pending with exponential backoff
          const backoffMs = Math.pow(2, job.attempts) * 1000; // 1s, 2s, 4s, 8s...
          const retryAt = new Date(Date.now() + backoffMs).toISOString();

          await supabase
            .from('jobs')
            .update({
              status: 'pending',
              scheduled_for: retryAt,
              error_message: error.message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          logger.warn('Job will retry', { jobId: job.id, attempt: job.attempts + 1, retryAt });
        }

        return null;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Mark job as completed
   */
  private async completeJob(jobId: string, result?: unknown): Promise<void> {
    const supabase = getSupabase();

    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        result: result as Record<string, unknown>,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    logger.audit('job_completed', { jobId });
  }

  /**
   * Mark job as failed
   */
  private async failJob(jobId: string, errorMessage: string, errorStack?: string): Promise<void> {
    const supabase = getSupabase();

    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        error_stack: errorStack,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    logger.error('Job failed', new Error(errorMessage), { jobId });
  }

  /**
   * Start polling for jobs (for development/testing)
   * In production, use Vercel Cron or external worker
   */
  startPolling(intervalMs = 5000): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(async () => {
      try {
        await this.processNextJob();
      } catch (error) {
        logger.error('Error in job polling', error);
      }
    }, intervalMs);

    // Cleanup on process exit
    if (this.pollInterval.unref) {
      this.pollInterval.unref();
    }

    logger.debug('Job queue polling started', { intervalMs });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.debug('Job queue polling stopped');
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('jobs')
      .select('status')
      .in('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);

    if (error) {
      throw error;
    }

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const job of data || []) {
      stats[job.status as keyof typeof stats]++;
    }

    return stats;
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanupOldJobs(olderThanDays = 7): Promise<number> {
    const supabase = getSupabase();
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('updated_at', cutoff)
      .select('id');

    if (error) {
      logger.error('Failed to cleanup old jobs', error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      logger.audit('jobs_cleaned_up', { count, olderThanDays });
    }

    return count;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const jobQueue = new JobQueue();

// ============================================
// JOB TYPES
// ============================================

export const JobTypes = {
  PROJECT_DEVELOPMENT: 'project_development',
  SEND_EMAIL: 'send_email',
  GENERATE_INVOICE: 'generate_invoice',
  CLEANUP_TEMP_FILES: 'cleanup_temp_files',
  SYNC_ANALYTICS: 'sync_analytics',
} as const;

export type JobType = typeof JobTypes[keyof typeof JobTypes];
