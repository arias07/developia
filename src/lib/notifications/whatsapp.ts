// WhatsApp Integration using Twilio
// For sending urgent notifications (escalations, critical errors)

import Twilio from 'twilio';
import { logger } from '@/lib/logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// Support both formats: "whatsapp:+1234567890" or just "+1234567890"
const rawWhatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const whatsappFrom = rawWhatsappFrom.startsWith('whatsapp:') ? rawWhatsappFrom : `whatsapp:${rawWhatsappFrom}`;
const rawAdminWhatsapp = process.env.ADMIN_WHATSAPP_NUMBER;
const adminWhatsapp = rawAdminWhatsapp?.startsWith('whatsapp:')
  ? rawAdminWhatsapp
  : rawAdminWhatsapp
    ? `whatsapp:${rawAdminWhatsapp}`
    : undefined;

// Initialize Twilio client only if credentials are available
function getTwilioClient() {
  if (!accountSid || !authToken) {
    logger.warn('Twilio credentials not configured', { service: 'whatsapp' });
    return null;
  }
  return Twilio(accountSid, authToken);
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<boolean> {
  const client = getTwilioClient();

  if (!client) {
    return false;
  }

  try {
    // Format the 'to' number if it doesn't have the whatsapp: prefix
    const toNumber = message.to.startsWith('whatsapp:') ? message.to : `whatsapp:${message.to}`;

    const result = await client.messages.create({
      body: message.body,
      from: whatsappFrom,
      to: toNumber,
      ...(message.mediaUrl && { mediaUrl: [message.mediaUrl] }),
    });

    logger.debug('WhatsApp message sent', { sid: result.sid });
    return true;
  } catch (error) {
    logger.error('Error sending WhatsApp message', error, { service: 'whatsapp' });
    return false;
  }
}

/**
 * Send WhatsApp alert to admin
 */
export async function sendWhatsAppAlert(body: string): Promise<boolean> {
  if (!adminWhatsapp) {
    logger.warn('WhatsApp admin number not configured', { service: 'whatsapp' });
    return false;
  }

  return sendWhatsAppMessage({
    to: adminWhatsapp,
    body,
  });
}

// ============================================
// Pre-built Alert Templates
// ============================================

export const WhatsAppTemplates = {
  /**
   * Critical escalation alert
   */
  criticalEscalation: (projectName: string, errorMessage: string, escalationId: string) => ({
    body: `🚨 *ESCALACIÓN CRÍTICA*

📦 Proyecto: ${projectName}
❌ Error: ${errorMessage}
🆔 ID: ${escalationId}

⚠️ Se requiere intervención humana inmediata.

Accede al panel de admin para más detalles.`,
  }),

  /**
   * High severity escalation
   */
  highEscalation: (projectName: string, phase: string, escalationId: string) => ({
    body: `⚠️ *Escalación Alta*

📦 Proyecto: ${projectName}
🔧 Fase fallida: ${phase}
🆔 ID: ${escalationId}

El desarrollo autónomo encontró un problema.
Revisa el panel de admin.`,
  }),

  /**
   * Payment received
   */
  paymentReceived: (projectName: string, amount: string, clientName: string) => ({
    body: `💰 *Nuevo Pago Recibido*

📦 Proyecto: ${projectName}
👤 Cliente: ${clientName}
💵 Monto: ${amount}

El desarrollo autónomo comenzará automáticamente.`,
  }),

  /**
   * Project completed
   */
  projectCompleted: (projectName: string, deploymentUrl: string) => ({
    body: `✅ *Proyecto Completado*

📦 ${projectName}
🌐 URL: ${deploymentUrl}

El proyecto ha sido desplegado exitosamente.`,
  }),

  /**
   * Development failed
   */
  developmentFailed: (projectName: string, clientEmail: string) => ({
    body: `❌ *Desarrollo Fallido*

📦 Proyecto: ${projectName}
📧 Cliente: ${clientEmail}

Se ha creado una escalación automáticamente.
Revisa el panel de admin.`,
  }),
};

/**
 * Send a templated WhatsApp alert
 */
export async function sendTemplatedAlert(
  template: keyof typeof WhatsAppTemplates,
  ...args: Parameters<(typeof WhatsAppTemplates)[typeof template]>
): Promise<boolean> {
  // @ts-expect-error - Dynamic template access
  const message = WhatsAppTemplates[template](...args);
  return sendWhatsAppAlert(message.body);
}
