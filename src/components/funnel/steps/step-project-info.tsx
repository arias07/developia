'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFunnelStore, projectTypeLabels } from '@/stores/funnel-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { ProjectType } from '@/types/database';
import { ArrowRight, Sparkles } from 'lucide-react';

interface StepProjectInfoProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    projectName: {
      label: 'Nombre del proyecto',
      placeholder: 'Ej: Mi Tienda Online, App de Reservas, etc.',
    },
    projectDescription: {
      label: '¿De qué se trata tu proyecto?',
      placeholder: 'Cuéntanos tu idea con tus propias palabras. No te preocupes por ser técnico, solo describe lo que imaginas...',
      hint: 'Tip: Mientras más detalles nos des, mejor entenderemos tu visión.',
    },
    projectType: {
      label: '¿Qué tipo de proyecto es?',
    },
    aiAssist: 'Ayúdame a definir mi idea',
    continue: 'Continuar',
  },
  en: {
    projectName: {
      label: 'Project name',
      placeholder: 'Ex: My Online Store, Booking App, etc.',
    },
    projectDescription: {
      label: 'What is your project about?',
      placeholder: 'Tell us your idea in your own words. Don\'t worry about being technical, just describe what you imagine...',
      hint: 'Tip: The more details you give us, the better we\'ll understand your vision.',
    },
    projectType: {
      label: 'What type of project is it?',
    },
    aiAssist: 'Help me define my idea',
    continue: 'Continue',
  },
};

const projectTypes: ProjectType[] = [
  'landing_page',
  'website',
  'web_app',
  'mobile_app',
  'ecommerce',
  'saas',
  'api',
  'game',
  'custom',
];

export function StepProjectInfo({ lang }: StepProjectInfoProps) {
  const { requirements, updateRequirements, nextStep } = useFunnelStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = content[lang];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!requirements.project_name?.trim()) {
      newErrors.project_name = lang === 'es' ? 'El nombre es requerido' : 'Name is required';
    }

    if (!requirements.project_description?.trim()) {
      newErrors.project_description =
        lang === 'es' ? 'La descripción es requerida' : 'Description is required';
    }

    if (!requirements.project_type) {
      newErrors.project_type =
        lang === 'es' ? 'Selecciona un tipo de proyecto' : 'Select a project type';
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
      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="project-name" className="text-white">
          {t.projectName.label}
        </Label>
        <Input
          id="project-name"
          value={requirements.project_name || ''}
          onChange={(e) => updateRequirements({ project_name: e.target.value })}
          placeholder={t.projectName.placeholder}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-12"
        />
        {errors.project_name && (
          <p className="text-sm text-red-400">{errors.project_name}</p>
        )}
      </div>

      {/* Project Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="project-description" className="text-white">
            {t.projectDescription.label}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {t.aiAssist}
          </Button>
        </div>
        <Textarea
          id="project-description"
          value={requirements.project_description || ''}
          onChange={(e) => updateRequirements({ project_description: e.target.value })}
          placeholder={t.projectDescription.placeholder}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[150px] resize-none"
        />
        <p className="text-sm text-slate-500">{t.projectDescription.hint}</p>
        {errors.project_description && (
          <p className="text-sm text-red-400">{errors.project_description}</p>
        )}
      </div>

      {/* Project Type */}
      <div className="space-y-4">
        <Label className="text-white">{t.projectType.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projectTypes.map((type) => {
            const typeInfo = projectTypeLabels[type];
            const isSelected = requirements.project_type === type;

            return (
              <motion.div
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() => updateRequirements({ project_type: type })}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{typeInfo.icon}</span>
                    <div>
                      <h3 className="font-medium text-white">{typeInfo[lang]}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {typeInfo.description[lang]}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
        {errors.project_type && (
          <p className="text-sm text-red-400">{errors.project_type}</p>
        )}
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
