// TEST ENDPOINT - Simular flujos del sistema
// IMPORTANTE: Eliminar en producción o proteger con auth

import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppAlert, WhatsAppTemplates } from '@/lib/notifications/whatsapp';
import { notifyEscalation, notifyTeamAssignment } from '@/lib/notifications/multi-channel';
import { EscalationManager } from '@/lib/escalation/escalation-manager';
import { generateProjectTeam } from '@/lib/team/fictional-team-generator';
import type { Escalation } from '@/types/database';

export async function POST(request: NextRequest) {
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
      // TEST 2: Escalación crítica (todos los canales)
      // =============================================
      case 'escalation': {
        const mockEscalation: Escalation = {
          id: 'test-' + Date.now(),
          project_id: 'test-project-id',
          type: 'development_failed',
          severity: 'critical',
          status: 'open',
          failed_phase: 'code_generation',
          error_message: 'TEST: Simulación de error crítico para verificar notificaciones',
          retry_count: 3,
          max_retries: 3,
          assigned_to: null,
          resolution_notes: null,
          app_notified: false,
          email_sent: false,
          whatsapp_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolved_at: null,
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
      // TEST 3: Asignación de equipo
      // =============================================
      case 'team': {
        const team = generateProjectTeam('saas');

        // Simular notificación (sin guardar en DB)
        const notifyResult = await notifyTeamAssignment(
          'test-client-id',
          'test-project-id',
          'App de Prueba',
          team.length
        );

        return NextResponse.json({
          success: true,
          action: 'team',
          team: team.map(m => ({
            name: m.fullName,
            role: m.role,
            specialization: m.specialization,
          })),
          notified: notifyResult
        });
      }

      // =============================================
      // TEST 4: Templates de WhatsApp
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
      // TEST 5: Crear escalación real en DB
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
          { test: true, timestamp: new Date().toISOString() }
        );

        return NextResponse.json({
          success: true,
          action: 'create-escalation',
          escalation
        });
      }

      default:
        return NextResponse.json({
          error: 'Acción no válida',
          availableActions: [
            'whatsapp - Enviar WhatsApp de prueba',
            'escalation - Simular notificación de escalación (sin DB)',
            'team - Generar equipo ficticio de prueba',
            'whatsapp-templates - Ver templates de WhatsApp',
            'create-escalation - Crear escalación real (requiere projectId)',
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en simulación:', error);
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
        description: 'Enviar mensaje de prueba por WhatsApp',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=whatsapp"'
      },
      escalation: {
        description: 'Simular notificación de escalación crítica (App + Email + WhatsApp)',
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
      'create-escalation': {
        description: 'Crear escalación real en base de datos',
        example: 'curl -X POST "http://localhost:3000/api/test/simulate?action=create-escalation" -H "Content-Type: application/json" -d \'{"projectId":"uuid-del-proyecto"}\''
      }
    }
  });
}
