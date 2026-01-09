/**
 * Health Check Endpoint
 * Used for monitoring and deployment verification
 *
 * Returns status of all critical services:
 * - Database (Supabase)
 * - Stripe
 * - AI Services (Claude/OpenAI)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    stripe: ServiceHealth;
    environment: ServiceHealth;
  };
}

// Track when the server started
const startTime = Date.now();

/**
 * Check Supabase connection
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Simple query to check connection
    const { error } = await supabase.from('profiles').select('id').limit(1);

    const latencyMs = Date.now() - start;

    if (error) {
      return {
        status: 'degraded',
        latencyMs,
        message: 'Query failed but connection exists',
      };
    }

    return {
      status: 'healthy',
      latencyMs,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Check Stripe configuration
 */
function checkStripe(): ServiceHealth {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  if (hasSecretKey && hasPublishableKey && hasWebhookSecret) {
    return { status: 'healthy' };
  }

  if (hasSecretKey || hasPublishableKey) {
    return {
      status: 'degraded',
      message: 'Some Stripe keys are missing',
    };
  }

  return {
    status: 'unhealthy',
    message: 'Stripe is not configured',
  };
}

/**
 * Check required environment variables
 */
function checkEnvironment(): ServiceHealth {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ];

  const optional = [
    'OPENAI_API_KEY',
    'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TELEGRAM_BOT_TOKEN',
  ];

  const missingRequired = required.filter((key) => !process.env[key]);
  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missingRequired.length > 0) {
    return {
      status: 'unhealthy',
      message: `Missing required: ${missingRequired.join(', ')}`,
    };
  }

  if (missingOptional.length > 0) {
    return {
      status: 'degraded',
      message: `Missing optional: ${missingOptional.join(', ')}`,
    };
  }

  return { status: 'healthy' };
}

/**
 * Calculate overall status from service statuses
 */
function calculateOverallStatus(
  services: HealthResponse['services']
): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map((s) => s.status);

  if (statuses.some((s) => s === 'unhealthy')) {
    return 'unhealthy';
  }

  if (statuses.some((s) => s === 'degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

export async function GET() {
  try {
    // Run health checks in parallel
    const [database] = await Promise.all([checkDatabase()]);

    const services = {
      database,
      stripe: checkStripe(),
      environment: checkEnvironment(),
    };

    const status = calculateOverallStatus(services);
    const uptimeMs = Date.now() - startTime;

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: Math.floor(uptimeMs / 1000), // seconds
      services,
    };

    // Log health check if unhealthy
    if (status === 'unhealthy') {
      logger.error('Health check failed', null, { services });
    }

    return NextResponse.json(response, {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    logger.error('Health check error', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Health check failed unexpectedly',
      },
      { status: 503 }
    );
  }
}

// HEAD request for simple uptime monitoring
export async function HEAD() {
  return new Response(null, { status: 200 });
}
