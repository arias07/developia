import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectRequirements, ProjectType, Feature } from '@/types/database';

interface FunnelState {
  currentStep: number;
  totalSteps: number;
  sessionId: string | null;

  // Form data
  requirements: Partial<ProjectRequirements>;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateRequirements: (data: Partial<ProjectRequirements>) => void;
  setSessionId: (id: string) => void;
  resetFunnel: () => void;

  // Computed
  getProgress: () => number;
  isComplete: () => boolean;
}

const initialRequirements: Partial<ProjectRequirements> = {
  project_name: '',
  project_description: '',
  project_type: undefined,
  target_audience: '',
  main_goals: [],
  success_metrics: [],
  core_features: [],
  nice_to_have_features: [],
  design_preferences: {
    style: 'modern',
    colors: [],
    inspirations: [],
    has_branding: false,
    branding_assets: [],
  },
  technical_requirements: {
    platform: ['web'],
    integrations: [],
    authentication_needed: false,
    payment_processing: false,
    admin_panel: false,
    multi_language: false,
    seo_needed: true,
  },
  timeline_preference: 'flexible',
  budget_range: {
    min: 1000,
    max: 5000,
    currency: 'USD',
  },
  additional_notes: '',
  attachments: [],
};

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      totalSteps: 7,
      sessionId: null,
      requirements: initialRequirements,

      setStep: (step) => set({ currentStep: Math.max(1, Math.min(step, get().totalSteps)) }),

      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      updateRequirements: (data) =>
        set((state) => ({
          requirements: { ...state.requirements, ...data },
        })),

      setSessionId: (id) => set({ sessionId: id }),

      resetFunnel: () =>
        set({
          currentStep: 1,
          sessionId: null,
          requirements: initialRequirements,
        }),

      getProgress: () => {
        const { currentStep, totalSteps } = get();
        return Math.round((currentStep / totalSteps) * 100);
      },

      isComplete: () => {
        const { currentStep, totalSteps } = get();
        return currentStep === totalSteps;
      },
    }),
    {
      name: 'developia-funnel',
      partialize: (state) => ({
        currentStep: state.currentStep,
        requirements: state.requirements,
        sessionId: state.sessionId,
      }),
    }
  )
);

// Helper to generate unique feature ID
export const generateFeatureId = () => `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Project type labels
export const projectTypeLabels: Record<ProjectType, { es: string; en: string; icon: string; description: { es: string; en: string } }> = {
  landing_page: {
    es: 'Landing Page',
    en: 'Landing Page',
    icon: '🎯',
    description: {
      es: 'Página de aterrizaje para captar leads o promocionar un producto/servicio',
      en: 'Landing page to capture leads or promote a product/service',
    },
  },
  website: {
    es: 'Sitio Web',
    en: 'Website',
    icon: '🌐',
    description: {
      es: 'Sitio web informativo o corporativo con múltiples páginas',
      en: 'Informative or corporate website with multiple pages',
    },
  },
  web_app: {
    es: 'Aplicación Web',
    en: 'Web Application',
    icon: '💻',
    description: {
      es: 'Aplicación interactiva con funcionalidades avanzadas',
      en: 'Interactive application with advanced features',
    },
  },
  mobile_app: {
    es: 'App Móvil',
    en: 'Mobile App',
    icon: '📱',
    description: {
      es: 'Aplicación nativa o híbrida para iOS y/o Android',
      en: 'Native or hybrid app for iOS and/or Android',
    },
  },
  ecommerce: {
    es: 'E-Commerce',
    en: 'E-Commerce',
    icon: '🛒',
    description: {
      es: 'Tienda en línea completa con carrito y pagos',
      en: 'Complete online store with cart and payments',
    },
  },
  saas: {
    es: 'SaaS',
    en: 'SaaS',
    icon: '☁️',
    description: {
      es: 'Software como servicio con suscripciones y multi-tenancy',
      en: 'Software as a Service with subscriptions and multi-tenancy',
    },
  },
  api: {
    es: 'API / Backend',
    en: 'API / Backend',
    icon: '⚙️',
    description: {
      es: 'Servicio backend, API REST o GraphQL',
      en: 'Backend service, REST or GraphQL API',
    },
  },
  game: {
    es: 'Videojuego',
    en: 'Video Game',
    icon: '🎮',
    description: {
      es: 'Juego web, móvil o de escritorio',
      en: 'Web, mobile, or desktop game',
    },
  },
  custom: {
    es: 'Proyecto Personalizado',
    en: 'Custom Project',
    icon: '✨',
    description: {
      es: 'Algo diferente que no encaja en las categorías anteriores',
      en: 'Something different that doesn\'t fit the categories above',
    },
  },
};
