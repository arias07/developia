'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

interface PricingProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    title: 'Planes de mantenimiento',
    subtitle: 'Después de construir tu proyecto, mantén todo funcionando perfecto',
    monthly: 'Mensual',
    yearly: 'Anual',
    save: 'Ahorra 2 meses',
    plans: [
      {
        name: 'Basic',
        price: { monthly: 49, yearly: 490 },
        description: 'Ideal para proyectos pequeños y landing pages',
        features: [
          'Hosting incluido',
          'Certificado SSL/HTTPS',
          'Backups semanales',
          'Soporte por email',
          '2 horas de cambios/mes',
          'Monitoreo uptime',
        ],
        popular: false,
      },
      {
        name: 'Professional',
        price: { monthly: 149, yearly: 1490 },
        description: 'Para negocios en crecimiento que necesitan más',
        features: [
          'Todo en Basic',
          'Backups diarios automáticos',
          'CDN global incluido',
          'Soporte prioritario',
          '5 horas de cambios/mes',
          'Reportes mensuales',
          'Optimización SEO',
        ],
        popular: true,
      },
      {
        name: 'Enterprise',
        price: { monthly: 499, yearly: 4990 },
        description: 'Para proyectos de misión crítica',
        features: [
          'Todo en Professional',
          'SLA 99.9% uptime',
          'Soporte 24/7',
          '15 horas de cambios/mes',
          'Gerente de cuenta dedicado',
          'Auditorías de seguridad',
          'Escalado automático',
          'Multi-región',
        ],
        popular: false,
      },
    ],
    cta: 'Elegir plan',
    ctaPopular: 'Comenzar ahora',
  },
  en: {
    title: 'Maintenance Plans',
    subtitle: 'After building your project, keep everything running perfectly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    save: 'Save 2 months',
    plans: [
      {
        name: 'Basic',
        price: { monthly: 49, yearly: 490 },
        description: 'Ideal for small projects and landing pages',
        features: [
          'Hosting included',
          'SSL/HTTPS certificate',
          'Weekly backups',
          'Email support',
          '2 hours of changes/month',
          'Uptime monitoring',
        ],
        popular: false,
      },
      {
        name: 'Professional',
        price: { monthly: 149, yearly: 1490 },
        description: 'For growing businesses that need more',
        features: [
          'Everything in Basic',
          'Daily automatic backups',
          'Global CDN included',
          'Priority support',
          '5 hours of changes/month',
          'Monthly reports',
          'SEO optimization',
        ],
        popular: true,
      },
      {
        name: 'Enterprise',
        price: { monthly: 499, yearly: 4990 },
        description: 'For mission-critical projects',
        features: [
          'Everything in Professional',
          '99.9% uptime SLA',
          '24/7 support',
          '15 hours of changes/month',
          'Dedicated account manager',
          'Security audits',
          'Auto-scaling',
          'Multi-region',
        ],
        popular: false,
      },
    ],
    cta: 'Choose plan',
    ctaPopular: 'Start now',
  },
};

export function Pricing({ lang }: PricingProps) {
  const t = content[lang];

  return (
    <section id="pricing" className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            {t.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            {t.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {t.plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Popular
                  </div>
                </div>
              )}

              <Card
                className={`h-full ${
                  plan.popular
                    ? 'bg-gradient-to-b from-purple-900/50 to-slate-900 border-purple-500/50'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <CardHeader className="pb-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">{plan.description}</p>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${plan.price.monthly}</span>
                    <span className="text-slate-400 ml-1">USD/mes</span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link href="/funnel" className="w-full">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {plan.popular ? t.ctaPopular : t.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
