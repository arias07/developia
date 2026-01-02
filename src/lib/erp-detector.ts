/**
 * ERP Detection Logic
 *
 * Detecta si un proyecto tiene características de ERP para redirigir a ERPHYX
 */

import type { ProjectRequirements } from '@/types/database';

// Keywords that indicate ERP needs
const erpKeywords = {
  description: [
    'erp',
    'planificación de recursos',
    'resource planning',
    'gestión empresarial',
    'enterprise management',
    'inventario',
    'inventory',
    'contabilidad',
    'accounting',
    'facturación',
    'invoicing',
    'nómina',
    'payroll',
    'recursos humanos',
    'human resources',
    'hr system',
    'punto de venta',
    'point of sale',
    'pos',
    'supply chain',
    'cadena de suministro',
    'logística',
    'logistics',
    'warehouse',
    'almacén',
    'crm integrado',
    'integrated crm',
    'módulos empresariales',
    'business modules',
    'manufacturing',
    'manufactura',
    'producción',
    'production planning',
    'mrp',
    'material requirements',
    'gestión de compras',
    'purchase management',
    'proveedores',
    'suppliers management',
  ],
  features: [
    'inventario',
    'inventory management',
    'contabilidad',
    'accounting',
    'facturación electrónica',
    'electronic invoicing',
    'nómina',
    'payroll',
    'punto de venta',
    'pos system',
    'gestión de almacén',
    'warehouse management',
    'reportes financieros',
    'financial reports',
    'cuentas por cobrar',
    'accounts receivable',
    'cuentas por pagar',
    'accounts payable',
    'recursos humanos',
    'hr management',
    'gestión de compras',
    'purchasing',
    'control de producción',
    'production control',
    'planificación de materiales',
    'mrp',
    'multi-sucursal',
    'multi-branch',
    'multi-empresa',
    'multi-company',
  ],
};

// Minimum score to consider it an ERP project
const ERP_THRESHOLD = 3;

export interface ERPDetectionResult {
  isERP: boolean;
  score: number;
  matchedKeywords: string[];
  recommendation: 'erphyx' | 'custom' | 'hybrid';
  message: {
    es: string;
    en: string;
  };
}

export function detectERPProject(requirements: Partial<ProjectRequirements>): ERPDetectionResult {
  const matchedKeywords: string[] = [];
  let score = 0;

  // Check description
  const description = (requirements.project_description || '').toLowerCase();
  for (const keyword of erpKeywords.description) {
    if (description.includes(keyword.toLowerCase())) {
      score++;
      matchedKeywords.push(keyword);
    }
  }

  // Check project name
  const projectName = (requirements.project_name || '').toLowerCase();
  for (const keyword of erpKeywords.description) {
    if (projectName.includes(keyword.toLowerCase()) && !matchedKeywords.includes(keyword)) {
      score++;
      matchedKeywords.push(keyword);
    }
  }

  // Check features
  const allFeatures = [
    ...(requirements.core_features || []),
    ...(requirements.nice_to_have_features || []),
  ];

  for (const feature of allFeatures) {
    const featureName = feature.name.toLowerCase();
    const featureDesc = feature.description.toLowerCase();

    for (const keyword of erpKeywords.features) {
      if (
        (featureName.includes(keyword.toLowerCase()) ||
          featureDesc.includes(keyword.toLowerCase())) &&
        !matchedKeywords.includes(keyword)
      ) {
        score++;
        matchedKeywords.push(keyword);
      }
    }
  }

  // Check goals
  const goals = requirements.main_goals || [];
  for (const goal of goals) {
    const goalLower = goal.toLowerCase();
    if (
      goalLower.includes('erp') ||
      goalLower.includes('gestión integral') ||
      goalLower.includes('recursos empresariales') ||
      goalLower.includes('enterprise resource')
    ) {
      score += 2;
      matchedKeywords.push(goal);
    }
  }

  // Determine recommendation
  let recommendation: 'erphyx' | 'custom' | 'hybrid' = 'custom';
  let message = {
    es: '',
    en: '',
  };

  if (score >= ERP_THRESHOLD * 2) {
    recommendation = 'erphyx';
    message = {
      es: `Tu proyecto tiene características de un sistema ERP completo. Te recomendamos conocer ERPHYX, nuestra solución empresarial lista para usar que incluye: ${matchedKeywords.slice(0, 5).join(', ')} y más. Esto te ahorrará tiempo y dinero.`,
      en: `Your project has characteristics of a complete ERP system. We recommend checking out ERPHYX, our ready-to-use enterprise solution that includes: ${matchedKeywords.slice(0, 5).join(', ')} and more. This will save you time and money.`,
    };
  } else if (score >= ERP_THRESHOLD) {
    recommendation = 'hybrid';
    message = {
      es: `Tu proyecto incluye funcionalidades empresariales como ${matchedKeywords.slice(0, 3).join(', ')}. Podemos integrarlo con ERPHYX o crear una solución personalizada. ¿Te gustaría agendar una consultoría para definir la mejor opción?`,
      en: `Your project includes enterprise features like ${matchedKeywords.slice(0, 3).join(', ')}. We can integrate it with ERPHYX or create a custom solution. Would you like to schedule a consultation to define the best option?`,
    };
  } else {
    message = {
      es: 'Continuaremos con una solución personalizada para tu proyecto.',
      en: 'We will continue with a custom solution for your project.',
    };
  }

  return {
    isERP: score >= ERP_THRESHOLD,
    score,
    matchedKeywords,
    recommendation,
    message,
  };
}

// ERPHYX redirect URL with tracking
export function getERPHYXUrl(source = 'developia-funnel'): string {
  return `https://erphyx.com?utm_source=${source}&utm_medium=redirect&utm_campaign=erp_detection`;
}
