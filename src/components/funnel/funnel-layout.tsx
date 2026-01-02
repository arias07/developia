'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useFunnelStore } from '@/stores/funnel-store';

interface FunnelLayoutProps {
  children: React.ReactNode;
  lang: 'es' | 'en';
}

const content = {
  es: {
    step: 'Paso',
    of: 'de',
    back: 'Atrás',
    exit: 'Salir',
    exitConfirm: '¿Seguro que quieres salir? Tu progreso se guardará.',
  },
  en: {
    step: 'Step',
    of: 'of',
    back: 'Back',
    exit: 'Exit',
    exitConfirm: 'Are you sure you want to exit? Your progress will be saved.',
  },
};

const stepTitles = {
  es: [
    'Cuéntanos sobre tu proyecto',
    '¿Quién es tu audiencia?',
    '¿Qué funcionalidades necesitas?',
    'Estilo y diseño',
    'Requerimientos técnicos',
    'Timeline y presupuesto',
    'Resumen y cotización',
  ],
  en: [
    'Tell us about your project',
    'Who is your audience?',
    'What features do you need?',
    'Style and design',
    'Technical requirements',
    'Timeline and budget',
    'Summary and quote',
  ],
};

export function FunnelLayout({ children, lang }: FunnelLayoutProps) {
  const { currentStep, totalSteps, prevStep, getProgress } = useFunnelStore();
  const t = content[lang];
  const titles = stepTitles[lang];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Back button */}
            <div className="w-24">
              {currentStep > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
              )}
            </div>

            {/* Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                DevelopIA
              </span>
            </Link>

            {/* Exit button */}
            <div className="w-24 flex justify-end">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                {t.step} {currentStep} {t.of} {totalSteps}
              </span>
              <span className="text-sm text-slate-400">{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2 bg-slate-800" />
          </div>
        </div>
      </header>

      {/* Step title */}
      <div className="container mx-auto px-4 py-8">
        <motion.h1
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold text-white text-center"
        >
          {titles[currentStep - 1]}
        </motion.h1>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
