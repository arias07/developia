import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateQuotation, validateProjectViability, PROJECT_TYPE_CONFIGS } from '@/lib/pricing/pricing-engine';
import { convertCurrency, formatCurrency, toUSD, fromUSD, type CurrencyCode } from '@/lib/pricing/currency';
import type { ProjectType, ProjectComplexity } from '@/types/database';

export async function POST(request: NextRequest) {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectType,
      complexity,
      requirements,
      budget,
      currency = 'USD',
      timeline,
      projectId,
    } = body as {
      projectType: ProjectType;
      complexity: ProjectComplexity;
      requirements: Record<string, unknown>;
      budget?: { min: number; max: number };
      currency?: CurrencyCode;
      timeline?: 'asap' | 'flexible' | 'specific';
      projectId?: string;
    };

    if (!projectType || !complexity) {
      return NextResponse.json(
        { error: 'projectType and complexity are required' },
        { status: 400 }
      );
    }

    // Convertir presupuesto a USD si está en otra moneda
    let budgetInUSD: { min: number; max: number } | undefined;
    if (budget) {
      budgetInUSD = {
        min: toUSD(budget.min, currency),
        max: toUSD(budget.max, currency),
      };
    }

    // Calcular cotización
    const quotation = calculateQuotation({
      projectType,
      complexity,
      requirements,
      clientBudget: budgetInUSD,
      timeline,
    });

    // Validar viabilidad
    const featureCount =
      (requirements?.core_features as unknown[])?.length || 0 +
      (requirements?.nice_to_have_features as unknown[])?.length || 0;

    const viability = validateProjectViability(
      projectType,
      complexity,
      budgetInUSD?.max || 999999,
      featureCount
    );

    // Convertir todos los montos a la moneda del cliente
    const quotationInCurrency = {
      ...quotation,
      breakdown: {
        developmentCost: fromUSD(quotation.breakdown.developmentCost, currency),
        designCost: fromUSD(quotation.breakdown.designCost, currency),
        projectManagement: fromUSD(quotation.breakdown.projectManagement, currency),
        qualityAssurance: fromUSD(quotation.breakdown.qualityAssurance, currency),
        infrastructure: fromUSD(quotation.breakdown.infrastructure, currency),
        subtotal: fromUSD(quotation.breakdown.subtotal, currency),
        profitMargin: fromUSD(quotation.breakdown.profitMargin, currency),
        total: fromUSD(quotation.breakdown.total, currency),
      },
      paymentOptions: {
        full: {
          amount: fromUSD(quotation.paymentOptions.full.amount, currency),
          discount: fromUSD(quotation.paymentOptions.full.discount, currency),
        },
        split50: {
          deposit: fromUSD(quotation.paymentOptions.split50.deposit, currency),
          final: fromUSD(quotation.paymentOptions.split50.final, currency),
        },
        milestones: quotation.paymentOptions.milestones.map((m) => ({
          ...m,
          amount: fromUSD(m.amount, currency),
        })),
      },
      alternatives: quotation.alternatives?.map((alt) => ({
        ...alt,
        estimatedCost: fromUSD(alt.estimatedCost, currency),
      })),
      // Agregar versión formateada para display
      formatted: {
        total: formatCurrency(fromUSD(quotation.breakdown.total, currency), currency),
        totalUSD: formatCurrency(quotation.breakdown.total, 'USD'),
        deposit: formatCurrency(fromUSD(quotation.paymentOptions.split50.deposit, currency), currency),
      },
      currency,
      originalUSD: quotation.breakdown, // Mantener original en USD para referencia
    };

    // Agregar información del tipo de proyecto
    const typeConfig = PROJECT_TYPE_CONFIGS[projectType];
    const projectInfo = {
      type: projectType,
      typeName: typeConfig.name,
      typeNameEs: typeConfig.nameEs,
      minPrice: formatCurrency(fromUSD(typeConfig.minPrice, currency), currency),
      maxPrice: formatCurrency(fromUSD(typeConfig.maxPrice, currency), currency),
      minPriceUSD: typeConfig.minPrice,
      maxPriceUSD: typeConfig.maxPrice,
    };

    // Guardar cotización en base de datos si hay projectId
    if (projectId && quotation.isViable) {
      await supabase.from('quotations').insert({
        project_id: projectId,
        amount: quotation.breakdown.total, // Guardar siempre en USD
        currency: 'USD',
        breakdown: quotation.breakdown,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: quotation.warnings.join('\n'),
        status: 'draft',
      });

      // Actualizar precio estimado del proyecto
      await supabase.from('projects').update({
        estimated_price: quotation.breakdown.total,
        complexity,
        updated_at: new Date().toISOString(),
      }).eq('id', projectId);
    }

    return NextResponse.json({
      quotation: quotationInCurrency,
      viability,
      projectInfo,
      meta: {
        calculatedAt: new Date().toISOString(),
        baseCurrency: 'USD',
        displayCurrency: currency,
        validForDays: 30,
      },
    });
  } catch (error) {
    console.error('Error generating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}

// GET - Obtener configuración de precios (para mostrar en UI)
export async function GET() {
  const projectTypes = Object.entries(PROJECT_TYPE_CONFIGS).map(([key, config]) => ({
    type: key,
    name: config.name,
    nameEs: config.nameEs,
    minPrice: config.minPrice,
    maxPrice: config.maxPrice,
    includesDesign: config.includesDesign,
    typicalFeatures: config.typicalFeatures,
  }));

  return NextResponse.json({
    projectTypes,
    complexityLevels: [
      { value: 'simple', label: 'Simple', description: 'Funcionalidad básica, pocas pantallas' },
      { value: 'medium', label: 'Medio', description: 'Funcionalidad estándar, varias pantallas' },
      { value: 'complex', label: 'Complejo', description: 'Funcionalidad avanzada, muchas pantallas' },
      { value: 'enterprise', label: 'Empresarial', description: 'Alta escalabilidad, integraciones múltiples' },
    ],
    currencies: ['USD', 'MXN', 'EUR', 'COP'],
  });
}
