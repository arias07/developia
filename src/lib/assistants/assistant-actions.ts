// Assistant Actions
// Executable actions that the project assistant can perform

import { createClient } from '@supabase/supabase-js';
import type { AssistantActionType } from '@/types/database';

// Supabase client for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface ActionContext {
  projectId: string;
  userId: string;
  vercelProjectId?: string;
  supabaseProjectRef?: string;
}

/**
 * Reset password for a user
 * Sends a password reset email via Supabase Auth
 */
async function resetPassword(
  context: ActionContext,
  params: { email?: string; userId?: string }
): Promise<ActionResult> {
  const supabase = getSupabase();

  try {
    // If email is provided, use it directly
    let email = params.email;

    // If userId is provided, get the email
    if (!email && params.userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', params.userId)
        .single();

      email = profile?.email;
    }

    // If neither, use the requesting user's email
    if (!email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', context.userId)
        .single();

      email = profile?.email;
    }

    if (!email) {
      return {
        success: false,
        message: 'No se pudo determinar el email para resetear la contraseña.',
      };
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        message: `Error al enviar el email: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `Se ha enviado un email de recuperación a ${email}. Revisa tu bandeja de entrada.`,
      data: { email },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Clear cache for the project
 * Purges Vercel edge cache
 */
async function clearCache(context: ActionContext): Promise<ActionResult> {
  const { vercelProjectId } = context;

  if (!vercelProjectId) {
    return {
      success: false,
      message: 'No hay información de Vercel configurada para este proyecto.',
    };
  }

  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return {
      success: false,
      message: 'El servicio de caché no está configurado.',
    };
  }

  try {
    // Purge all cache for the project
    const response = await fetch(
      `https://api.vercel.com/v1/projects/${vercelProjectId}/purge-cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: '/*' }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Error al limpiar caché: ${error}`,
      };
    }

    return {
      success: true,
      message: 'La caché ha sido limpiada exitosamente. Los cambios deberían verse reflejados en unos minutos.',
      data: { purgedAt: new Date().toISOString() },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al conectar con Vercel: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Restart service (trigger new deployment)
 */
async function restartService(context: ActionContext): Promise<ActionResult> {
  const { vercelProjectId } = context;

  if (!vercelProjectId) {
    return {
      success: false,
      message: 'No hay información de Vercel configurada para este proyecto.',
    };
  }

  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return {
      success: false,
      message: 'El servicio de deployment no está configurado.',
    };
  }

  try {
    // Get the latest deployment
    const deploymentsResponse = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      }
    );

    if (!deploymentsResponse.ok) {
      return {
        success: false,
        message: 'No se pudo obtener información del deployment actual.',
      };
    }

    const { deployments } = await deploymentsResponse.json();

    if (!deployments || deployments.length === 0) {
      return {
        success: false,
        message: 'No hay deployments anteriores para reiniciar.',
      };
    }

    // Trigger a redeploy
    const redeployResponse = await fetch(
      `https://api.vercel.com/v13/deployments/${deployments[0].uid}/redeploy`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!redeployResponse.ok) {
      const error = await redeployResponse.text();
      return {
        success: false,
        message: `Error al reiniciar: ${error}`,
      };
    }

    const redeploy = await redeployResponse.json();

    return {
      success: true,
      message: 'El servicio se está reiniciando. Puede tomar 1-3 minutos en estar listo.',
      data: {
        deploymentId: redeploy.id,
        url: redeploy.url,
        startedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al reiniciar: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * View recent logs
 */
async function viewLogs(
  context: ActionContext,
  params: { lines?: number }
): Promise<ActionResult> {
  const { vercelProjectId } = context;
  const lines = params.lines || 50;

  if (!vercelProjectId) {
    return {
      success: false,
      message: 'No hay información de Vercel configurada para este proyecto.',
    };
  }

  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return {
      success: false,
      message: 'El servicio de logs no está configurado.',
    };
  }

  try {
    // Get recent logs (last 5 minutes)
    const since = Date.now() - 5 * 60 * 1000;

    const response = await fetch(
      `https://api.vercel.com/v2/deployments/logs?projectId=${vercelProjectId}&since=${since}&limit=${lines}`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: 'No se pudieron obtener los logs.',
      };
    }

    const data = await response.json();
    const logs = data.logs || [];

    if (logs.length === 0) {
      return {
        success: true,
        message: 'No hay logs recientes (últimos 5 minutos). Esto es buena señal - no hay errores.',
        data: { logs: [] },
      };
    }

    // Format logs
    const formattedLogs = logs.slice(0, lines).map((log: { timestamp: number; level: string; message: string }) => ({
      time: new Date(log.timestamp).toISOString(),
      level: log.level,
      message: log.message,
    }));

    return {
      success: true,
      message: `Mostrando últimos ${formattedLogs.length} logs:`,
      data: { logs: formattedLogs },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al obtener logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Health check - verify system status
 */
async function healthCheck(context: ActionContext): Promise<ActionResult> {
  const supabase = getSupabase();
  const checks: Array<{ name: string; status: 'ok' | 'error'; message: string }> = [];

  // Check 1: Database connection
  try {
    const { error } = await supabase.from('projects').select('id').eq('id', context.projectId).single();
    checks.push({
      name: 'Base de datos',
      status: error ? 'error' : 'ok',
      message: error ? `Error: ${error.message}` : 'Conectada correctamente',
    });
  } catch {
    checks.push({
      name: 'Base de datos',
      status: 'error',
      message: 'No se pudo conectar',
    });
  }

  // Check 2: Get deployment URL and ping it
  const { data: project } = await supabase
    .from('projects')
    .select('deployment_url')
    .eq('id', context.projectId)
    .single();

  if (project?.deployment_url) {
    try {
      const response = await fetch(project.deployment_url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      checks.push({
        name: 'Sitio web',
        status: response.ok ? 'ok' : 'error',
        message: response.ok
          ? `Respondiendo correctamente (${response.status})`
          : `Error HTTP ${response.status}`,
      });
    } catch {
      checks.push({
        name: 'Sitio web',
        status: 'error',
        message: 'No responde o timeout',
      });
    }
  }

  // Check 3: Vercel deployment status
  if (context.vercelProjectId) {
    const vercelToken = process.env.VERCEL_TOKEN;
    if (vercelToken) {
      try {
        const response = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${context.vercelProjectId}&limit=1`,
          {
            headers: { Authorization: `Bearer ${vercelToken}` },
          }
        );

        if (response.ok) {
          const { deployments } = await response.json();
          const latest = deployments?.[0];

          checks.push({
            name: 'Deployment',
            status: latest?.state === 'READY' ? 'ok' : 'error',
            message: latest
              ? `Estado: ${latest.state}`
              : 'Sin deployments',
          });
        }
      } catch {
        checks.push({
          name: 'Deployment',
          status: 'error',
          message: 'No se pudo verificar',
        });
      }
    }
  }

  const allOk = checks.every((c) => c.status === 'ok');

  return {
    success: allOk,
    message: allOk
      ? 'Todos los sistemas están funcionando correctamente.'
      : 'Algunos sistemas reportan problemas.',
    data: {
      checks,
      checkedAt: new Date().toISOString(),
    },
  };
}

/**
 * Action registry - maps action types to their handlers
 */
export const ASSISTANT_ACTIONS: Record<
  AssistantActionType,
  (context: ActionContext, params?: Record<string, unknown>) => Promise<ActionResult>
> = {
  reset_password: (ctx, params) => resetPassword(ctx, params || {}),
  clear_cache: (ctx) => clearCache(ctx),
  restart_service: (ctx) => restartService(ctx),
  view_logs: (ctx, params) => viewLogs(ctx, { lines: (params?.lines as number) || 50 }),
  health_check: (ctx) => healthCheck(ctx),
};

/**
 * Execute an assistant action
 */
export async function executeAction(
  actionType: AssistantActionType,
  context: ActionContext,
  params?: Record<string, unknown>
): Promise<ActionResult> {
  const handler = ASSISTANT_ACTIONS[actionType];

  if (!handler) {
    return {
      success: false,
      message: `Acción desconocida: ${actionType}`,
    };
  }

  // Log the action
  const supabase = getSupabase();
  const startTime = Date.now();

  try {
    const result = await handler(context, params);

    // Log to action_logs
    await supabase.from('assistant_action_logs').insert({
      assistant_id: context.projectId, // Will be updated to actual assistant_id
      user_id: context.userId,
      action_type: actionType,
      action_params: params,
      success: result.success,
      result_data: result.data,
      error_message: result.success ? null : result.message,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log the failure
    await supabase.from('assistant_action_logs').insert({
      assistant_id: context.projectId,
      user_id: context.userId,
      action_type: actionType,
      action_params: params,
      success: false,
      error_message: errorMessage,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    });

    return {
      success: false,
      message: `Error ejecutando acción: ${errorMessage}`,
    };
  }
}

/**
 * Parse action from assistant response
 * Returns action type and params if found in the response
 */
export function parseActionFromResponse(
  response: string
): { action: AssistantActionType; params?: Record<string, unknown> } | null {
  // Look for [ACTION: xxx] pattern
  const actionMatch = response.match(/\[ACTION:\s*(\w+)\]/i);

  if (!actionMatch) {
    return null;
  }

  const actionType = actionMatch[1].toLowerCase() as AssistantActionType;

  // Validate action type
  if (!ASSISTANT_ACTIONS[actionType]) {
    return null;
  }

  // Look for [PARAMS: xxx] pattern
  const paramsMatch = response.match(/\[PARAMS:\s*([^\]]+)\]/i);
  let params: Record<string, unknown> | undefined;

  if (paramsMatch) {
    try {
      // Try to parse as JSON
      params = JSON.parse(paramsMatch[1]);
    } catch {
      // If not JSON, treat as simple string param
      params = { value: paramsMatch[1].trim() };
    }
  }

  return { action: actionType, params };
}
