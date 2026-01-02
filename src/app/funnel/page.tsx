'use client';

import { useState } from 'react';
import { FunnelLayout } from '@/components/funnel/funnel-layout';
import {
  StepProjectInfo,
  StepAudience,
  StepFeatures,
  StepDesign,
  StepTechnical,
  StepTimeline,
  StepSummary,
} from '@/components/funnel/steps';
import { useFunnelStore } from '@/stores/funnel-store';

function getInitialLang(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es';

  const storedLang = localStorage.getItem('developia-lang');
  if (storedLang === 'es' || storedLang === 'en') {
    return storedLang;
  }

  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('en') ? 'en' : 'es';
}

export default function FunnelPage() {
  const [lang] = useState<'es' | 'en'>(getInitialLang);
  const { currentStep } = useFunnelStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepProjectInfo lang={lang} />;
      case 2:
        return <StepAudience lang={lang} />;
      case 3:
        return <StepFeatures lang={lang} />;
      case 4:
        return <StepDesign lang={lang} />;
      case 5:
        return <StepTechnical lang={lang} />;
      case 6:
        return <StepTimeline lang={lang} />;
      case 7:
        return <StepSummary lang={lang} />;
      default:
        return <StepProjectInfo lang={lang} />;
    }
  };

  return <FunnelLayout lang={lang}>{renderStep()}</FunnelLayout>;
}
