/**
 * Centralized logger for the application
 * - In development: full logging
 * - In production: only errors without sensitive data
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === 'development';

// Sensitive keys that should never be logged
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
  'api_key',
  'apikey',
  'private',
];

function sanitizeValue(key: string, value: unknown): unknown {
  const lowerKey = key.toLowerCase();

  // Check if key contains sensitive words
  if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
    return '[REDACTED]';
  }

  // Recursively sanitize objects
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return sanitizeContext(value as LogContext);
  }

  // Sanitize arrays
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeValue(String(index), item));
  }

  return value;
}

function sanitizeContext(context: LogContext): LogContext {
  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = sanitizeValue(key, value);
  }

  return sanitized;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? sanitizeContext(context) : undefined;

  if (isDev) {
    // Pretty format for development
    const contextStr = sanitizedContext ? ` ${JSON.stringify(sanitizedContext, null, 2)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  // JSON format for production (better for log aggregation)
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...(sanitizedContext || {}),
  });
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      console.log(formatMessage('debug', message, context));
    }
    // In production, debug logs are silenced
  },

  info(message: string, context?: LogContext): void {
    if (isDev) {
      console.log(formatMessage('info', message, context));
    }
    // In production, info logs are silenced unless needed for audit
  },

  warn(message: string, context?: LogContext): void {
    if (isDev) {
      console.warn(formatMessage('warn', message, context));
    }
    // In production, warnings are silenced
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      // Only include stack trace in development
      if (isDev) {
        errorContext.stack = error.stack;
      }
    } else if (error) {
      errorContext.error = String(error);
    }

    // Errors are always logged
    console.error(formatMessage('error', message, errorContext));
  },

  // For audit trail - always logs in both environments
  audit(action: string, context: LogContext): void {
    const auditContext = {
      ...sanitizeContext(context),
      audit: true,
    };
    console.log(formatMessage('info', `[AUDIT] ${action}`, auditContext));
  },
};

export default logger;
