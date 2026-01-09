import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Server-side notification sender using service role (lazy initialization)
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

export type NotificationType = 'payment' | 'project' | 'message' | 'consultation' | 'alert' | 'info';

interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
}

interface SendBulkNotificationParams {
  userIds: string[];
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
}

/**
 * Send a notification to a single user
 */
export async function sendNotification({
  userId,
  title,
  message,
  type = 'info',
  data = {},
}: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getSupabase().from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      data,
    });

    if (error) {
      logger.error('Error sending notification', error, { userId });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error('Error sending notification (catch)', err, { userId });
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkNotification({
  userIds,
  title,
  message,
  type = 'info',
  data = {},
}: SendBulkNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      type,
      data,
    }));

    const { error } = await getSupabase().from('notifications').insert(notifications);

    if (error) {
      logger.error('Error sending bulk notifications', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error('Error sending bulk notifications (catch)', err);
    return { success: false, error: 'Failed to send notifications' };
  }
}

/**
 * Send notification to all admins
 */
export async function notifyAdmins({
  title,
  message,
  type = 'info',
  data = {},
}: Omit<SendNotificationParams, 'userId'>): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all admin users
    const { data: admins, error: fetchError } = await getSupabase()
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'project_manager']);

    if (fetchError) {
      logger.error('Error fetching admins', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!admins || admins.length === 0) {
      return { success: true }; // No admins to notify
    }

    const adminIds = admins.map((a) => a.id);
    return sendBulkNotification({ userIds: adminIds, title, message, type, data });
  } catch (err) {
    logger.error('Error notifying admins', err);
    return { success: false, error: 'Failed to notify admins' };
  }
}

// Pre-built notification templates
export const NotificationTemplates = {
  // Payment notifications
  paymentReceived: (clientName: string, amount: number, projectName: string) => ({
    title: 'Pago recibido',
    message: `${clientName} ha realizado un pago de $${amount.toLocaleString()} para el proyecto "${projectName}"`,
    type: 'payment' as NotificationType,
  }),

  paymentFailed: (projectName: string) => ({
    title: 'Pago fallido',
    message: `El pago para el proyecto "${projectName}" no pudo ser procesado. Por favor, intenta de nuevo.`,
    type: 'payment' as NotificationType,
  }),

  // Project notifications
  projectStatusChanged: (projectName: string, newStatus: string) => ({
    title: 'Estado del proyecto actualizado',
    message: `El proyecto "${projectName}" ha cambiado a estado: ${newStatus}`,
    type: 'project' as NotificationType,
  }),

  projectCreated: (projectName: string, clientName: string) => ({
    title: 'Nuevo proyecto creado',
    message: `${clientName} ha creado un nuevo proyecto: "${projectName}"`,
    type: 'project' as NotificationType,
  }),

  milestoneCompleted: (projectName: string, milestoneName: string) => ({
    title: 'Hito completado',
    message: `El hito "${milestoneName}" del proyecto "${projectName}" ha sido completado`,
    type: 'project' as NotificationType,
  }),

  // Consultation notifications
  consultationScheduled: (date: string, time: string) => ({
    title: 'Consultoría agendada',
    message: `Tu consultoría ha sido agendada para el ${date} a las ${time}`,
    type: 'consultation' as NotificationType,
  }),

  consultationReminder: (date: string, time: string) => ({
    title: 'Recordatorio de consultoría',
    message: `Tienes una consultoría programada mañana ${date} a las ${time}`,
    type: 'consultation' as NotificationType,
  }),

  // Message notifications
  newMessage: (senderName: string, projectName?: string) => ({
    title: 'Nuevo mensaje',
    message: projectName
      ? `${senderName} te ha enviado un mensaje en el proyecto "${projectName}"`
      : `${senderName} te ha enviado un mensaje`,
    type: 'message' as NotificationType,
  }),

  // Quotation notifications
  quotationReady: (projectName: string) => ({
    title: 'Cotización lista',
    message: `La cotización para tu proyecto "${projectName}" está lista para revisión`,
    type: 'project' as NotificationType,
  }),

  quotationAccepted: (projectName: string, clientName: string) => ({
    title: 'Cotización aceptada',
    message: `${clientName} ha aceptado la cotización del proyecto "${projectName}"`,
    type: 'project' as NotificationType,
  }),
};
