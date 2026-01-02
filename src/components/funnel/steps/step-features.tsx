'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunnelStore, generateFeatureId } from '@/stores/funnel-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Plus, Trash2, Edit2, Sparkles, Layers, Star, Zap } from 'lucide-react';
import type { Feature } from '@/types/database';

interface StepFeaturesProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    coreFeatures: {
      label: 'Funcionalidades principales',
      description: 'Las características esenciales que tu proyecto debe tener',
      add: 'Agregar funcionalidad',
    },
    niceToHave: {
      label: 'Funcionalidades deseables',
      description: 'Características que te gustaría tener si el presupuesto lo permite',
      add: 'Agregar deseable',
    },
    featureDialog: {
      title: 'Nueva funcionalidad',
      editTitle: 'Editar funcionalidad',
      name: 'Nombre',
      namePlaceholder: 'Ej: Sistema de login, Carrito de compras...',
      description: 'Descripción',
      descriptionPlaceholder: 'Describe qué debe hacer esta funcionalidad...',
      priority: 'Prioridad',
      priorities: {
        must_have: 'Imprescindible',
        should_have: 'Importante',
        nice_to_have: 'Deseable',
      },
      save: 'Guardar',
      cancel: 'Cancelar',
    },
    suggestions: {
      label: 'Sugerencias basadas en tu proyecto',
      add: 'Agregar',
    },
    aiSuggest: 'Sugerir funcionalidades con IA',
    continue: 'Continuar',
    empty: 'Aún no has agregado funcionalidades',
  },
  en: {
    coreFeatures: {
      label: 'Core Features',
      description: 'Essential characteristics your project must have',
      add: 'Add feature',
    },
    niceToHave: {
      label: 'Nice to Have',
      description: 'Features you would like if budget allows',
      add: 'Add nice to have',
    },
    featureDialog: {
      title: 'New Feature',
      editTitle: 'Edit Feature',
      name: 'Name',
      namePlaceholder: 'Ex: Login system, Shopping cart...',
      description: 'Description',
      descriptionPlaceholder: 'Describe what this feature should do...',
      priority: 'Priority',
      priorities: {
        must_have: 'Must Have',
        should_have: 'Should Have',
        nice_to_have: 'Nice to Have',
      },
      save: 'Save',
      cancel: 'Cancel',
    },
    suggestions: {
      label: 'Suggestions based on your project',
      add: 'Add',
    },
    aiSuggest: 'Suggest features with AI',
    continue: 'Continue',
    empty: 'No features added yet',
  },
};

// Suggestions based on project type
const featureSuggestions: Record<string, { es: string; en: string }[]> = {
  ecommerce: [
    { es: 'Carrito de compras', en: 'Shopping cart' },
    { es: 'Pasarela de pagos', en: 'Payment gateway' },
    { es: 'Gestión de inventario', en: 'Inventory management' },
    { es: 'Búsqueda y filtros', en: 'Search and filters' },
    { es: 'Reseñas de productos', en: 'Product reviews' },
    { es: 'Wishlist', en: 'Wishlist' },
  ],
  web_app: [
    { es: 'Autenticación de usuarios', en: 'User authentication' },
    { es: 'Dashboard personalizado', en: 'Custom dashboard' },
    { es: 'Notificaciones', en: 'Notifications' },
    { es: 'Reportes y analytics', en: 'Reports and analytics' },
    { es: 'API REST', en: 'REST API' },
  ],
  saas: [
    { es: 'Multi-tenancy', en: 'Multi-tenancy' },
    { es: 'Sistema de suscripciones', en: 'Subscription system' },
    { es: 'Roles y permisos', en: 'Roles and permissions' },
    { es: 'Facturación automática', en: 'Automatic billing' },
    { es: 'Onboarding de usuarios', en: 'User onboarding' },
  ],
  landing_page: [
    { es: 'Formulario de contacto', en: 'Contact form' },
    { es: 'Integración con CRM', en: 'CRM integration' },
    { es: 'Chat en vivo', en: 'Live chat' },
    { es: 'SEO optimizado', en: 'SEO optimized' },
  ],
  mobile_app: [
    { es: 'Push notifications', en: 'Push notifications' },
    { es: 'Modo offline', en: 'Offline mode' },
    { es: 'Geolocalización', en: 'Geolocation' },
    { es: 'Cámara/Galería', en: 'Camera/Gallery' },
  ],
  default: [
    { es: 'Autenticación', en: 'Authentication' },
    { es: 'Panel de administración', en: 'Admin panel' },
    { es: 'Notificaciones por email', en: 'Email notifications' },
    { es: 'Diseño responsive', en: 'Responsive design' },
  ],
};

export function StepFeatures({ lang }: StepFeaturesProps) {
  const { requirements, updateRequirements, nextStep } = useFunnelStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isCore, setIsCore] = useState(true);
  const [featureForm, setFeatureForm] = useState({
    name: '',
    description: '',
    priority: 'must_have' as Feature['priority'],
  });
  const t = content[lang];

  const coreFeatures = requirements.core_features || [];
  const niceToHaveFeatures = requirements.nice_to_have_features || [];

  const suggestions =
    featureSuggestions[requirements.project_type || 'default'] ||
    featureSuggestions.default;

  const allFeatureNames = [...coreFeatures, ...niceToHaveFeatures].map((f) =>
    f.name.toLowerCase()
  );

  const openAddDialog = (core: boolean) => {
    setIsCore(core);
    setEditingFeature(null);
    setFeatureForm({
      name: '',
      description: '',
      priority: core ? 'must_have' : 'nice_to_have',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (feature: Feature, core: boolean) => {
    setIsCore(core);
    setEditingFeature(feature);
    setFeatureForm({
      name: feature.name,
      description: feature.description,
      priority: feature.priority,
    });
    setIsDialogOpen(true);
  };

  const saveFeature = () => {
    if (!featureForm.name.trim()) return;

    const feature: Feature = {
      id: editingFeature?.id || generateFeatureId(),
      name: featureForm.name.trim(),
      description: featureForm.description.trim(),
      priority: featureForm.priority,
      estimated_complexity: 'medium',
    };

    if (isCore) {
      if (editingFeature) {
        updateRequirements({
          core_features: coreFeatures.map((f) =>
            f.id === editingFeature.id ? feature : f
          ),
        });
      } else {
        updateRequirements({ core_features: [...coreFeatures, feature] });
      }
    } else {
      if (editingFeature) {
        updateRequirements({
          nice_to_have_features: niceToHaveFeatures.map((f) =>
            f.id === editingFeature.id ? feature : f
          ),
        });
      } else {
        updateRequirements({
          nice_to_have_features: [...niceToHaveFeatures, feature],
        });
      }
    }

    setIsDialogOpen(false);
  };

  const deleteFeature = (id: string, core: boolean) => {
    if (core) {
      updateRequirements({
        core_features: coreFeatures.filter((f) => f.id !== id),
      });
    } else {
      updateRequirements({
        nice_to_have_features: niceToHaveFeatures.filter((f) => f.id !== id),
      });
    }
  };

  const addSuggestion = (name: string) => {
    const feature: Feature = {
      id: generateFeatureId(),
      name,
      description: '',
      priority: 'should_have',
      estimated_complexity: 'medium',
    };
    updateRequirements({ core_features: [...coreFeatures, feature] });
  };

  const handleContinue = () => {
    nextStep();
  };

  const FeatureCard = ({ feature, core }: { feature: Feature; core: boolean }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className="p-4 bg-slate-900 border-slate-700 group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-white truncate">{feature.name}</h4>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${
                  feature.priority === 'must_have'
                    ? 'border-red-500/50 text-red-400'
                    : feature.priority === 'should_have'
                    ? 'border-yellow-500/50 text-yellow-400'
                    : 'border-green-500/50 text-green-400'
                }`}
              >
                {t.featureDialog.priorities[feature.priority]}
              </Badge>
            </div>
            {feature.description && (
              <p className="text-sm text-slate-400 line-clamp-2">
                {feature.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => openEditDialog(feature, core)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              onClick={() => deleteFeature(feature.id, core)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* AI Suggestions */}
      <Card className="p-4 bg-purple-900/20 border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">{t.suggestions.label}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions
            .filter((s) => !allFeatureNames.includes(s[lang].toLowerCase()))
            .slice(0, 5)
            .map((suggestion) => (
              <Badge
                key={suggestion[lang]}
                variant="outline"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 cursor-pointer transition-colors"
                onClick={() => addSuggestion(suggestion[lang])}
              >
                <Plus className="w-3 h-3 mr-1" />
                {suggestion[lang]}
              </Badge>
            ))}
        </div>
      </Card>

      {/* Core Features */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-white">{t.coreFeatures.label}</h3>
              <p className="text-sm text-slate-400">{t.coreFeatures.description}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700"
            onClick={() => openAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.coreFeatures.add}
          </Button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {coreFeatures.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} core={true} />
            ))}
          </AnimatePresence>
          {coreFeatures.length === 0 && (
            <p className="text-center text-slate-500 py-8">{t.empty}</p>
          )}
        </div>
      </div>

      {/* Nice to Have Features */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-white">{t.niceToHave.label}</h3>
              <p className="text-sm text-slate-400">{t.niceToHave.description}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700"
            onClick={() => openAddDialog(false)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.niceToHave.add}
          </Button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {niceToHaveFeatures.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} core={false} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Feature Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingFeature ? t.featureDialog.editTitle : t.featureDialog.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">{t.featureDialog.name}</Label>
              <Input
                value={featureForm.name}
                onChange={(e) =>
                  setFeatureForm({ ...featureForm, name: e.target.value })
                }
                placeholder={t.featureDialog.namePlaceholder}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">{t.featureDialog.description}</Label>
              <Textarea
                value={featureForm.description}
                onChange={(e) =>
                  setFeatureForm({ ...featureForm, description: e.target.value })
                }
                placeholder={t.featureDialog.descriptionPlaceholder}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">{t.featureDialog.priority}</Label>
              <Select
                value={featureForm.priority}
                onValueChange={(value) =>
                  setFeatureForm({
                    ...featureForm,
                    priority: value as Feature['priority'],
                  })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="must_have">
                    {t.featureDialog.priorities.must_have}
                  </SelectItem>
                  <SelectItem value="should_have">
                    {t.featureDialog.priorities.should_have}
                  </SelectItem>
                  <SelectItem value="nice_to_have">
                    {t.featureDialog.priorities.nice_to_have}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-700"
            >
              {t.featureDialog.cancel}
            </Button>
            <Button
              onClick={saveFeature}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
              disabled={!featureForm.name.trim()}
            >
              {t.featureDialog.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
