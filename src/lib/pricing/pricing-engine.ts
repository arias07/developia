import type { ProjectType, ProjectComplexity, ProjectRequirements } from '@/types/database';

// ============================================
// CONFIGURACIÓN DE PRECIOS BASE
// ============================================

export interface PricingConfig {
  // Tarifas por hora según nivel
  hourlyRates: {
    junior: number;
    mid: number;
    senior: number;
    specialist: number;
  };

  // Margen de ganancia (porcentaje)
  profitMargin: number;

  // Costos operativos fijos por proyecto
  operationalCosts: {
    projectManagement: number; // Porcentaje del total
    qualityAssurance: number;  // Porcentaje del total
    infrastructure: number;    // Costo fijo base
  };

  // Descuentos
  discounts: {
    prepayment: number;        // Pago anticipado 100%
    longTermClient: number;    // Cliente recurrente
    referral: number;          // Por referido
  };
}

// Configuración por defecto (ajustable desde admin)
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  hourlyRates: {
    junior: 35,
    mid: 55,
    senior: 85,
    specialist: 120,
  },
  profitMargin: 0.30, // 30%
  operationalCosts: {
    projectManagement: 0.15, // 15% del costo de desarrollo
    qualityAssurance: 0.10, // 10% del costo de desarrollo
    infrastructure: 100,    // $100 base
  },
  discounts: {
    prepayment: 0.10,     // 10% descuento
    longTermClient: 0.05, // 5% descuento
    referral: 0.05,       // 5% descuento
  },
};

// ============================================
// COSTOS BASE POR TIPO DE PROYECTO
// ============================================

export interface ProjectTypeConfig {
  name: string;
  nameEs: string;
  minPrice: number;
  maxPrice: number;
  baseHours: {
    simple: number;
    medium: number;
    complex: number;
    enterprise: number;
  };
  requiredRoles: ('junior' | 'mid' | 'senior' | 'specialist')[];
  includesDesign: boolean;
  typicalFeatures: string[];
}

export const PROJECT_TYPE_CONFIGS: Record<ProjectType, ProjectTypeConfig> = {
  landing_page: {
    name: 'Landing Page',
    nameEs: 'Página de Aterrizaje',
    minPrice: 500,
    maxPrice: 3000,
    baseHours: {
      simple: 15,
      medium: 30,
      complex: 50,
      enterprise: 80,
    },
    requiredRoles: ['mid'],
    includesDesign: true,
    typicalFeatures: ['Diseño responsive', 'Formulario de contacto', 'SEO básico', 'Analytics'],
  },

  website: {
    name: 'Website',
    nameEs: 'Sitio Web',
    minPrice: 1500,
    maxPrice: 15000,
    baseHours: {
      simple: 40,
      medium: 80,
      complex: 150,
      enterprise: 300,
    },
    requiredRoles: ['mid', 'senior'],
    includesDesign: true,
    typicalFeatures: ['Múltiples páginas', 'Blog/Noticias', 'CMS', 'SEO avanzado'],
  },

  web_app: {
    name: 'Web Application',
    nameEs: 'Aplicación Web',
    minPrice: 5000,
    maxPrice: 100000,
    baseHours: {
      simple: 100,
      medium: 250,
      complex: 500,
      enterprise: 1500,
    },
    requiredRoles: ['mid', 'senior', 'specialist'],
    includesDesign: true,
    typicalFeatures: ['Autenticación', 'Dashboard', 'API REST', 'Base de datos'],
  },

  mobile_app: {
    name: 'Mobile App',
    nameEs: 'Aplicación Móvil',
    minPrice: 8000,
    maxPrice: 150000,
    baseHours: {
      simple: 150,
      medium: 350,
      complex: 700,
      enterprise: 2000,
    },
    requiredRoles: ['senior', 'specialist'],
    includesDesign: true,
    typicalFeatures: ['iOS/Android', 'Push notifications', 'Offline mode', 'App Store deployment'],
  },

  ecommerce: {
    name: 'E-commerce',
    nameEs: 'Tienda en Línea',
    minPrice: 3000,
    maxPrice: 80000,
    baseHours: {
      simple: 80,
      medium: 200,
      complex: 450,
      enterprise: 1000,
    },
    requiredRoles: ['mid', 'senior', 'specialist'],
    includesDesign: true,
    typicalFeatures: ['Catálogo', 'Carrito', 'Pagos', 'Inventario', 'Envíos'],
  },

  saas: {
    name: 'SaaS Platform',
    nameEs: 'Plataforma SaaS',
    minPrice: 15000,
    maxPrice: 300000,
    baseHours: {
      simple: 300,
      medium: 600,
      complex: 1200,
      enterprise: 3000,
    },
    requiredRoles: ['senior', 'specialist'],
    includesDesign: true,
    typicalFeatures: ['Multi-tenant', 'Suscripciones', 'API pública', 'Admin panel', 'Analytics'],
  },

  api: {
    name: 'API / Backend',
    nameEs: 'API / Backend',
    minPrice: 3000,
    maxPrice: 50000,
    baseHours: {
      simple: 60,
      medium: 150,
      complex: 350,
      enterprise: 800,
    },
    requiredRoles: ['senior', 'specialist'],
    includesDesign: false,
    typicalFeatures: ['REST/GraphQL', 'Autenticación', 'Rate limiting', 'Documentación'],
  },

  game: {
    name: 'Game',
    nameEs: 'Videojuego',
    minPrice: 10000,
    maxPrice: 500000,
    baseHours: {
      simple: 200,
      medium: 500,
      complex: 1500,
      enterprise: 5000,
    },
    requiredRoles: ['specialist'],
    includesDesign: true,
    typicalFeatures: ['Game engine', 'Assets', 'Multiplayer', 'Monetización'],
  },

  custom: {
    name: 'Custom Project',
    nameEs: 'Proyecto Personalizado',
    minPrice: 2000,
    maxPrice: 200000,
    baseHours: {
      simple: 80,
      medium: 200,
      complex: 500,
      enterprise: 1500,
    },
    requiredRoles: ['mid', 'senior'],
    includesDesign: true,
    typicalFeatures: ['Según requerimientos'],
  },
};

// ============================================
// MULTIPLICADORES DE FEATURES
// ============================================

export const FEATURE_MULTIPLIERS: Record<string, number> = {
  // Autenticación
  'auth_basic': 1.0,
  'auth_social': 1.1,
  'auth_2fa': 1.2,
  'auth_sso': 1.3,

  // Pagos
  'payments_basic': 1.15,
  'payments_subscriptions': 1.25,
  'payments_marketplace': 1.4,

  // Multilenguaje
  'i18n_2_languages': 1.1,
  'i18n_5_languages': 1.2,
  'i18n_10_plus': 1.35,

  // Integraciones
  'integrations_1_3': 1.1,
  'integrations_4_7': 1.25,
  'integrations_8_plus': 1.5,

  // Admin panel
  'admin_basic': 1.1,
  'admin_advanced': 1.25,

  // Real-time
  'realtime_chat': 1.2,
  'realtime_notifications': 1.1,
  'realtime_collaboration': 1.4,

  // Otros
  'analytics_advanced': 1.15,
  'seo_advanced': 1.1,
  'accessibility_wcag': 1.15,
  'performance_critical': 1.2,
};

// ============================================
// MOTOR DE COTIZACIÓN
// ============================================

export interface QuotationResult {
  isViable: boolean;
  viabilityReason?: string;

  // Costos desglosados
  breakdown: {
    developmentCost: number;
    designCost: number;
    projectManagement: number;
    qualityAssurance: number;
    infrastructure: number;
    subtotal: number;
    profitMargin: number;
    total: number;
  };

  // Horas estimadas
  hours: {
    development: number;
    design: number;
    management: number;
    qa: number;
    total: number;
  };

  // Timeline
  timeline: {
    weeksMin: number;
    weeksMax: number;
    phases: Array<{
      name: string;
      weeks: number;
      deliverables: string[];
    }>;
  };

  // Opciones de pago
  paymentOptions: {
    full: { amount: number; discount: number };
    split50: { deposit: number; final: number };
    milestones: Array<{ name: string; percentage: number; amount: number }>;
  };

  // Alternativas si no es viable
  alternatives?: Array<{
    type: 'mvp' | 'phased' | 'simpler';
    description: string;
    estimatedCost: number;
    features: string[];
  }>;

  // Advertencias
  warnings: string[];

  // Recomendaciones
  recommendations: string[];
}

export interface QuotationInput {
  projectType: ProjectType;
  complexity: ProjectComplexity;
  requirements: Partial<ProjectRequirements>;
  clientBudget?: {
    min: number;
    max: number;
  };
  timeline?: 'asap' | 'flexible' | 'specific';
  config?: Partial<PricingConfig>;
}

export function calculateQuotation(input: QuotationInput): QuotationResult {
  const config = { ...DEFAULT_PRICING_CONFIG, ...input.config };
  const typeConfig = PROJECT_TYPE_CONFIGS[input.projectType];

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // 1. Calcular horas base según tipo y complejidad
  const baseHours = typeConfig.baseHours[input.complexity];

  // 2. Aplicar multiplicadores de features
  let featureMultiplier = 1.0;
  const requirements = input.requirements;

  if (requirements?.technical_requirements) {
    const tech = requirements.technical_requirements;

    if (tech.authentication_needed) {
      featureMultiplier *= FEATURE_MULTIPLIERS['auth_basic'];
    }
    if (tech.payment_processing) {
      featureMultiplier *= FEATURE_MULTIPLIERS['payments_basic'];
    }
    if (tech.multi_language) {
      featureMultiplier *= FEATURE_MULTIPLIERS['i18n_2_languages'];
    }
    if (tech.admin_panel) {
      featureMultiplier *= FEATURE_MULTIPLIERS['admin_basic'];
    }
    if (tech.integrations && tech.integrations.length > 0) {
      const count = tech.integrations.length;
      if (count <= 3) featureMultiplier *= FEATURE_MULTIPLIERS['integrations_1_3'];
      else if (count <= 7) featureMultiplier *= FEATURE_MULTIPLIERS['integrations_4_7'];
      else featureMultiplier *= FEATURE_MULTIPLIERS['integrations_8_plus'];
    }
  }

  // Multiplicador por cantidad de features
  const coreFeatures = requirements?.core_features?.length || 0;
  const niceToHaveFeatures = requirements?.nice_to_have_features?.length || 0;
  const totalFeatures = coreFeatures + (niceToHaveFeatures * 0.5);

  if (totalFeatures > 10) {
    featureMultiplier *= 1 + ((totalFeatures - 10) * 0.03); // +3% por cada feature extra
    warnings.push(`El proyecto tiene ${coreFeatures} features core, lo cual incrementa significativamente el costo.`);
  }

  // 3. Calcular horas totales
  const developmentHours = Math.round(baseHours * featureMultiplier);
  const designHours = typeConfig.includesDesign ? Math.round(developmentHours * 0.25) : 0;
  const managementHours = Math.round(developmentHours * 0.15);
  const qaHours = Math.round(developmentHours * 0.1);
  const totalHours = developmentHours + designHours + managementHours + qaHours;

  // 4. Calcular costos
  // Determinar mix de roles según complejidad
  let avgHourlyRate: number;
  switch (input.complexity) {
    case 'simple':
      avgHourlyRate = config.hourlyRates.mid;
      break;
    case 'medium':
      avgHourlyRate = (config.hourlyRates.mid + config.hourlyRates.senior) / 2;
      break;
    case 'complex':
      avgHourlyRate = config.hourlyRates.senior;
      break;
    case 'enterprise':
      avgHourlyRate = (config.hourlyRates.senior + config.hourlyRates.specialist) / 2;
      break;
    default:
      avgHourlyRate = config.hourlyRates.mid;
  }

  const developmentCost = developmentHours * avgHourlyRate;
  const designCost = designHours * config.hourlyRates.mid;
  const pmCost = developmentCost * config.operationalCosts.projectManagement;
  const qaCost = developmentCost * config.operationalCosts.qualityAssurance;
  const infraCost = config.operationalCosts.infrastructure;

  const subtotal = developmentCost + designCost + pmCost + qaCost + infraCost;
  const profit = subtotal * config.profitMargin;
  const total = Math.round(subtotal + profit);

  // 5. Verificar viabilidad contra presupuesto del cliente
  let isViable = true;
  let viabilityReason: string | undefined;
  let alternatives: QuotationResult['alternatives'] | undefined;

  if (input.clientBudget) {
    const budgetMax = input.clientBudget.max;

    if (budgetMax < typeConfig.minPrice) {
      isViable = false;
      viabilityReason = `El presupuesto de $${budgetMax.toLocaleString()} está por debajo del mínimo viable para un proyecto de tipo "${typeConfig.nameEs}" ($${typeConfig.minPrice.toLocaleString()}).`;

      // Generar alternativas
      alternatives = generateAlternatives(input, typeConfig, budgetMax);

    } else if (budgetMax < total * 0.7) {
      isViable = false;
      viabilityReason = `El presupuesto de $${budgetMax.toLocaleString()} cubre solo el ${Math.round((budgetMax / total) * 100)}% del costo estimado ($${total.toLocaleString()}).`;

      alternatives = generateAlternatives(input, typeConfig, budgetMax);

    } else if (budgetMax < total) {
      isViable = true;
      warnings.push(`El presupuesto de $${budgetMax.toLocaleString()} está ${Math.round(((total - budgetMax) / total) * 100)}% por debajo del estimado. Se requerirán ajustes en alcance.`);
      recommendations.push('Considerar reducir features "nice-to-have" para ajustar al presupuesto.');
    }
  }

  // 6. Calcular timeline
  const weeksMin = Math.ceil(totalHours / 40 / 2); // 2 desarrolladores
  const weeksMax = Math.ceil(totalHours / 40);     // 1 desarrollador

  const phases = generatePhases(input.projectType, input.complexity, weeksMin);

  // 7. Opciones de pago
  const fullPaymentDiscount = total * config.discounts.prepayment;

  const paymentOptions = {
    full: {
      amount: total - fullPaymentDiscount,
      discount: fullPaymentDiscount,
    },
    split50: {
      deposit: Math.round(total * 0.5),
      final: Math.round(total * 0.5),
    },
    milestones: [
      { name: 'Inicio del proyecto', percentage: 30, amount: Math.round(total * 0.3) },
      { name: 'Entrega de diseño', percentage: 20, amount: Math.round(total * 0.2) },
      { name: 'MVP funcional', percentage: 30, amount: Math.round(total * 0.3) },
      { name: 'Entrega final', percentage: 20, amount: Math.round(total * 0.2) },
    ],
  };

  // 8. Recomendaciones adicionales
  if (input.timeline === 'asap') {
    warnings.push('Timeline acelerado puede requerir recursos adicionales (+15-25% en costo).');
  }

  if (input.complexity === 'enterprise') {
    recommendations.push('Considerar un contrato de mantenimiento post-lanzamiento.');
    recommendations.push('Se recomienda fase de discovery antes del desarrollo.');
  }

  return {
    isViable,
    viabilityReason,
    breakdown: {
      developmentCost: Math.round(developmentCost),
      designCost: Math.round(designCost),
      projectManagement: Math.round(pmCost),
      qualityAssurance: Math.round(qaCost),
      infrastructure: Math.round(infraCost),
      subtotal: Math.round(subtotal),
      profitMargin: Math.round(profit),
      total,
    },
    hours: {
      development: developmentHours,
      design: designHours,
      management: managementHours,
      qa: qaHours,
      total: totalHours,
    },
    timeline: {
      weeksMin,
      weeksMax,
      phases,
    },
    paymentOptions,
    alternatives,
    warnings,
    recommendations,
  };
}

function generateAlternatives(
  input: QuotationInput,
  typeConfig: ProjectTypeConfig,
  budget: number
): QuotationResult['alternatives'] {
  const alternatives: QuotationResult['alternatives'] = [];

  // MVP option
  if (budget >= typeConfig.minPrice * 0.6) {
    alternatives.push({
      type: 'mvp',
      description: 'Versión mínima viable con funcionalidades core únicamente',
      estimatedCost: Math.round(typeConfig.minPrice * 0.7),
      features: [
        'Solo funcionalidades esenciales',
        'Diseño funcional (no premium)',
        'Sin integraciones complejas',
        'Posibilidad de expandir después',
      ],
    });
  }

  // Phased approach
  if (budget >= typeConfig.minPrice * 0.4) {
    alternatives.push({
      type: 'phased',
      description: 'Desarrollo en fases, pagando por etapas',
      estimatedCost: budget,
      features: [
        `Fase 1: Core ($${budget.toLocaleString()})`,
        'Fases adicionales según presupuesto futuro',
        'Arquitectura preparada para escalar',
        'Entregas incrementales',
      ],
    });
  }

  // Simpler project type
  const simplerTypes: Partial<Record<ProjectType, ProjectType>> = {
    'web_app': 'website',
    'mobile_app': 'web_app',
    'saas': 'web_app',
    'ecommerce': 'website',
  };

  const simplerType = simplerTypes[input.projectType];
  if (simplerType && budget >= PROJECT_TYPE_CONFIGS[simplerType].minPrice) {
    const simplerConfig = PROJECT_TYPE_CONFIGS[simplerType];
    alternatives.push({
      type: 'simpler',
      description: `Alternativa: ${simplerConfig.nameEs} en lugar de ${typeConfig.nameEs}`,
      estimatedCost: simplerConfig.minPrice,
      features: simplerConfig.typicalFeatures,
    });
  }

  return alternatives;
}

function generatePhases(
  projectType: ProjectType,
  complexity: ProjectComplexity,
  totalWeeks: number
): QuotationResult['timeline']['phases'] {
  const phases = [];

  // Discovery (solo para proyectos complejos)
  if (complexity === 'complex' || complexity === 'enterprise') {
    phases.push({
      name: 'Discovery & Planning',
      weeks: Math.max(1, Math.round(totalWeeks * 0.1)),
      deliverables: ['PRD detallado', 'Arquitectura técnica', 'Wireframes'],
    });
  }

  // Design
  phases.push({
    name: 'Diseño UI/UX',
    weeks: Math.max(1, Math.round(totalWeeks * 0.2)),
    deliverables: ['Mockups', 'Design system', 'Prototipos'],
  });

  // Development
  phases.push({
    name: 'Desarrollo',
    weeks: Math.max(2, Math.round(totalWeeks * 0.5)),
    deliverables: ['Frontend', 'Backend', 'Integraciones', 'Base de datos'],
  });

  // Testing
  phases.push({
    name: 'Testing & QA',
    weeks: Math.max(1, Math.round(totalWeeks * 0.15)),
    deliverables: ['Tests automatizados', 'QA manual', 'Fixes'],
  });

  // Launch
  phases.push({
    name: 'Deployment & Launch',
    weeks: 1,
    deliverables: ['Configuración producción', 'DNS', 'Monitoreo', 'Go-live'],
  });

  return phases;
}

// ============================================
// VALIDADOR DE VIABILIDAD
// ============================================

export function validateProjectViability(
  projectType: ProjectType,
  complexity: ProjectComplexity,
  budget: number,
  features: number
): {
  isViable: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
} {
  const typeConfig = PROJECT_TYPE_CONFIGS[projectType];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check minimum budget
  if (budget < typeConfig.minPrice) {
    score -= 40;
    issues.push(`Presupuesto por debajo del mínimo ($${typeConfig.minPrice.toLocaleString()} para ${typeConfig.nameEs})`);
    suggestions.push(`Aumentar presupuesto a mínimo $${typeConfig.minPrice.toLocaleString()}`);
  } else if (budget < typeConfig.minPrice * 1.5) {
    score -= 15;
    issues.push('Presupuesto ajustado - alcance limitado');
    suggestions.push('Priorizar features core');
  }

  // Check complexity vs budget ratio
  const complexityMultipliers = { simple: 1, medium: 1.8, complex: 3, enterprise: 5 };
  const expectedBudget = typeConfig.minPrice * complexityMultipliers[complexity];

  if (budget < expectedBudget * 0.6) {
    score -= 30;
    issues.push(`Presupuesto insuficiente para complejidad "${complexity}"`);
    suggestions.push(`Reducir complejidad o aumentar presupuesto a ~$${Math.round(expectedBudget).toLocaleString()}`);
  }

  // Check feature count
  const maxFeaturesForBudget = Math.floor((budget / typeConfig.minPrice) * 5);
  if (features > maxFeaturesForBudget) {
    score -= 20;
    issues.push(`Demasiadas features (${features}) para el presupuesto`);
    suggestions.push(`Reducir a máximo ${maxFeaturesForBudget} features o aumentar presupuesto`);
  }

  return {
    isViable: score >= 50,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}
