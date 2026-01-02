'use client';

import { useState } from 'react';
import { useFunnelStore } from '@/stores/funnel-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, X, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface StepAudienceProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    audience: {
      label: '¿Quién usará tu producto o servicio?',
      placeholder: 'Ej: Pequeños negocios que quieren vender online, jóvenes de 18-35 años interesados en fitness...',
      hint: 'Describe a tu cliente o usuario ideal',
    },
    goals: {
      label: '¿Cuáles son los objetivos principales?',
      placeholder: 'Agregar objetivo...',
      hint: 'Presiona Enter para agregar',
      suggestions: [
        'Aumentar ventas',
        'Captar leads',
        'Automatizar procesos',
        'Mejorar experiencia de usuario',
        'Reducir costos operativos',
        'Expandir a nuevos mercados',
      ],
    },
    metrics: {
      label: '¿Cómo medirás el éxito?',
      placeholder: 'Agregar métrica...',
      hint: 'Define KPIs o métricas clave',
      suggestions: [
        'Número de usuarios activos',
        'Tasa de conversión',
        'Ingresos mensuales',
        'Tiempo de respuesta',
        'Satisfacción del cliente (NPS)',
        'Reducción de tiempo en tareas',
      ],
    },
    continue: 'Continuar',
  },
  en: {
    audience: {
      label: 'Who will use your product or service?',
      placeholder: 'Ex: Small businesses that want to sell online, young people 18-35 interested in fitness...',
      hint: 'Describe your ideal customer or user',
    },
    goals: {
      label: 'What are the main objectives?',
      placeholder: 'Add goal...',
      hint: 'Press Enter to add',
      suggestions: [
        'Increase sales',
        'Capture leads',
        'Automate processes',
        'Improve user experience',
        'Reduce operational costs',
        'Expand to new markets',
      ],
    },
    metrics: {
      label: 'How will you measure success?',
      placeholder: 'Add metric...',
      hint: 'Define KPIs or key metrics',
      suggestions: [
        'Number of active users',
        'Conversion rate',
        'Monthly revenue',
        'Response time',
        'Customer satisfaction (NPS)',
        'Time reduction in tasks',
      ],
    },
    continue: 'Continue',
  },
};

export function StepAudience({ lang }: StepAudienceProps) {
  const { requirements, updateRequirements, nextStep } = useFunnelStore();
  const [goalInput, setGoalInput] = useState('');
  const [metricInput, setMetricInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = content[lang];

  const goals = requirements.main_goals || [];
  const metrics = requirements.success_metrics || [];

  const addGoal = (goal: string) => {
    if (goal.trim() && !goals.includes(goal.trim())) {
      updateRequirements({ main_goals: [...goals, goal.trim()] });
    }
    setGoalInput('');
  };

  const removeGoal = (goal: string) => {
    updateRequirements({ main_goals: goals.filter((g) => g !== goal) });
  };

  const addMetric = (metric: string) => {
    if (metric.trim() && !metrics.includes(metric.trim())) {
      updateRequirements({ success_metrics: [...metrics, metric.trim()] });
    }
    setMetricInput('');
  };

  const removeMetric = (metric: string) => {
    updateRequirements({ success_metrics: metrics.filter((m) => m !== metric) });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!requirements.target_audience?.trim()) {
      newErrors.target_audience =
        lang === 'es' ? 'Describe tu audiencia' : 'Describe your audience';
    }

    if (goals.length === 0) {
      newErrors.goals =
        lang === 'es' ? 'Agrega al menos un objetivo' : 'Add at least one goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8">
      {/* Target Audience */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <Label htmlFor="audience" className="text-white">
            {t.audience.label}
          </Label>
        </div>
        <Textarea
          id="audience"
          value={requirements.target_audience || ''}
          onChange={(e) => updateRequirements({ target_audience: e.target.value })}
          placeholder={t.audience.placeholder}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px] resize-none"
        />
        <p className="text-sm text-slate-500">{t.audience.hint}</p>
        {errors.target_audience && (
          <p className="text-sm text-red-400">{errors.target_audience}</p>
        )}
      </div>

      {/* Goals */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <Label className="text-white">{t.goals.label}</Label>
        </div>

        <div className="flex gap-2">
          <Input
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGoal(goalInput);
              }
            }}
            placeholder={t.goals.placeholder}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button
            type="button"
            onClick={() => addGoal(goalInput)}
            variant="outline"
            className="border-slate-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected Goals */}
        {goals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goals.map((goal) => (
              <Badge
                key={goal}
                variant="secondary"
                className="bg-purple-600/20 text-purple-300 border-purple-500/30 px-3 py-1"
              >
                {goal}
                <button
                  onClick={() => removeGoal(goal)}
                  className="ml-2 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Goal Suggestions */}
        <div className="flex flex-wrap gap-2">
          {t.goals.suggestions
            .filter((s) => !goals.includes(s))
            .slice(0, 4)
            .map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="border-slate-700 text-slate-400 hover:border-purple-500 hover:text-purple-300 cursor-pointer transition-colors"
                onClick={() => addGoal(suggestion)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {suggestion}
              </Badge>
            ))}
        </div>

        {errors.goals && <p className="text-sm text-red-400">{errors.goals}</p>}
      </div>

      {/* Success Metrics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <Label className="text-white">{t.metrics.label}</Label>
        </div>

        <div className="flex gap-2">
          <Input
            value={metricInput}
            onChange={(e) => setMetricInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMetric(metricInput);
              }
            }}
            placeholder={t.metrics.placeholder}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button
            type="button"
            onClick={() => addMetric(metricInput)}
            variant="outline"
            className="border-slate-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected Metrics */}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metrics.map((metric) => (
              <Badge
                key={metric}
                variant="secondary"
                className="bg-green-600/20 text-green-300 border-green-500/30 px-3 py-1"
              >
                {metric}
                <button
                  onClick={() => removeMetric(metric)}
                  className="ml-2 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Metric Suggestions */}
        <div className="flex flex-wrap gap-2">
          {t.metrics.suggestions
            .filter((s) => !metrics.includes(s))
            .slice(0, 4)
            .map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="border-slate-700 text-slate-400 hover:border-green-500 hover:text-green-300 cursor-pointer transition-colors"
                onClick={() => addMetric(suggestion)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {suggestion}
              </Badge>
            ))}
        </div>
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
