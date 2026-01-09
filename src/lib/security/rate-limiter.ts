/**
 * Rate Limiter for API endpoints
 * Simple in-memory rate limiting with sliding window algorithm
 *
 * For production at scale, consider using Redis or Upstash
 */

import { logger } from '@/lib/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for the key
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent Node from exiting
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

// Start cleanup on first import
startCleanup();

/**
 * Check if a request should be rate limited
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Create new entry or reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  if (!allowed) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    logger.warn('Rate limit exceeded', {
      identifier: key.substring(0, 20) + '...', // Don't log full IPs
      count: entry.count,
      maxRequests: config.maxRequests,
    });
    return { allowed: false, remaining: 0, resetTime: entry.resetTime, retryAfter };
  }

  return { allowed: true, remaining, resetTime: entry.resetTime };
}

/**
 * Pre-configured rate limiters for different endpoint types
 */
export const RateLimiters = {
  // Strict: For auth endpoints (login, register)
  auth: (identifier: string) => checkRateLimit(identifier, {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,           // 10 attempts per 15 min
    keyPrefix: 'auth',
  }),

  // Payment: For checkout/payment endpoints
  payment: (identifier: string) => checkRateLimit(identifier, {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 5,            // 5 requests per minute
    keyPrefix: 'payment',
  }),

  // AI Generation: For Claude/OpenAI endpoints (expensive operations)
  aiGeneration: (identifier: string) => checkRateLimit(identifier, {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 10,           // 10 requests per minute
    keyPrefix: 'ai',
  }),

  // Standard API: For general API endpoints
  api: (identifier: string) => checkRateLimit(identifier, {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 60,           // 60 requests per minute
    keyPrefix: 'api',
  }),

  // Webhook: For incoming webhooks (more lenient)
  webhook: (identifier: string) => checkRateLimit(identifier, {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 100,          // 100 per minute (Stripe can burst)
    keyPrefix: 'webhook',
  }),
};

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(result: ReturnType<typeof checkRateLimit>) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    }
  );
}

/**
 * Extract identifier from request (IP or user ID)
 */
export function getRequestIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  const ip = cfIp || realIp || forwarded?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}

export default {
  checkRateLimit,
  RateLimiters,
  getRateLimitHeaders,
  rateLimitResponse,
  getRequestIdentifier,
};
