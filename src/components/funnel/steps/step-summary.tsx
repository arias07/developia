'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFunnelStore, projectTypeLabels } from '@/stores/funnel-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Check,
  FileText,
  Sparkles,
  Calendar,
  DollarSign,
  Loader2,
  CreditCard,
  Download,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

interface StepSummaryProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    title: 'Resumen de tu proyecto',
    generating: 'Generando cotización...',
    project: 'Proyecto',
    type: 'Tipo',
    audience: 'Audiencia',
    goals: 'Objetivos',
    features: 'Funcionalidades',
    coreFeatures: 'Principales',
    niceToHave: 'Deseables',
    design: 'Diseño',
    style: 'Estilo',
    technical: 'Técnico',
    platforms: 'Plataformas',
    integrations: 'Integraciones',
    quotation: {
      title: 'Cotización estimada',
      development: 'Desarrollo',
      design: 'Diseño',
      testing: 'Testing & QA',
      deployment: 'Deployment',
      subtotal: 'Subtotal',
      discount: 'Descuento especial',
      total: 'Total estimado',
      timeline: 'Tiempo estimado',
      weeks: 'semanas',
      disclaimer: 'Esta es una cotización estimada. El precio final puede variar según los detalles específicos.',
    },
    actions: {
      pay: 'Proceder al pago',
      save: 'Guardar cotización',
      download: 'Descargar PDF',
      email: 'Enviar por email',
      consult: 'Hablar con un experto',
    },
    included: {
      title: 'Incluido en tu proyecto',
      items: [
        'Código fuente completo',
        'Documentación técnica',
        'Hosting por 1 año',
        'SSL/HTTPS',
        '30 días de soporte',
        '2 rondas de revisiones',
      ],
    },
  },
  en: {
    title: 'Your project summary',
    generating: 'Generating quote...',
    project: 'Project',
    type: 'Type',
    audience: 'Audience',
    goals: 'Goals',
    features: 'Features',
    coreFeatures: 'Core',
    niceToHave: 'Nice to have',
    design: 'Design',
    style: 'Style',
    technical: 'Technical',
    platforms: 'Platforms',
    integrations: 'Integrations',
    quotation: {
      title: 'Estimated quote',
      development: 'Development',
      design: 'Design',
      testing: 'Testing & QA',
      deployment: 'Deployment',
      subtotal: 'Subtotal',
      discount: 'Special Discount',
      total: 'Estimated total',
      timeline: 'Estimated time',
      weeks: 'weeks',
      disclaimer: 'This is an estimated quote. Final price may vary based on specific details.',
    },
    actions: {
      pay: 'Proceed to payment',
      save: 'Save quote',
      download: 'Download PDF',
      email: 'Send by email',
      consult: 'Talk to an expert',
    },
    included: {
      title: 'Included in your project',
      items: [
        'Complete source code',
        'Technical documentation',
        'Hosting for 1 year',
        'SSL/HTTPS',
        '30 days of support',
        '2 revision rounds',
      ],
    },
  },
};

// Pricing calculator based on requirements
function calculatePrice(requirements: Partial<import('@/types/database').ProjectRequirements>) {
  let basePrice = 0;
  let designPrice = 0;
  let devTime = 0; // in weeks

  // Base price by project type
  const typePricing: Record<string, { base: number; weeks: number }> = {
    landing_page: { base: 500, weeks: 1 },
    website: { base: 1500, weeks: 2 },
    web_app: { base: 3000, weeks: 4 },
    mobile_app: { base: 5000, weeks: 6 },
    ecommerce: { base: 4000, weeks: 5 },
    saas: { base: 8000, weeks: 8 },
    api: { base: 2000, weeks: 3 },
    game: { base: 6000, weeks: 8 },
    custom: { base: 5000, weeks: 6 },
  };

  const typeInfo = typePricing[requirements.project_type || 'web_app'];
  basePrice = typeInfo.base;
  devTime = typeInfo.weeks;

  // Add for features
  const coreFeatures = requirements.core_features || [];
  const niceToHave = requirements.nice_to_have_features || [];
  basePrice += coreFeatures.length * 300;
  basePrice += niceToHave.length * 150;
  devTime += Math.ceil((coreFeatures.length + niceToHave.length) / 4);

  // Technical requirements
  const tech = requirements.technical_requirements;
  if (tech) {
    if (tech.authentication_needed) basePrice += 500;
    if (tech.payment_processing) basePrice += 800;
    if (tech.admin_panel) basePrice += 1000;
    if (tech.multi_language) basePrice += 600;
    if ((tech.integrations?.length || 0) > 0) {
      basePrice += tech.integrations!.length * 200;
    }
    // Multiple platforms
    if ((tech.platform?.length || 0) > 1) {
      basePrice *= 1 + (tech.platform!.length - 1) * 0.4;
      devTime += (tech.platform!.length - 1) * 2;
    }
  }

  // Design pricing
  if (!requirements.design_preferences?.has_branding) {
    designPrice = 500; // Branding creation
  }
  designPrice += 300; // UI/UX design

  // Timeline modifier
  if (requirements.timeline_preference === 'asap') {
    basePrice *= 1.3; // Rush fee
  } else if (requirements.timeline_preference === 'flexible') {
    basePrice *= 0.9; // Discount
  }

  const testingPrice = basePrice * 0.15;
  const deploymentPrice = 200;

  const subtotal = basePrice + designPrice + testingPrice + deploymentPrice;
  const aiDiscount = subtotal * 0.15; // 15% AI discount
  const total = subtotal - aiDiscount;

  return {
    development: Math.round(basePrice),
    design: Math.round(designPrice),
    testing: Math.round(testingPrice),
    deployment: deploymentPrice,
    subtotal: Math.round(subtotal),
    discount: Math.round(aiDiscount),
    total: Math.round(total),
    weeks: Math.max(1, Math.round(devTime)),
  };
}

export function StepSummary({ lang }: StepSummaryProps) {
  const { requirements } = useFunnelStore();
  const [isGenerating, setIsGenerating] = useState(true);
  const [pricing, setPricing] = useState<ReturnType<typeof calculatePrice> | null>(null);
  const t = content[lang];

  useEffect(() => {
    // Simulate AI processing
    const timer = setTimeout(() => {
      setPricing(calculatePrice(requirements));
      setIsGenerating(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [requirements]);

  const projectType = requirements.project_type
    ? projectTypeLabels[requirements.project_type]
    : null;

  const currency = requirements.budget_range?.currency || 'USD';
  const currencySymbol = currency === 'MXN' ? 'MX$' : '$';

  const formatPrice = (price: number) => {
    if (currency === 'MXN') {
      return `MX$${(price * 17).toLocaleString()}`;
    }
    return `$${price.toLocaleString()}`;
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Sparkles className="w-12 h-12 text-purple-400" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2">{t.generating}</h2>
        <p className="text-slate-400">Analizando requerimientos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              {t.project}
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 text-sm">{t.project}</span>
                <p className="text-white font-medium">{requirements.project_name}</p>
              </div>
              <div>
                <span className="text-slate-400 text-sm">{t.type}</span>
                <p className="text-white flex items-center gap-2">
                  {projectType?.icon} {projectType?.[lang]}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-sm">{t.audience}</span>
                <p className="text-white">{requirements.target_audience}</p>
              </div>
            </div>
          </Card>

          {/* Features */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">{t.features}</h3>
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 text-sm">{t.coreFeatures}</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.core_features?.map((f) => (
                    <Badge key={f.id} className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                      {f.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {requirements.nice_to_have_features && requirements.nice_to_have_features.length > 0 && (
                <div>
                  <span className="text-slate-400 text-sm">{t.niceToHave}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requirements.nice_to_have_features?.map((f) => (
                      <Badge key={f.id} variant="outline" className="border-slate-600 text-slate-400">
                        {f.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Technical */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">{t.technical}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-sm">{t.platforms}</span>
                <div className="flex gap-2 mt-2">
                  {requirements.technical_requirements?.platform?.map((p) => (
                    <Badge key={p} className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                      {p.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
              {requirements.technical_requirements?.integrations && requirements.technical_requirements.integrations.length > 0 && (
                <div>
                  <span className="text-slate-400 text-sm">{t.integrations}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requirements.technical_requirements.integrations.map((i) => (
                      <Badge key={i} variant="outline" className="border-slate-600 text-slate-400 text-xs">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column - Pricing */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-b from-purple-900/50 to-slate-900 border-purple-500/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              {t.quotation.title}
            </h3>

            {pricing && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t.quotation.development}</span>
                  <span className="text-white">{formatPrice(pricing.development)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t.quotation.design}</span>
                  <span className="text-white">{formatPrice(pricing.design)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t.quotation.testing}</span>
                  <span className="text-white">{formatPrice(pricing.testing)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t.quotation.deployment}</span>
                  <span className="text-white">{formatPrice(pricing.deployment)}</span>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t.quotation.subtotal}</span>
                  <span className="text-white">{formatPrice(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t.quotation.discount}
                  </span>
                  <span className="text-green-400">-{formatPrice(pricing.discount)}</span>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex justify-between">
                  <span className="text-white font-semibold">{t.quotation.total}</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    {formatPrice(pricing.total)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    {t.quotation.timeline}: {pricing.weeks} {t.quotation.weeks}
                  </span>
                </div>

                <p className="text-xs text-slate-500 pt-2">{t.quotation.disclaimer}</p>
              </div>
            )}
          </Card>

          {/* Included */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h4 className="font-medium text-white mb-3">{t.included.title}</h4>
            <ul className="space-y-2">
              {t.included.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/checkout" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 h-12 text-lg">
                <CreditCard className="w-5 h-5 mr-2" />
                {t.actions.pay}
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-slate-700">
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" className="border-slate-700">
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>
            </div>

            <Link href="/consultation" className="block">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                {t.actions.consult}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
