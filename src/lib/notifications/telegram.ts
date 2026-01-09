// Telegram Bot Integration
// For sending instant notifications (escalations, alerts, updates)
// Setup: Create a bot with @BotFather and get the token

import { logger } from '@/lib/logger';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

const TELEGRAM_API_URL = 'https://api.telegram.org';

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
}

/**
 * Send a Telegram message
 */
export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  if (!botToken) {
    logger.warn('Telegram bot token not configured', { service: 'telegram' });
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: message.chatId,
        text: message.text,
        parse_mode: message.parseMode || 'HTML',
        disable_web_page_preview: message.disableWebPagePreview ?? true,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      logger.error('Telegram API error', new Error(JSON.stringify(data)), { service: 'telegram' });
      return false;
    }

    logger.debug('Telegram message sent', { messageId: data.result?.message_id });
    return true;
  } catch (error) {
    logger.error('Error sending Telegram message', error, { service: 'telegram' });
    return false;
  }
}

/**
 * Send Telegram alert to admin
 */
export async function sendTelegramAlert(text: string): Promise<boolean> {
  if (!adminChatId) {
    logger.warn('Telegram admin chat ID not configured', { service: 'telegram' });
    return false;
  }

  return sendTelegramMessage({
    chatId: adminChatId,
    text,
  });
}

// ============================================
// Pre-built Alert Templates (HTML format)
// ============================================

export const TelegramTemplates = {
  /**
   * Critical escalation alert
   */
  criticalEscalation: (projectName: string, errorMessage: string, escalationId: string) => ({
    text: `🚨 <b>ESCALACIÓN CRÍTICA</b>

📦 Proyecto: <b>${escapeHtml(projectName)}</b>
❌ Error: ${escapeHtml(errorMessage)}
🆔 ID: <code>${escalationId}</code>

⚠️ Se requiere intervención humana inmediata.`,
  }),

  /**
   * High severity escalation
   */
  highEscalation: (projectName: string, phase: string, escalationId: string) => ({
    text: `⚠️ <b>Escalación Alta</b>

📦 Proyecto: <b>${escapeHtml(projectName)}</b>
🔧 Fase fallida: ${escapeHtml(phase)}
🆔 ID: <code>${escalationId}</code>

El desarrollo autónomo encontró un problema.`,
  }),

  /**
   * Payment received
   */
  paymentReceived: (projectName: string, amount: string, clientName: string) => ({
    text: `💰 <b>Nuevo Pago Recibido</b>

📦 Proyecto: <b>${escapeHtml(projectName)}</b>
👤 Cliente: ${escapeHtml(clientName)}
💵 Monto: <b>${escapeHtml(amount)}</b>

El desarrollo autónomo comenzará automáticamente.`,
  }),

  /**
   * Project completed
   */
  projectCompleted: (projectName: string, deploymentUrl: string) => ({
    text: `✅ <b>Proyecto Completado</b>

📦 ${escapeHtml(projectName)}
🌐 URL: ${escapeHtml(deploymentUrl)}

El proyecto ha sido desplegado exitosamente.`,
  }),

  /**
   * Development failed
   */
  developmentFailed: (projectName: string, clientEmail: string) => ({
    text: `❌ <b>Desarrollo Fallido</b>

📦 Proyecto: <b>${escapeHtml(projectName)}</b>
📧 Cliente: ${escapeHtml(clientEmail)}

Se ha creado una escalación automáticamente.`,
  }),

  /**
   * Test message
   */
  test: () => ({
    text: `🧪 <b>TEST</b> - Mensaje de prueba desde Developia

Si recibes esto, la integración con Telegram funciona correctamente.`,
  }),
};

/**
 * Escape HTML special characters for Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Send a templated Telegram alert
 */
export async function sendTemplatedTelegramAlert(
  template: keyof typeof TelegramTemplates,
  ...args: Parameters<(typeof TelegramTemplates)[typeof template]>
): Promise<boolean> {
  // @ts-expect-error - Dynamic template access
  const message = TelegramTemplates[template](...args);
  return sendTelegramAlert(message.text);
}
