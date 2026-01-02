'use client';

import { motion } from 'framer-motion';
import { useFunnelStore } from '@/stores/funnel-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Monitor, Smartphone, Tablet, Globe, Lock, CreditCard, Users, Languages, Search, Plug } from 'lucide-react';

interface StepTechnicalProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    platform: {
      label: '¿En qué plataformas necesitas tu proyecto?',
      options: [
        { value: 'web', label: 'Web', icon: Monitor, description: 'Navegadores de escritorio' },
        { value: 'ios', label: 'iOS', icon: Smartphone, description: 'iPhone y iPad' },
        { value: 'android', label: 'Android', icon: Smartphone, description: 'Teléfonos y tablets Android' },
      ],
    },
    features: {
      label: 'Funcionalidades técnicas',
      options: [
        { key: 'authentication_needed', label: 'Autenticación de usuarios', icon: Lock, description: 'Login, registro, recuperación de contraseña' },
        { key: 'payment_processing', label: 'Procesamiento de pagos', icon: CreditCard, description: 'Stripe, PayPal, pasarelas locales' },
        { key: 'admin_panel', label: 'Panel de administración', icon: Users, description: 'Gestionar contenido y usuarios' },
        { key: 'multi_language', label: 'Multi-idioma', icon: Languages, description: 'Soporte para varios idiomas' },
        { key: 'seo_needed', label: 'SEO optimizado', icon: Search, description: 'Posicionamiento en buscadores' },
      ],
    },
    integrations: {
      label: 'Integraciones (opcional)',
      placeholder: 'Ej: Google Analytics, Mailchimp, Slack...',
      suggestions: [
        'Google Analytics',
        'Mailchimp',
        'Zapier',
        'Slack',
        'WhatsApp',
        'Facebook Pixel',
        'Google Maps',
        'Twilio SMS',
      ],
    },
    continue: 'Continuar',
  },
  en: {
    platform: {
      label: 'What platforms do you need your project on?',
      options: [
        { value: 'web', label: 'Web', icon: Monitor, description: 'Desktop browsers' },
        { value: 'ios', label: 'iOS', icon: Smartphone, description: 'iPhone and iPad' },
        { value: 'android', label: 'Android', icon: Smartphone, description: 'Android phones and tablets' },
      ],
    },
    features: {
      label: 'Technical features',
      options: [
        { key: 'authentication_needed', label: 'User authentication', icon: Lock, description: 'Login, signup, password recovery' },
        { key: 'payment_processing', label: 'Payment processing', icon: CreditCard, description: 'Stripe, PayPal, local gateways' },
        { key: 'admin_panel', label: 'Admin panel', icon: Users, description: 'Manage content and users' },
        { key: 'multi_language', label: 'Multi-language', icon: Languages, description: 'Support for multiple languages' },
        { key: 'seo_needed', label: 'SEO optimized', icon: Search, description: 'Search engine positioning' },
      ],
    },
    integrations: {
      label: 'Integrations (optional)',
      placeholder: 'Ex: Google Analytics, Mailchimp, Slack...',
      suggestions: [
        'Google Analytics',
        'Mailchimp',
        'Zapier',
        'Slack',
        'WhatsApp',
        'Facebook Pixel',
        'Google Maps',
        'Twilio SMS',
      ],
    },
    continue: 'Continue',
  },
};

export function StepTechnical({ lang }: StepTechnicalProps) {
  const { requirements, updateRequirements, nextStep } = useFunnelStore();
  const t = content[lang];

  const techReqs = requirements.technical_requirements || {
    platform: ['web'],
    integrations: [],
    authentication_needed: false,
    payment_processing: false,
    admin_panel: false,
    multi_language: false,
    seo_needed: true,
  };

  const updateTechReqs = (updates: Partial<typeof techReqs>) => {
    updateRequirements({
      technical_requirements: { ...techReqs, ...updates },
    });
  };

  const togglePlatform = (platform: 'web' | 'ios' | 'android') => {
    const currentPlatforms = techReqs.platform || [];
    if (currentPlatforms.includes(platform)) {
      // Don't allow removing if it's the last one
      if (currentPlatforms.length > 1) {
        updateTechReqs({
          platform: currentPlatforms.filter((p) => p !== platform),
        });
      }
    } else {
      updateTechReqs({
        platform: [...currentPlatforms, platform],
      });
    }
  };

  const toggleFeature = (key: keyof typeof techReqs) => {
    updateTechReqs({
      [key]: !techReqs[key],
    });
  };

  const toggleIntegration = (integration: string) => {
    const currentIntegrations = techReqs.integrations || [];
    if (currentIntegrations.includes(integration)) {
      updateTechReqs({
        integrations: currentIntegrations.filter((i) => i !== integration),
      });
    } else {
      updateTechReqs({
        integrations: [...currentIntegrations, integration],
      });
    }
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Platform Selection */}
      <div className="space-y-4">
        <Label className="text-white text-lg">{t.platform.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {t.platform.options.map((option) => {
            const isSelected = techReqs.platform?.includes(
              option.value as 'web' | 'ios' | 'android'
            );
            const Icon = option.icon;
            return (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() =>
                    togglePlatform(option.value as 'web' | 'ios' | 'android')
                  }
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-purple-500/20' : 'bg-slate-800'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected ? 'text-purple-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{option.label}</h4>
                      <p className="text-xs text-slate-400">{option.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Technical Features */}
      <div className="space-y-4">
        <Label className="text-white text-lg">{t.features.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {t.features.options.map((option) => {
            const isSelected = techReqs[option.key as keyof typeof techReqs];
            const Icon = option.icon;
            return (
              <motion.div
                key={option.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  onClick={() => toggleFeature(option.key as keyof typeof techReqs)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-600/20 border-cyan-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-cyan-500/20' : 'bg-slate-800'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected ? 'text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{option.label}</h4>
                      <p className="text-xs text-slate-400">{option.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Integrations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5 text-green-400" />
          <Label className="text-white">{t.integrations.label}</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.integrations.suggestions.map((integration) => {
            const isSelected = techReqs.integrations?.includes(integration);
            return (
              <Badge
                key={integration}
                variant="outline"
                onClick={() => toggleIntegration(integration)}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-green-600/20 border-green-500 text-green-300'
                    : 'border-slate-700 text-slate-400 hover:border-green-500/50 hover:text-green-300'
                }`}
              >
                {integration}
              </Badge>
            );
          })}
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
