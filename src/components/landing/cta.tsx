'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Calendar, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CTAProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    title: '¿Listo para transformar tu idea en realidad?',
    subtitle: 'Comienza ahora y recibe tu cotización en minutos, no en días.',
    cta: 'Comenzar mi proyecto',
    ctaSecondary: 'Agendar consultoría',
    ctaChat: 'Hablar con un experto',
  },
  en: {
    title: 'Ready to transform your idea into reality?',
    subtitle: 'Start now and receive your quote in minutes, not days.',
    cta: 'Start my project',
    ctaSecondary: 'Schedule consultation',
    ctaChat: 'Talk to an expert',
  },
};

export function CTA({ lang }: CTAProps) {
  const t = content[lang];

  return (
    <section className="py-24 bg-gradient-to-r from-purple-900/50 via-slate-900 to-cyan-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.title}</h2>
          <p className="text-lg text-slate-400 mb-8">{t.subtitle}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/funnel">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-6 text-lg rounded-xl"
              >
                {t.cta}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/consultation">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg rounded-xl"
              >
                <Calendar className="mr-2 w-5 h-5" />
                {t.ctaSecondary}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
