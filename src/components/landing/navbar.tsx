'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  lang: 'es' | 'en';
  onLanguageChange?: (lang: 'es' | 'en') => void;
}

const content = {
  es: {
    nav: [
      { label: 'Servicios', href: '#services' },
      { label: 'Cómo funciona', href: '#how-it-works' },
      { label: 'Precios', href: '#pricing' },
      { label: 'Consultoría', href: '/consultation' },
    ],
    login: 'Iniciar sesión',
    cta: 'Comenzar proyecto',
  },
  en: {
    nav: [
      { label: 'Services', href: '#services' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Consulting', href: '/consultation' },
    ],
    login: 'Log in',
    cta: 'Start project',
  },
};

export function Navbar({ lang, onLanguageChange }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = content[lang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Devvy
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {t.nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Globe className="w-4 h-4 mr-1" />
                    {lang.toUpperCase()}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                  <DropdownMenuItem
                    onClick={() => onLanguageChange?.('es')}
                    className="text-slate-300 hover:text-white focus:text-white cursor-pointer"
                  >
                    🇲🇽 Español
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onLanguageChange?.('en')}
                    className="text-slate-300 hover:text-white focus:text-white cursor-pointer"
                  >
                    🇺🇸 English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  {t.login}
                </Button>
              </Link>

              <Link href="/funnel">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white">
                  {t.cta}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl pt-20">
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-6">
                  {t.nav.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xl text-slate-300 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div className="border-t border-slate-800 pt-6 mt-4">
                    <div className="flex gap-4 mb-6">
                      <button
                        onClick={() => {
                          onLanguageChange?.('es');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          lang === 'es'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Español
                      </button>
                      <button
                        onClick={() => {
                          onLanguageChange?.('en');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          lang === 'en'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        English
                      </button>
                    </div>

                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full mb-4 border-slate-700">
                        {t.login}
                      </Button>
                    </Link>

                    <Link href="/funnel" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
                        {t.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
