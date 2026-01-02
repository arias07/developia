'use client';

import { useState } from 'react';
import { Navbar, Hero, HowItWorks, Services, Pricing, CTA, Footer } from '@/components/landing';

function getInitialLang(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es';

  const storedLang = localStorage.getItem('developia-lang');
  if (storedLang === 'es' || storedLang === 'en') {
    return storedLang;
  }

  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('en') ? 'en' : 'es';
}

export default function Home() {
  const [lang, setLang] = useState<'es' | 'en'>(getInitialLang);

  const handleLanguageChange = (newLang: 'es' | 'en') => {
    setLang(newLang);
    localStorage.setItem('developia-lang', newLang);
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar lang={lang} onLanguageChange={handleLanguageChange} />
      <Hero lang={lang} />
      <HowItWorks lang={lang} />
      <Services lang={lang} />
      <Pricing lang={lang} />
      <CTA lang={lang} />
      <Footer lang={lang} />
    </main>
  );
}
