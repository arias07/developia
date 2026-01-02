'use client';

import { useFunnelStore } from '@/stores/funnel-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Zap, Clock, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepTimelineProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    timeline: {
      label: '¿Cuándo necesitas tu proyecto?',
      options: [
        { value: 'asap', label: 'Lo antes posible', icon: Zap, description: 'Prioridad máxima, precio premium' },
        { value: 'flexible', label: 'Soy flexible', icon: Clock, description: 'Sin prisa, mejor precio' },
        { value: 'specific_date', label: 'Fecha específica', icon: Calendar, description: 'Tengo un deadline' },
      ],
    },
    deadline: {
      label: 'Fecha límite',
    },
    budget: {
      label: '¿Cuál es tu rango de presupuesto?',
      min: 'Mínimo',
      max: 'Máximo',
      currency: 'Moneda',
      ranges: [
        { min: 500, max: 2000, label: '$500 - $2,000', description: 'Landing pages, sitios simples' },
        { min: 2000, max: 5000, label: '$2,000 - $5,000', description: 'Sitios web, apps pequeñas' },
        { min: 5000, max: 15000, label: '$5,000 - $15,000', description: 'Apps web/móvil, e-commerce' },
        { min: 15000, max: 50000, label: '$15,000 - $50,000', description: 'Plataformas SaaS, proyectos complejos' },
        { min: 50000, max: 200000, label: '$50,000+', description: 'Soluciones enterprise' },
      ],
    },
    notes: {
      label: 'Notas adicionales (opcional)',
      placeholder: '¿Hay algo más que debamos saber sobre tu proyecto?',
    },
    continue: 'Ver cotización',
  },
  en: {
    timeline: {
      label: 'When do you need your project?',
      options: [
        { value: 'asap', label: 'As soon as possible', icon: Zap, description: 'Top priority, premium price' },
        { value: 'flexible', label: "I'm flexible", icon: Clock, description: 'No rush, better price' },
        { value: 'specific_date', label: 'Specific date', icon: Calendar, description: 'I have a deadline' },
      ],
    },
    deadline: {
      label: 'Deadline',
    },
    budget: {
      label: 'What is your budget range?',
      min: 'Minimum',
      max: 'Maximum',
      currency: 'Currency',
      ranges: [
        { min: 500, max: 2000, label: '$500 - $2,000', description: 'Landing pages, simple sites' },
        { min: 2000, max: 5000, label: '$2,000 - $5,000', description: 'Websites, small apps' },
        { min: 5000, max: 15000, label: '$5,000 - $15,000', description: 'Web/mobile apps, e-commerce' },
        { min: 15000, max: 50000, label: '$15,000 - $50,000', description: 'SaaS platforms, complex projects' },
        { min: 50000, max: 200000, label: '$50,000+', description: 'Enterprise solutions' },
      ],
    },
    notes: {
      label: 'Additional notes (optional)',
      placeholder: 'Is there anything else we should know about your project?',
    },
    continue: 'See quote',
  },
};

export function StepTimeline({ lang }: StepTimelineProps) {
  const { requirements, updateRequirements, nextStep } = useFunnelStore();
  const t = content[lang];

  const budgetRange = requirements.budget_range || {
    min: 2000,
    max: 5000,
    currency: 'USD',
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Timeline Selection */}
      <div className="space-y-4">
        <Label className="text-white text-lg">{t.timeline.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {t.timeline.options.map((option) => {
            const isSelected = requirements.timeline_preference === option.value;
            const Icon = option.icon;
            return (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() =>
                    updateRequirements({
                      timeline_preference: option.value as 'asap' | 'flexible' | 'specific_date',
                    })
                  }
                  className={`p-4 cursor-pointer transition-all h-full ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div
                      className={`p-3 rounded-full ${
                        isSelected ? 'bg-purple-500/20' : 'bg-slate-800'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? 'text-purple-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <h4 className="font-medium text-white">{option.label}</h4>
                    <p className="text-xs text-slate-400">{option.description}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Specific date picker */}
        {requirements.timeline_preference === 'specific_date' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-4"
          >
            <Label className="text-white mb-2 block">{t.deadline.label}</Label>
            <Input
              type="date"
              value={requirements.specific_deadline || ''}
              onChange={(e) =>
                updateRequirements({ specific_deadline: e.target.value })
              }
              min={new Date().toISOString().split('T')[0]}
              className="bg-slate-900 border-slate-700 text-white max-w-xs"
            />
          </motion.div>
        )}
      </div>

      {/* Budget Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <Label className="text-white text-lg">{t.budget.label}</Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {t.budget.ranges.map((range) => {
            const isSelected =
              budgetRange.min === range.min && budgetRange.max === range.max;
            return (
              <motion.div
                key={range.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() =>
                    updateRequirements({
                      budget_range: {
                        min: range.min,
                        max: range.max,
                        currency: budgetRange.currency,
                      },
                    })
                  }
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-green-600/20 border-green-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <h4 className="font-semibold text-white mb-1">{range.label}</h4>
                  <p className="text-xs text-slate-400">{range.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Currency Toggle */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant={budgetRange.currency === 'USD' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              updateRequirements({
                budget_range: { ...budgetRange, currency: 'USD' },
              })
            }
            className={
              budgetRange.currency === 'USD'
                ? 'bg-green-600 hover:bg-green-700'
                : 'border-slate-700'
            }
          >
            🇺🇸 USD
          </Button>
          <Button
            type="button"
            variant={budgetRange.currency === 'MXN' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              updateRequirements({
                budget_range: { ...budgetRange, currency: 'MXN' },
              })
            }
            className={
              budgetRange.currency === 'MXN'
                ? 'bg-green-600 hover:bg-green-700'
                : 'border-slate-700'
            }
          >
            🇲🇽 MXN
          </Button>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label className="text-white">{t.notes.label}</Label>
        <Textarea
          value={requirements.additional_notes || ''}
          onChange={(e) => updateRequirements({ additional_notes: e.target.value })}
          placeholder={t.notes.placeholder}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px] resize-none"
        />
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
        >
          {t.continue}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
