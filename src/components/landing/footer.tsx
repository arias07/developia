'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

interface FooterProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    description: 'Transformamos ideas en software funcional usando inteligencia artificial.',
    services: {
      title: 'Servicios',
      items: [
        { label: 'Landing Pages', href: '#services' },
        { label: 'Aplicaciones Web', href: '#services' },
        { label: 'Apps Móviles', href: '#services' },
        { label: 'E-Commerce', href: '#services' },
        { label: 'SaaS', href: '#services' },
      ],
    },
    company: {
      title: 'Empresa',
      items: [
        { label: 'Sobre nosotros', href: '/about' },
        { label: 'Cómo funciona', href: '#how-it-works' },
        { label: 'Precios', href: '#pricing' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contacto', href: '/contact' },
      ],
    },
    legal: {
      title: 'Legal',
      items: [
        { label: 'Términos de servicio', href: '/terms' },
        { label: 'Política de privacidad', href: '/privacy' },
        { label: 'Política de reembolso', href: '/refund' },
      ],
    },
    rights: '© 2025 DevelopIA. Todos los derechos reservados.',
  },
  en: {
    description: 'We transform ideas into functional software using artificial intelligence.',
    services: {
      title: 'Services',
      items: [
        { label: 'Landing Pages', href: '#services' },
        { label: 'Web Applications', href: '#services' },
        { label: 'Mobile Apps', href: '#services' },
        { label: 'E-Commerce', href: '#services' },
        { label: 'SaaS', href: '#services' },
      ],
    },
    company: {
      title: 'Company',
      items: [
        { label: 'About us', href: '/about' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    legal: {
      title: 'Legal',
      items: [
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Refund Policy', href: '/refund' },
      ],
    },
    rights: '© 2025 DevelopIA. All rights reserved.',
  },
};

export function Footer({ lang }: FooterProps) {
  const t = content[lang];

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                DevelopIA
              </span>
            </Link>
            <p className="text-slate-400 mb-6 max-w-xs">{t.description}</p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com/developia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/developia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/developia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:hola@developia.com"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t.services.title}</h4>
            <ul className="space-y-3">
              {t.services.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t.company.title}</h4>
            <ul className="space-y-3">
              {t.company.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t.legal.title}</h4>
            <ul className="space-y-3">
              {t.legal.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-12 pt-8 text-center">
          <p className="text-slate-500 text-sm">{t.rights}</p>
        </div>
      </div>
    </footer>
  );
}
