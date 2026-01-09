'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  MessageSquare,
  Book,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  FileText,
  Video,
  Zap,
  Shield,
  CreditCard,
  Code,
  Users,
  Rocket,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LocalizedLink } from '@/components/i18n';

const content = {
  es: {
    title: 'Centro de Ayuda',
    subtitle: 'Encuentra respuestas a tus preguntas',
    searchPlaceholder: 'Buscar en el centro de ayuda...',
    categories: {
      title: 'Categorías',
      gettingStarted: 'Comenzando',
      projects: 'Proyectos',
      payments: 'Pagos',
      technical: 'Técnico',
      account: 'Cuenta',
      freelancer: 'Freelancer',
    },
    faq: {
      title: 'Preguntas Frecuentes',
      q1: '¿Cómo funciona el proceso de desarrollo?',
      a1: 'Nuestro proceso es simple: 1) Describes tu proyecto en el formulario, 2) Recibe una cotización instantánea, 3) Realiza el pago, 4) Nuestro equipo desarrolla tu proyecto, 5) Recibe tu proyecto desplegado y el código fuente.',
      q2: '¿Cuánto tiempo tarda en completarse un proyecto?',
      a2: 'El tiempo varía según la complejidad. Landing pages: 1-3 días, Sitios web: 3-7 días, Aplicaciones web: 1-4 semanas, Apps móviles: 2-8 semanas. Recibirás una estimación específica en tu cotización.',
      q3: '¿Qué incluye el precio?',
      a3: 'Incluye: desarrollo completo, código fuente, despliegue inicial, 30 días de garantía para corrección de bugs, documentación básica, y repositorio Git con tu código.',
      q4: '¿Puedo solicitar cambios después de la entrega?',
      a4: 'Sí, durante los primeros 30 días tienes garantía de corrección de bugs sin costo. Para cambios adicionales o nuevas funcionalidades, puedes solicitar una cotización adicional.',
      q5: '¿Qué métodos de pago aceptan?',
      a5: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, AMEX), PayPal, y transferencias bancarias para proyectos mayores a $5,000 USD.',
      q6: '¿Cómo me convierto en freelancer de Devvy?',
      a6: 'Ve a la sección de "Carreras", completa el formulario de aplicación con tu portafolio y experiencia. Nuestro equipo revisará tu aplicación y te contactará si cumples con los requisitos.',
      q7: '¿Ofrecen mantenimiento continuo?',
      a7: 'Sí, ofrecemos planes de mantenimiento mensual que incluyen actualizaciones, monitoreo, backups y soporte prioritario. Los precios varían según el proyecto.',
      q8: '¿Qué tecnologías utilizan?',
      a8: 'Trabajamos con las tecnologías más modernas: React, Next.js, Node.js, TypeScript, PostgreSQL, Supabase, y más. Elegimos la mejor stack según las necesidades de tu proyecto.',
    },
    contact: {
      title: 'Contacto',
      subtitle: '¿No encontraste lo que buscabas? Contáctanos',
      email: 'Email de soporte',
      phone: 'Teléfono',
      hours: 'Horario de atención',
      hoursValue: 'Lunes a Viernes, 9am - 6pm (CST)',
      responseTime: 'Tiempo de respuesta: menos de 24 horas',
    },
    resources: {
      title: 'Recursos',
      docs: 'Documentación',
      docsDesc: 'Guías detalladas y tutoriales',
      api: 'API Reference',
      apiDesc: 'Documentación técnica de la API',
      videos: 'Video Tutoriales',
      videosDesc: 'Aprende con videos paso a paso',
      status: 'Estado del Sistema',
      statusDesc: 'Verifica el estado de nuestros servicios',
    },
    quickActions: {
      title: 'Acciones Rápidas',
      newProject: 'Iniciar Proyecto',
      viewProjects: 'Ver Mis Proyectos',
      contactSupport: 'Contactar Soporte',
    },
  },
  en: {
    title: 'Help Center',
    subtitle: 'Find answers to your questions',
    searchPlaceholder: 'Search help center...',
    categories: {
      title: 'Categories',
      gettingStarted: 'Getting Started',
      projects: 'Projects',
      payments: 'Payments',
      technical: 'Technical',
      account: 'Account',
      freelancer: 'Freelancer',
    },
    faq: {
      title: 'Frequently Asked Questions',
      q1: 'How does the development process work?',
      a1: 'Our process is simple: 1) Describe your project in the form, 2) Receive an instant quote, 3) Make payment, 4) Our team develops your project, 5) Receive your deployed project and source code.',
      q2: 'How long does it take to complete a project?',
      a2: 'Time varies by complexity. Landing pages: 1-3 days, Websites: 3-7 days, Web apps: 1-4 weeks, Mobile apps: 2-8 weeks. You will receive a specific estimate in your quote.',
      q3: "What's included in the price?",
      a3: 'Includes: complete development, source code, initial deployment, 30-day bug fix warranty, basic documentation, and Git repository with your code.',
      q4: 'Can I request changes after delivery?',
      a4: 'Yes, during the first 30 days you have a bug fix warranty at no cost. For additional changes or new features, you can request an additional quote.',
      q5: 'What payment methods do you accept?',
      a5: 'We accept credit/debit cards (Visa, Mastercard, AMEX), PayPal, and bank transfers for projects over $5,000 USD.',
      q6: 'How do I become a Devvy freelancer?',
      a6: 'Go to the "Careers" section, complete the application form with your portfolio and experience. Our team will review your application and contact you if you meet the requirements.',
      q7: 'Do you offer ongoing maintenance?',
      a7: 'Yes, we offer monthly maintenance plans that include updates, monitoring, backups, and priority support. Prices vary by project.',
      q8: 'What technologies do you use?',
      a8: 'We work with the most modern technologies: React, Next.js, Node.js, TypeScript, PostgreSQL, Supabase, and more. We choose the best stack based on your project needs.',
    },
    contact: {
      title: 'Contact',
      subtitle: "Didn't find what you were looking for? Contact us",
      email: 'Support email',
      phone: 'Phone',
      hours: 'Business hours',
      hoursValue: 'Monday to Friday, 9am - 6pm (CST)',
      responseTime: 'Response time: less than 24 hours',
    },
    resources: {
      title: 'Resources',
      docs: 'Documentation',
      docsDesc: 'Detailed guides and tutorials',
      api: 'API Reference',
      apiDesc: 'Technical API documentation',
      videos: 'Video Tutorials',
      videosDesc: 'Learn with step-by-step videos',
      status: 'System Status',
      statusDesc: 'Check the status of our services',
    },
    quickActions: {
      title: 'Quick Actions',
      newProject: 'Start Project',
      viewProjects: 'View My Projects',
      contactSupport: 'Contact Support',
    },
  },
};

const categoryIcons = {
  gettingStarted: Rocket,
  projects: Code,
  payments: CreditCard,
  technical: Zap,
  account: Shield,
  freelancer: Users,
};

export default function HelpPage() {
  const locale = useLocale();
  const t = content[locale as keyof typeof content] || content.es;
  const [searchQuery, setSearchQuery] = useState('');

  const faqItems = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
    { q: t.faq.q6, a: t.faq.a6 },
    { q: t.faq.q7, a: t.faq.a7 },
    { q: t.faq.q8, a: t.faq.a8 },
  ];

  const filteredFaq = searchQuery
    ? faqItems.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400 text-lg">{t.subtitle}</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-12 py-6 bg-slate-800/50 border-slate-700 text-white text-lg"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold text-white mb-6">{t.categories.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(categoryIcons).map(([key, Icon]) => (
              <Card
                key={key}
                className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-sm text-white">
                    {t.categories[key as keyof typeof t.categories]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  {t.faq.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredFaq.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No se encontraron resultados para &quot;{searchQuery}&quot;
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFaq.map((item, index) => (
                      <AccordionItem
                        key={index}
                        value={`item-${index}`}
                        className="border border-slate-700 rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-white hover:text-purple-400 text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-400">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">{t.quickActions.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <LocalizedLink href="/funnel">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 justify-start">
                    <Rocket className="w-4 h-4 mr-2" />
                    {t.quickActions.newProject}
                  </Button>
                </LocalizedLink>
                <LocalizedLink href="/dashboard/projects">
                  <Button variant="outline" className="w-full border-slate-600 justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {t.quickActions.viewProjects}
                  </Button>
                </LocalizedLink>
                <Button
                  variant="outline"
                  className="w-full border-slate-600 justify-start"
                  onClick={() =>
                    (window.location.href = `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte@devvy.tech'}`)
                  }
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t.quickActions.contactSupport}
                </Button>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">{t.resources.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <a
                  href="#"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <Book className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{t.resources.docs}</p>
                    <p className="text-sm text-slate-400">{t.resources.docsDesc}</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <Code className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{t.resources.api}</p>
                    <p className="text-sm text-slate-400">{t.resources.apiDesc}</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <Video className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{t.resources.videos}</p>
                    <p className="text-sm text-slate-400">{t.resources.videosDesc}</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">{t.contact.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">{t.contact.subtitle}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs text-slate-500">{t.contact.email}</p>
                      <p className="text-white">soporte@devvy.tech</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs text-slate-500">{t.contact.hours}</p>
                      <p className="text-white">{t.contact.hoursValue}</p>
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                  {t.contact.responseTime}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
