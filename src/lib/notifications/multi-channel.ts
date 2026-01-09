// Multi-channel Notification System
// Sends notifications via App (Supabase), Email (Resend), and WhatsApp (Twilio)

import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppAlert, WhatsAppTemplates } from './whatsapp';
import { sendEscalationEmail, sendEmail as sendEmailMessage, EmailTemplates } from '../emails/resend';
import type { Escalation, EscalationSeverity } from '@/types/database';

// Supabase client for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface MultiChannelNotification {
  // Required
  title: string;
  message: string;

  // Targets
  userId?: string;
  adminOnly?: boolean;

  // Channels
  sendApp?: boolean;
  sendEmail?: boolean;
  sendWhatsApp?: boolean;

  // App notification options
  type?: 'payment' | 'project' | 'message' | 'consultation' | 'alert' | 'info';
  data?: Record<string, unknown>;

  // Email options
  emailSubject?: string;
  emailHtml?: string;

  // WhatsApp options
  whatsAppBody?: string;
}

/**
 * Send notification to app (Supabase notifications table)
 */
async function sendAppNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'info',
  data?: Record<string, unknown>
): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    data,
    read: false,
  });

  if (error) {
    console.error('[App] Error sending notification:', error);
    return false;
  }

  return true;
}

/**
 * Get all admin user IDs
 */
async function getAdminUserIds(): Promise<string[]> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'project_manager']);

  return (data || []).map((u) => u.id);
}

/**
 * Get admin email addresses
 */
async function getAdminEmails(): Promise<string[]> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('profiles')
    .select('email')
    .in('role', ['admin', 'project_manager']);

  return (data || []).map((u) => u.email);
}

/**
 * Send multi-channel notification
 */
export async function sendMultiChannelNotification(
  notification: MultiChannelNotification
): Promise<{
  app: boolean;
  email: boolean;
  whatsApp: boolean;
}> {
  const results = {
    app: false,
    email: false,
    whatsApp: false,
  };

  const {
    title,
    message,
    userId,
    adminOnly = false,
    sendApp = true,
    sendEmail = false,
    sendWhatsApp = false,
    type = 'info',
    data,
    emailSubject,
    emailHtml,
    whatsAppBody,
  } = notification;

  // Determine target users
  let targetUserIds: string[] = [];

  if (adminOnly) {
    targetUserIds = await getAdminUserIds();
  } else if (userId) {
    targetUserIds = [userId];
  }

  // Send App notifications
  if (sendApp && targetUserIds.length > 0) {
    const appResults = await Promise.all(
      targetUserIds.map((uid) =>
        sendAppNotification(uid, title, message, type, data)
      )
    );
    results.app = appResults.every(Boolean);
  }

  // Send Email notifications
  if (sendEmail) {
    try {
      if (adminOnly) {
        const emails = await getAdminEmails();
        for (const email of emails) {
          await sendEmailMessage({
            to: email,
            subject: emailSubject || title,
            html: emailHtml || `<p>${message}</p>`,
          });
        }
        results.email = true;
      } else if (userId) {
        const supabase = getSupabase();
        const { data: user } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        if (user?.email) {
          await sendEmailMessage({
            to: user.email,
            subject: emailSubject || title,
            html: emailHtml || `<p>${message}</p>`,
          });
          results.email = true;
        }
      }
    } catch (error) {
      console.error('[Email] Error:', error);
    }
  }

  // Send WhatsApp notifications (admin only for critical alerts)
  if (sendWhatsApp) {
    results.whatsApp = await sendWhatsAppAlert(whatsAppBody || `${title}\n\n${message}`);
  }

  return results;
}

// ============================================
// Escalation-specific notifications
// ============================================

export interface EscalationNotificationParams {
  escalation: Escalation;
  projectName: string;
  clientEmail: string;
}

/**
 * Notify all channels about an escalation
 * Severity determines which channels are used:
 * - Critical: App + Email + WhatsApp
 * - High: App + Email + WhatsApp
 * - Medium: App + Email
 * - Low: App only
 */
export async function notifyEscalation(
  params: EscalationNotificationParams
): Promise<{
  app: boolean;
  email: boolean;
  whatsApp: boolean;
}> {
  const { escalation, projectName, clientEmail } = params;

  const channelsBySeverity: Record<EscalationSeverity, {
    app: boolean;
    email: boolean;
    whatsApp: boolean;
  }> = {
    critical: { app: true, email: true, whatsApp: true },
    high: { app: true, email: true, whatsApp: true },
    medium: { app: true, email: true, whatsApp: false },
    low: { app: true, email: false, whatsApp: false },
  };

  const channels = channelsBySeverity[escalation.severity];

  const severityEmoji: Record<EscalationSeverity, string> = {
    critical: '🚨',
    high: '⚠️',
    medium: '📋',
    low: 'ℹ️',
  };

  const title = `${severityEmoji[escalation.severity]} Escalación ${escalation.severity.toUpperCase()}: ${projectName}`;
  const message = `El proyecto "${projectName}" requiere intervención humana.\n\nTipo: ${escalation.type}\nFase: ${escalation.failed_phase || 'N/A'}\nError: ${escalation.error_message || 'Sin detalles'}`;

  // Prepare email HTML
  const emailHtml = EmailTemplates.escalationAlert({
    projectName,
    severity: escalation.severity,
    type: escalation.type,
    phase: escalation.failed_phase || 'N/A',
    errorMessage: escalation.error_message || 'Sin detalles',
    escalationId: escalation.id,
    clientEmail,
  });

  // Prepare WhatsApp message
  let whatsAppBody = '';
  if (escalation.severity === 'critical') {
    whatsAppBody = WhatsAppTemplates.criticalEscalation(
      projectName,
      escalation.error_message || 'Error desconocido',
      escalation.id
    ).body;
  } else {
    whatsAppBody = WhatsAppTemplates.highEscalation(
      projectName,
      escalation.failed_phase || 'Desarrollo',
      escalation.id
    ).body;
  }

  const result = await sendMultiChannelNotification({
    title,
    message,
    adminOnly: true,
    sendApp: channels.app,
    sendEmail: channels.email,
    sendWhatsApp: channels.whatsApp,
    type: 'alert',
    data: {
      escalationId: escalation.id,
      projectId: escalation.project_id,
      severity: escalation.severity,
    },
    emailSubject: `[${escalation.severity.toUpperCase()}] Escalación - ${projectName}`,
    emailHtml,
    whatsAppBody,
  });

  // Update escalation record with notification status
  const supabase = getSupabase();
  await supabase
    .from('escalations')
    .update({
      app_notified: result.app,
      email_sent: result.email,
      whatsapp_sent: result.whatsApp,
    })
    .eq('id', escalation.id);

  return result;
}

// ============================================
// Team Assignment Notification
// ============================================

export async function notifyTeamAssignment(
  clientId: string,
  projectId: string,
  projectName: string,
  teamSize: number
): Promise<boolean> {
  const result = await sendMultiChannelNotification({
    userId: clientId,
    title: '👥 Equipo asignado a tu proyecto',
    message: `¡Excelentes noticias! Un equipo de ${teamSize} profesionales ha sido asignado a "${projectName}". Puedes ver los detalles de tu equipo en el dashboard.`,
    sendApp: true,
    sendEmail: true,
    sendWhatsApp: false,
    type: 'project',
    data: { projectId, teamSize },
    emailSubject: `Equipo asignado - ${projectName}`,
    emailHtml: `
      <h2>¡Tu equipo está listo!</h2>
      <p>Un equipo de <strong>${teamSize} profesionales</strong> ha sido asignado a tu proyecto "${projectName}".</p>
      <p>El equipo incluye:</p>
      <ul>
        <li>1 Project Manager dedicado</li>
        <li>1 Senior Developer</li>
        <li>4 Developers</li>
      </ul>
      <p>Accede a tu dashboard para ver los detalles del equipo.</p>
    `,
  });

  return result.app && result.email;
}
