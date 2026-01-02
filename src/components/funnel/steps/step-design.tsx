'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFunnelStore } from '@/stores/funnel-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, X, Palette, Upload, Link as LinkIcon } from 'lucide-react';

interface StepDesignProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    style: {
      label: '¿Qué estilo visual prefieres?',
      options: [
        { value: 'modern', label: 'Moderno', description: 'Limpio, minimalista, con mucho espacio' },
        { value: 'classic', label: 'Clásico', description: 'Elegante, tradicional, profesional' },
        { value: 'minimalist', label: 'Minimalista', description: 'Ultra simple, enfocado en contenido' },
        { value: 'bold', label: 'Llamativo', description: 'Colores vibrantes, tipografía grande' },
        { value: 'custom', label: 'Personalizado', description: 'Tengo un diseño específico en mente' },
      ],
    },
    colors: {
      label: '¿Tienes colores de marca?',
      placeholder: '#FF5733 o "azul corporativo"',
      hint: 'Agrega los colores que quieres usar (opcional)',
    },
    inspirations: {
      label: 'Sitios de inspiración',
      placeholder: 'https://ejemplo.com',
      hint: 'Comparte URLs de sitios que te gustan',
    },
    branding: {
      label: '¿Tienes assets de marca?',
      yes: 'Sí, tengo logo y materiales',
      no: 'No, necesito que los creen',
    },
    continue: 'Continuar',
  },
  en: {
    style: {
      label: 'What visual style do you prefer?',
      options: [
        { value: 'modern', label: 'Modern', description: 'Clean, minimalist, lots of space' },
        { value: 'classic', label: 'Classic', description: 'Elegant, traditional, professional' },
        { value: 'minimalist', label: 'Minimalist', description: 'Ultra simple, content focused' },
        { value: 'bold', label: 'Bold', description: 'Vibrant colors, large typography' },
        { value: 'custom', label: 'Custom', description: 'I have a specific design in mind' },
      ],
    },
    colors: {
      label: 'Do you have brand colors?',
      placeholder: '#FF5733 or "corporate blue"',
      hint: 'Add the colors you want to use (optional)',
    },
    inspirations: {
      label: 'Inspiration sites',
      placeholder: 'https://example.com',
      hint: 'Share URLs of sites you like',
    },
    branding: {
      label: 'Do you have brand assets?',
      yes: 'Yes, I have logo and materials',
      no: 'No, I need them created',
    },
    continue: 'Continue',
  },
};

const styleEmojis: Record<string, string> = {
  modern: '✨',
  classic: '🏛️',
  minimalist: '⬜',
  bold: '🎨',
  custom: '🎯',
};

export function StepDesign({ lang }: StepDesignProps) {
  const { requirements, updateRequirements, nextStep } = useFunnelStore();
  const [colorInput, setColorInput] = useState('');
  const [inspirationInput, setInspirationInput] = useState('');
  const t = content[lang];

  const designPrefs = requirements.design_preferences || {
    style: 'modern',
    colors: [],
    inspirations: [],
    has_branding: false,
    branding_assets: [],
  };

  const updateDesignPrefs = (updates: Partial<typeof designPrefs>) => {
    updateRequirements({
      design_preferences: { ...designPrefs, ...updates },
    });
  };

  const addColor = () => {
    if (colorInput.trim() && !designPrefs.colors?.includes(colorInput.trim())) {
      updateDesignPrefs({
        colors: [...(designPrefs.colors || []), colorInput.trim()],
      });
      setColorInput('');
    }
  };

  const removeColor = (color: string) => {
    updateDesignPrefs({
      colors: designPrefs.colors?.filter((c) => c !== color),
    });
  };

  const addInspiration = () => {
    if (
      inspirationInput.trim() &&
      !designPrefs.inspirations?.includes(inspirationInput.trim())
    ) {
      updateDesignPrefs({
        inspirations: [...(designPrefs.inspirations || []), inspirationInput.trim()],
      });
      setInspirationInput('');
    }
  };

  const removeInspiration = (url: string) => {
    updateDesignPrefs({
      inspirations: designPrefs.inspirations?.filter((i) => i !== url),
    });
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Style Selection */}
      <div className="space-y-4">
        <Label className="text-white text-lg">{t.style.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {t.style.options.map((option) => {
            const isSelected = designPrefs.style === option.value;
            return (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() =>
                    updateDesignPrefs({
                      style: option.value as typeof designPrefs.style,
                    })
                  }
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {styleEmojis[option.value]}
                    </span>
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

      {/* Colors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          <Label className="text-white">{t.colors.label}</Label>
        </div>

        <div className="flex gap-2">
          <Input
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addColor();
              }
            }}
            placeholder={t.colors.placeholder}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button
            type="button"
            onClick={addColor}
            variant="outline"
            className="border-slate-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {designPrefs.colors && designPrefs.colors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {designPrefs.colors.map((color) => (
              <Badge
                key={color}
                variant="secondary"
                className="bg-slate-800 text-white border-slate-700 px-3 py-1 flex items-center gap-2"
              >
                {color.startsWith('#') && (
                  <span
                    className="w-4 h-4 rounded-full border border-slate-600"
                    style={{ backgroundColor: color }}
                  />
                )}
                {color}
                <button onClick={() => removeColor(color)} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-slate-500">{t.colors.hint}</p>
      </div>

      {/* Inspirations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-cyan-400" />
          <Label className="text-white">{t.inspirations.label}</Label>
        </div>

        <div className="flex gap-2">
          <Input
            value={inspirationInput}
            onChange={(e) => setInspirationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addInspiration();
              }
            }}
            placeholder={t.inspirations.placeholder}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button
            type="button"
            onClick={addInspiration}
            variant="outline"
            className="border-slate-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {designPrefs.inspirations && designPrefs.inspirations.length > 0 && (
          <div className="space-y-2">
            {designPrefs.inspirations.map((url) => (
              <Card
                key={url}
                className="p-3 bg-slate-900 border-slate-700 flex items-center justify-between"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-400 hover:text-cyan-300 truncate flex-1"
                >
                  {url}
                </a>
                <button
                  onClick={() => removeInspiration(url)}
                  className="text-slate-400 hover:text-red-400 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
        <p className="text-sm text-slate-500">{t.inspirations.hint}</p>
      </div>

      {/* Branding */}
      <div className="space-y-3">
        <Label className="text-white">{t.branding.label}</Label>
        <div className="flex gap-3">
          <Card
            onClick={() => updateDesignPrefs({ has_branding: true })}
            className={`flex-1 p-4 cursor-pointer transition-all ${
              designPrefs.has_branding
                ? 'bg-green-600/20 border-green-500'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-green-400" />
              <span className="text-white">{t.branding.yes}</span>
            </div>
          </Card>
          <Card
            onClick={() => updateDesignPrefs({ has_branding: false })}
            className={`flex-1 p-4 cursor-pointer transition-all ${
              !designPrefs.has_branding
                ? 'bg-purple-600/20 border-purple-500'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-purple-400" />
              <span className="text-white">{t.branding.no}</span>
            </div>
          </Card>
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
