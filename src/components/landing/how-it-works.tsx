'use client';

import { motion } from 'framer-motion';
import { MessageSquare, FileText, CreditCard, Cpu, Rocket, HeartHandshake } from 'lucide-react';

interface HowItWorksProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    title: 'Cómo funciona',
    subtitle: 'De tu idea a software funcional en 4 simples pasos',
    steps: [
      {
        icon: MessageSquare,
        title: 'Cuéntanos tu idea',
        description: 'Nuestro asistente IA te guía para definir exactamente qué necesitas. Sin jerga técnica.',
      },
      {
        icon: FileText,
        title: 'Recibe tu propuesta',
        description: 'Generamos automáticamente especificaciones profesionales, timeline y cotización.',
      },
      {
        icon: CreditCard,
        title: 'Confirma y paga',
        description: 'Revisa la propuesta y, si te convence, realiza el pago de forma segura.',
      },
      {
        icon: Cpu,
        title: 'Nuestro equipo la construye',
        description: 'Nuestro equipo genera el código, diseño y funcionalidades inmediatamente.',
      },
      {
        icon: Rocket,
        title: 'Tu proyecto vivo',
        description: 'Recibe tu proyecto desplegado, listo para usar, con documentación completa.',
      },
      {
        icon: HeartHandshake,
        title: 'Soporte continuo',
        description: 'Mantenimiento, actualizaciones y soporte cuando lo necesites.',
      },
    ],
  },
  en: {
    title: 'How it works',
    subtitle: 'From your idea to functional software in 4 simple steps',
    steps: [
      {
        icon: MessageSquare,
        title: 'Tell us your idea',
        description: 'Our AI assistant guides you to define exactly what you need. No technical jargon.',
      },
      {
        icon: FileText,
        title: 'Receive your proposal',
        description: 'We automatically generate professional specs, timeline, and quote.',
      },
      {
        icon: CreditCard,
        title: 'Confirm and pay',
        description: 'Review the proposal and, if it suits you, pay securely.',
      },
      {
        icon: Cpu,
        title: 'AI builds it',
        description: 'Our AI generates code, design, and features automatically.',
      },
      {
        icon: Rocket,
        title: 'Your project live',
        description: 'Receive your deployed project, ready to use, with full documentation.',
      },
      {
        icon: HeartHandshake,
        title: 'Ongoing support',
        description: 'Maintenance, updates, and support whenever you need it.',
      },
    ],
  },
};

export function HowItWorks({ lang }: HowItWorksProps) {
  const t = content[lang];

  return (
    <section id="how-it-works" className="py-24 bg-slate-950">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {t.steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 h-full">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-7 h-7 text-purple-400" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>

              {/* Connector line (hidden on mobile and last item) */}
              {index < t.steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-slate-700" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
