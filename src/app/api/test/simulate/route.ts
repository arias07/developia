// TEST ENDPOINT - Simular flujos del sistema
// Protected with admin authentication

import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppAlert, WhatsAppTemplates } from '@/lib/notifications/whatsapp';
import { sendTelegramAlert, TelegramTemplates } from '@/lib/notifications/telegram';
import { notifyEscalation, notifyTeamAssignment } from '@/lib/notifications/multi-channel';
import { EscalationManager } from '@/lib/escalation/escalation-manager';
import { generateProjectTeam } from '@/lib/team/fictional-team-generator';
import type { Escalation } from '@/types/database';
import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Verify user is admin
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; error?: string }> {
  // Allow in development only with specific header
  if (process.env.NODE_ENV === 'development') {
    const devKey = request.headers.get('x-dev-key');
    if (devKey === process.env.DEV_TEST_KEY) {
      return { isAdmin: true };
    }
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isAdmin: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { isAdmin: false, error: 'Admin access required' };
    }

    return { isAdmin: true };
  } catch (error) {
    return { isAdmin: false, error: 'Authentication failed' };
  }
}

export async function POST(request: NextRequest) {
  // Verify admin access
  const { isAdmin, error: authError } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      // =============================================
      // TEST 1: WhatsApp directo
      // =============================================
      case 'whatsapp': {
        const result = await sendWhatsAppAlert(
          '🧪 *TEST* - Mensaje de prueba desde Developia\n\nSi recibes esto, la integración con Twilio funciona correctamente.'
        );
        return NextResponse.json({ success: result, action: 'whatsapp' });
      }

      // =============================================
      // TEST 2: Telegram directo
      // =============================================
      case 'telegram': {
        const result = await sendTelegramAlert(
          TelegramTemplates.test().text
        );
        return NextResponse.json({ success: result, action: 'telegram' });
      }

      // =============================================
      // TEST 3: Escalación crítica (todos los canales)
      // =============================================
      case 'escalation': {
        const mockEscalation: Escalation = {
          id: 'test-' + Date.now(),
          project_id: 'test-project-id',
          type: 'technical_failure',
          severity: 'critical',
          status: 'pending',
          failed_phase: 'code_generation',
          error_message: 'TEST: Simulación de error crítico para verificar notificaciones',
          ai_attempts: 3,
          assigned_to: undefined,
          resolution_notes: undefined,
          app_notified: false,
          email_sent: false,
          whatsapp_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolved_at: undefined,
        };

        const result = await notifyEscalation({
          escalation: mockEscalation,
          projectName: 'Proyecto de Prueba',
          clientEmail: 'test@example.com',
        });

        return NextResponse.json({
          success: true,
          action: 'escalation',
          channels: result
        });
      }

      // =============================================
      // TEST 4: Asignación de equipo
      // =============================================
      case 'team': {
        const team = await generateProjectTeam({
          projectId: 'test-project-id',
          projectType: 'saas',
          projectName: 'App de Prueba',
        });

        return NextResponse.json({
          success: true,
          action: 'team',
          team: team.map(m => ({
            name: m.display_name,
            role: m.role,
            title: m.title,
            specializations: m.specializations,
            bio: m.bio,
          })),
          teamSize: team.length
        });
      }

      // =============================================
      // TEST 5: Templates de WhatsApp
      // =============================================
      case 'whatsapp-templates': {
        const templates = {
          critical: WhatsAppTemplates.criticalEscalation(
            'Proyecto Demo',
            'Error de conexión a base de datos',
            'ESC-001'
          ),
          payment: WhatsAppTemplates.paymentReceived(
            'Proyecto Demo',
            '$2,500 USD',
            'Juan Pérez'
          ),
          completed: WhatsAppTemplates.projectCompleted(
            'Proyecto Demo',
            'https://proyecto-demo.vercel.app'
          ),
        };

        return NextResponse.json({
          success: true,
          action: 'whatsapp-templates',
          templates
        });
      }

      // =============================================
      // TEST 6: Templates de Telegram
      // =============================================
      case 'telegram-templates': {
        const templates = {
          critical: TelegramTemplates.criticalEscalation(
            'Proyecto Demo',
            'Error de conexión a base de datos',
            'ESC-001'
          ),
          payment: TelegramTemplates.paymentReceived(
            'Proyecto Demo',
            '$2,500 USD',
            'Juan Pérez'
          ),
          completed: TelegramTemplates.projectCompleted(
            'Proyecto Demo',
            'https://proyecto-demo.vercel.app'
          ),
        };

        return NextResponse.json({
          success: true,
          action: 'telegram-templates',
          templates
        });
      }

      // =============================================
      // TEST 7: Crear escalación real en DB
      // =============================================
      case 'create-escalation': {
        const body = await request.json().catch(() => ({}));
        const projectId = body.projectId;

        if (!projectId) {
          return NextResponse.json({
            error: 'Se requiere projectId en el body'
          }, { status: 400 });
        }

        const escalation = await EscalationManager.handleFailure(
          projectId,
          new Error('TEST: Error simulado para pruebas'),
          'testing',
          3 // aiAttempts
        );

        return NextResponse.json({
          success: true,
          action: 'create-escalation',
          escalation
        });
      }

      // =============================================
      // TEST 8: Diagnóstico de configuración
      // =============================================
      case 'diagnose': {
        const config = {
          telegram: {
            botToken: process.env.TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ Falta TELEGRAM_BOT_TOKEN',
            adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID ? '✅ Configurado' : '❌ Falta TELEGRAM_ADMIN_CHAT_ID',
          },
          whatsapp: {
            accountSid: process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ Falta TWILIO_ACCOUNT_SID',
            authToken: process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ Falta TWILIO_AUTH_TOKEN',
            fromNumber: process.env.TWILIO_WHATSAPP_NUMBER ? '✅ Configurado' : '❌ Falta TWILIO_WHATSAPP_NUMBER',
            adminNumber: process.env.ADMIN_WHATSAPP_NUMBER ? '✅ Configurado' : '❌ Falta ADMIN_WHATSAPP_NUMBER',
          },
          email: {
            resendApiKey: process.env.RESEND_API_KEY ? '✅ Configurado' : '❌ Falta RESEND_API_KEY',
            adminEmail: process.env.ADMIN_EMAIL || 'israelarifra@gmail.com',
          },
          supabase: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Falta NEXT_PUBLIC_SUPABASE_URL',
            serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Falta SUPABASE_SERVICE_ROLE_KEY',
          },
        };

        return NextResponse.json({
          success: true,
          action: 'diagnose',
          config,
          note: 'Si alguna configuración falta, las notificaciones de ese canal fallarán silenciosamente.'
        });
      }

      default:
        return NextResponse.json({
          error: 'Acción no válida',
          availableActions: [
            'diagnose - Ver estado de configuración de notificaciones',
            'whatsapp - Enviar WhatsApp de prueba (Twilio)',
            'telegram - Enviar Telegram de prueba',
            'escalation - Simular notificación de escalación (todos los canales)',
            'team - Generar equipo ficticio de prueba',
            'whatsapp-templates - Ver templates de WhatsApp',
            'telegram-templates - Ver templates de Telegram',
            'create-escalation - Crear escalación real (requiere projectId)',
          ]
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error en simulación', error, { route: 'test/simulate' });
    return NextResponse.json({
      error: 'Error en simulación',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para ver instrucciones
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de simulación para pruebas',
    usage: 'POST /api/test/simulate?action=<acción>',
    actions: {
      whatsapp: {
        description: 'Enviar mensaje de prueba por WhatsApp (Twilio)',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=whatsapp"'
      },
      telegram: {
        description: 'Enviar mensaje de prueba por Telegram',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=telegram"'
      },
      escalation: {
        description: 'Simular notificación de escalación crítica (App + Email + WhatsApp + Telegram)',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=escalation"'
      },
      team: {
        description: 'Generar y ver equipo ficticio de prueba',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=team"'
      },
      'whatsapp-templates': {
        description: 'Ver templates de mensajes WhatsApp',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=whatsapp-templates"'
      },
      'telegram-templates': {
        description: 'Ver templates de mensajes Telegram',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=telegram-templates"'
      },
      'create-escalation': {
        description: 'Crear escalación real en base de datos',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=create-escalation" -H "Content-Type: application/json" -d \'{"projectId":"uuid-del-proyecto"}\''
      }
    }
  });
}
