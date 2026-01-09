import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface InvoiceData {
  invoice: {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    status: string;
  };
  client: {
    name: string;
    email: string;
    company?: string;
  };
  project: {
    name: string;
    description: string;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    type: string;
    paidAt?: string;
  };
  company: {
    name: string;
    tagline: string;
    email: string;
    website: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase clients
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the user's token
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch payment with related data
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select(
        `
        *,
        project:projects!payments_project_id_fkey(
          id,
          name,
          description,
          client_id
        )
      `
      )
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      logger.warn('Payment not found', { paymentId, service: 'invoice' });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check authorization - user must be client, admin, or project owner
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';
    const isOwner = payment.client_id === user.id || payment.project?.client_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch client profile
    const clientId = payment.client_id || payment.project?.client_id;
    const { data: clientProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, company')
      .eq('id', clientId)
      .single();

    // Generate invoice number from payment ID and date
    const paymentDate = new Date(payment.created_at);
    const invoiceNumber = `INV-${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${payment.id.slice(0, 8).toUpperCase()}`;

    // Calculate totals
    const taxRate = 0; // 0% tax for digital services (can be configured)
    const subtotal = payment.amount;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Build invoice data
    const invoiceData: InvoiceData = {
      invoice: {
        id: payment.id,
        number: invoiceNumber,
        date: paymentDate.toISOString(),
        dueDate: payment.paid_at || paymentDate.toISOString(),
        status: payment.status,
      },
      client: {
        name: clientProfile?.full_name || 'Cliente',
        email: clientProfile?.email || '',
        company: clientProfile?.company,
      },
      project: {
        name: payment.project?.name || 'Proyecto',
        description: payment.project?.description || '',
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.payment_type,
        paidAt: payment.paid_at,
      },
      company: {
        name: 'Devvy',
        tagline: 'Tu idea, nuestro código',
        email: process.env.EMAIL_FROM || 'contact@devvy.tech',
        website: process.env.NEXT_PUBLIC_APP_URL || 'https://devvy.tech',
      },
      items: [
        {
          description: getPaymentTypeDescription(payment.payment_type, payment.project?.name),
          quantity: 1,
          unitPrice: payment.amount,
          total: payment.amount,
        },
      ],
      totals: {
        subtotal,
        tax,
        taxRate,
        total,
      },
    };

    logger.info('Invoice data generated', {
      service: 'invoice',
      paymentId,
      invoiceNumber,
      userId: user.id,
    });

    return NextResponse.json(invoiceData);
  } catch (error) {
    logger.error('Error generating invoice', error, { service: 'invoice' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getPaymentTypeDescription(type: string, projectName?: string): string {
  const descriptions: Record<string, string> = {
    full: `Desarrollo de software - ${projectName || 'Proyecto'}`,
    deposit: `Anticipo - ${projectName || 'Proyecto'}`,
    milestone: `Hito de desarrollo - ${projectName || 'Proyecto'}`,
    maintenance: `Mantenimiento mensual - ${projectName || 'Proyecto'}`,
  };
  return descriptions[type] || `Servicio de desarrollo - ${projectName || 'Proyecto'}`;
}
