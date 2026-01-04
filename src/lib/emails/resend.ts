// ============================================
// EMAIL SERVICE CON RESEND
// ============================================

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface ResendResponse {
  id: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@devvy.tech';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Devvy';
  }

  async send(options: EmailOptions): Promise<ResendResponse | null> {
    if (!this.apiKey) {
      console.warn('RESEND_API_KEY not configured, email not sent');
      return null;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Error sending email:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      return null;
    }
  }
}

export const emailService = new EmailService();

// ============================================
// TEMPLATES DE EMAIL
// ============================================

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devvy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #a855f7; font-size: 28px; margin: 0;">
        Devvy
      </h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">
        Tu idea, nuestro código
      </p>
    </div>

    <!-- Content -->
    <div style="background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; color: #64748b; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Devvy. Todos los derechos reservados.</p>
      <p style="margin-top: 8px;">
        <a href="\${process.env.NEXT_PUBLIC_APP_URL}/legal/privacy" style="color: #a855f7; text-decoration: none;">
          Política de Privacidad
        </a>
        &nbsp;|&nbsp;
        <a href="\${process.env.NEXT_PUBLIC_APP_URL}/legal/terms" style="color: #a855f7; text-decoration: none;">
          Términos y Condiciones
        </a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// EMAILS TRANSACCIONALES
// ============================================

export async function sendWelcomeEmail(email: string, name: string) {
  const content = `
    <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
      ¡Bienvenido a Devvy, ${name}! 🚀
    </h2>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Gracias por registrarte. Estás a un paso de crear proyectos increíbles con la ayuda de
      inteligencia artificial.
    </p>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Para comenzar, inicia un nuevo proyecto y cuéntanos qué quieres construir.
      Nuestro sistema de IA te guiará en cada paso.
    </p>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/funnel"
         style="display: inline-block; background-color: #a855f7; color: white;
                padding: 14px 32px; border-radius: 8px; text-decoration: none;
                font-weight: 600; font-size: 16px;">
        Iniciar Proyecto
      </a>
    </div>
  `;

  return emailService.send({
    to: email,
    subject: '¡Bienvenido a Devvy! 🚀',
    html: baseTemplate(content),
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  projectName: string,
  amount: number,
  currency: string
) {
  const formattedAmount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
  }).format(amount);

  const content = `
    <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
      ¡Pago Confirmado! ✅
    </h2>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Hola ${name}, hemos recibido tu pago exitosamente.
    </p>

    <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #94a3b8; padding: 8px 0;">Proyecto:</td>
          <td style="color: #ffffff; text-align: right; padding: 8px 0; font-weight: 600;">
            ${projectName}
          </td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 8px 0;">Monto:</td>
          <td style="color: #22c55e; text-align: right; padding: 8px 0; font-weight: 600; font-size: 18px;">
            ${formattedAmount}
          </td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 8px 0;">Fecha:</td>
          <td style="color: #ffffff; text-align: right; padding: 8px 0;">
            ${new Date().toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Nuestro equipo comenzará a trabajar en tu proyecto inmediatamente.
      Recibirás notificaciones sobre el progreso.
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="display: inline-block; background-color: #a855f7; color: white;
                padding: 14px 32px; border-radius: 8px; text-decoration: none;
                font-weight: 600; font-size: 16px;">
        Ver Mi Proyecto
      </a>
    </div>
  `;

  return emailService.send({
    to: email,
    subject: `✅ Pago confirmado para ${projectName}`,
    html: baseTemplate(content),
  });
}

export async function sendProjectCompletedEmail(
  email: string,
  name: string,
  projectName: string,
  deploymentUrl?: string,
  repositoryUrl?: string
) {
  const content = `
    <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
      ¡Tu Proyecto está Listo! 🎉
    </h2>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Hola ${name}, tenemos excelentes noticias. Tu proyecto <strong>${projectName}</strong>
      ha sido completado exitosamente.
    </p>

    ${deploymentUrl ? `
    <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">🌐 Tu sitio está en línea:</p>
      <a href="${deploymentUrl}" style="color: #22c55e; font-size: 16px; word-break: break-all;">
        ${deploymentUrl}
      </a>
    </div>
    ` : ''}

    ${repositoryUrl ? `
    <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">📁 Repositorio de código:</p>
      <a href="${repositoryUrl}" style="color: #a855f7; font-size: 16px; word-break: break-all;">
        ${repositoryUrl}
      </a>
    </div>
    ` : ''}

    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Recuerda que tienes 30 días de garantía para corrección de bugs sin costo adicional.
      Si necesitas algo más, estamos aquí para ayudarte.
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="display: inline-block; background-color: #a855f7; color: white;
                padding: 14px 32px; border-radius: 8px; text-decoration: none;
                font-weight: 600; font-size: 16px;">
        Ver Detalles del Proyecto
      </a>
    </div>
  `;

  return emailService.send({
    to: email,
    subject: `🎉 ¡${projectName} está listo!`,
    html: baseTemplate(content),
  });
}

export async function sendTicketReplyEmail(
  email: string,
  name: string,
  ticketTitle: string,
  replyMessage: string,
  ticketId: string
) {
  const content = `
    <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
      Nueva Respuesta en tu Ticket
    </h2>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
      Hola ${name}, hemos respondido a tu ticket:
    </p>

    <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #a855f7;">
      <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">
        <strong>Ticket:</strong> ${ticketTitle}
      </p>
      <p style="color: #ffffff; margin: 0; font-size: 16px; line-height: 1.6;">
        ${replyMessage}
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ticket=${ticketId}"
         style="display: inline-block; background-color: #a855f7; color: white;
                padding: 14px 32px; border-radius: 8px; text-decoration: none;
                font-weight: 600; font-size: 16px;">
        Ver Ticket Completo
      </a>
    </div>
  `;

  return emailService.send({
    to: email,
    subject: `Respuesta a tu ticket: ${ticketTitle}`,
    html: baseTemplate(content),
  });
}

export async function sendQuotationEmail(
  email: string,
  name: string,
  projectName: string,
  amount: number,
  currency: string,
  projectId: string
) {
  const formattedAmount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
  }).format(amount);

  const content = `
    <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
      Tu Cotización está Lista 📋
    </h2>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Hola ${name}, hemos preparado la cotización para tu proyecto.
    </p>

    <div style="background-color: #0f172a; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">
        ${projectName}
      </p>
      <p style="color: #a855f7; margin: 0; font-size: 36px; font-weight: 700;">
        ${formattedAmount}
      </p>
      <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">
        Cotización válida por 30 días
      </p>
    </div>

    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Revisa los detalles completos de la cotización y, cuando estés listo,
      procede con el pago para iniciar el desarrollo.
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}"
         style="display: inline-block; background-color: #a855f7; color: white;
                padding: 14px 32px; border-radius: 8px; text-decoration: none;
                font-weight: 600; font-size: 16px;">
        Ver Cotización Completa
      </a>
    </div>
  `;

  return emailService.send({
    to: email,
    subject: `📋 Cotización lista para ${projectName}`,
    html: baseTemplate(content),
  });
}

export async function sendProgressUpdateEmail(
  email: string,
  name: string,
  projectName: string,
  milestone: string,
  progress: number
) {
  const content = `
    <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
      Actualización de Progreso 📈
    </h2>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Hola ${name}, hay novedades en tu proyecto <strong>${projectName}</strong>.
    </p>

    <div style="background-color: #0f172a; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <p style="color: #94a3b8; margin: 0 0 12px 0; font-size: 14px;">
        Hito completado:
      </p>
      <p style="color: #22c55e; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        ✅ ${milestone}
      </p>

      <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">
        Progreso total:
      </p>
      <div style="background-color: #334155; border-radius: 4px; height: 12px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #a855f7, #06b6d4); width: ${progress}%; height: 100%;"></div>
      </div>
      <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 24px; font-weight: 700; text-align: center;">
        ${progress}%
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="display: inline-block; background-color: #a855f7; color: white;
                padding: 14px 32px; border-radius: 8px; text-decoration: none;
                font-weight: 600; font-size: 16px;">
        Ver Detalles
      </a>
    </div>
  `;

  return emailService.send({
    to: email,
    subject: `📈 ${projectName} - ${progress}% completado`,
    html: baseTemplate(content),
  });
}
