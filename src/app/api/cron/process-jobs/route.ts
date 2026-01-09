/**
 * Cron Job: Process Job Queue
 *
 * This endpoint is called by Vercel Cron to process pending jobs.
 * Configure in vercel.json:
 *
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/process-jobs",
 *       "schedule": "* * * * *"
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobQueue, initializeJobHandlers } from '@/lib/queue';
import { logger } from '@/lib/logger';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  // In development, allow without secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Vercel sends the CRON_SECRET in Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron call
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Initialize handlers
    initializeJobHandlers();

    // Process jobs (up to 5 per invocation to stay within timeout)
    const maxJobs = parseInt(process.env.CRON_MAX_JOBS || '5', 10);
    const processed: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < maxJobs; i++) {
      try {
        const job = await jobQueue.processNextJob();
        if (!job) {
          // No more jobs to process
          break;
        }
        processed.push(job.id);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMsg);
        logger.error('Error processing job in cron', error);
      }
    }

    // Get queue stats
    const stats = await jobQueue.getStats();

    logger.audit('cron_jobs_processed', {
      processedCount: processed.length,
      errorCount: errors.length,
      stats,
    });

    return NextResponse.json({
      success: true,
      processed: processed.length,
      errors: errors.length > 0 ? errors : undefined,
      stats,
    });
  } catch (error) {
    logger.error('Cron job processing failed', error);
    return NextResponse.json(
      { error: 'Failed to process jobs' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  // For POST, require authentication (admin only)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow with dev key
  if (process.env.NODE_ENV === 'development') {
    const devKey = request.headers.get('x-dev-key');
    if (devKey === process.env.DEV_TEST_KEY) {
      return GET(request);
    }
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return GET(request);
}
