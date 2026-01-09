'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { LocalizedLink } from '@/components/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  Palette,
  Rocket,
  DollarSign,
  Clock,
  Globe,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

const content = {
  es: {
    nav: {
      home: 'Inicio',
      apply: 'Aplicar ahora',
    },
    hero: {
      badge: 'Estamos contratando',
      title: 'Únete al equipo de',
      titleHighlight: 'Devvy',
      subtitle: 'Trabaja en proyectos innovadores, con flexibilidad total y pagos competitivos. Buscamos desarrolladores, diseñadores y especialistas tech.',
      cta: 'Aplicar ahora',
      ctaSecondary: 'Ver posiciones',
    },
    stats: [
      { value: '50+', label: 'Freelancers activos' },
      { value: '$45/hr', label: 'Pago promedio' },
      { value: '100%', label: 'Remoto' },
      { value: '24hrs', label: 'Respuesta' },
    ],
    benefits: {
      title: 'Por qué trabajar con nosotros',
      subtitle: 'Beneficios diseñados para freelancers',
      items: [
        {
          icon: DollarSign,
          title: 'Pagos competitivos',
          description: 'Tarifas por encima del mercado, pagos puntuales semanales o quincenales.',
        },
        {
          icon: Clock,
          title: 'Flexibilidad total',
          description: 'Trabaja cuando quieras, desde donde quieras. Sin horarios fijos.',
        },
        {
          icon: Globe,
          title: '100% Remoto',
          description: 'Trabaja desde cualquier parte del mundo. Solo necesitas internet.',
        },
        {
          icon: Rocket,
          title: 'Proyectos innovadores',
          description: 'Participa en proyectos de startups y empresas usando tecnología de punta.',
        },
        {
          icon: Users,
          title: 'Comunidad tech',
          description: 'Conecta con otros desarrolladores y aprende de los mejores.',
        },
        {
          icon: TrendingUp,
          title: 'Crecimiento',
          description: 'Acceso a capacitaciones, certificaciones y oportunidades de liderazgo.',
        },
      ],
    },
    positions: {
      title: 'Posiciones abiertas',
      subtitle: 'Encuentra tu lugar en Devvy',
      items: [
        {
          title: 'Full-Stack Developer',
          type: 'Freelance',
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          description: 'Desarrolla aplicaciones web completas usando tecnologías modernas.',
        },
        {
          title: 'Frontend Developer',
          type: 'Freelance',
          skills: ['React', 'Next.js', 'TailwindCSS'],
          description: 'Crea interfaces de usuario excepcionales y experiencias web.',
        },
        {
          title: 'Backend Developer',
          type: 'Freelance',
          skills: ['Node.js', 'Python', 'APIs', 'Databases'],
          description: 'Construye APIs robustas y sistemas escalables.',
        },
        {
          title: 'UI/UX Designer',
          type: 'Freelance',
          skills: ['Figma', 'User Research', 'Prototyping'],
          description: 'Diseña experiencias de usuario intuitivas y atractivas.',
        },
        {
          title: 'Mobile Developer',
          type: 'Freelance',
          skills: ['React Native', 'Flutter', 'iOS', 'Android'],
          description: 'Desarrolla aplicaciones móviles multiplataforma.',
        },
        {
          title: 'DevOps Engineer',
          type: 'Freelance',
          skills: ['AWS', 'Docker', 'CI/CD', 'Kubernetes'],
          description: 'Gestiona infraestructura y automatiza deployments.',
        },
      ],
    },
    process: {
      title: 'Proceso de aplicación',
      subtitle: 'Simple y rápido',
      steps: [
        {
          number: '01',
          title: 'Aplica',
          description: 'Completa el formulario con tu información y portafolio.',
        },
        {
          number: '02',
          title: 'Revisión',
          description: 'Revisamos tu perfil y experiencia en 24-48 horas.',
        },
        {
          number: '03',
          title: 'Entrevista',
          description: 'Una llamada corta para conocernos mejor.',
        },
        {
          number: '04',
          title: 'Onboarding',
          description: 'Te damos acceso a la plataforma y asignamos tu primer proyecto.',
        },
      ],
    },
    cta: {
      title: '¿Listo para empezar?',
      subtitle: 'Únete a nuestra comunidad de freelancers y trabaja en proyectos que importan.',
      button: 'Aplicar ahora',
    },
    footer: {
      copyright: '© 2024 Devvy. Todos los derechos reservados.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      apply: 'Apply now',
    },
    hero: {
      badge: "We're hiring",
      title: 'Join the',
      titleHighlight: 'Devvy',
      subtitle: 'Work on innovative projects with total flexibility and competitive pay. We are looking for developers, designers, and tech specialists.',
      cta: 'Apply now',
      ctaSecondary: 'View positions',
    },
    stats: [
      { value: '50+', label: 'Active freelancers' },
      { value: '$45/hr', label: 'Average pay' },
      { value: '100%', label: 'Remote' },
      { value: '24hrs', label: 'Response time' },
    ],
    benefits: {
      title: 'Why work with us',
      subtitle: 'Benefits designed for freelancers',
      items: [
        {
          icon: DollarSign,
          title: 'Competitive pay',
          description: 'Above-market rates, punctual weekly or bi-weekly payments.',
        },
        {
          icon: Clock,
          title: 'Total flexibility',
          description: 'Work when you want, from wherever you want. No fixed schedules.',
        },
        {
          icon: Globe,
          title: '100% Remote',
          description: 'Work from anywhere in the world. You just need internet.',
        },
        {
          icon: Rocket,
          title: 'Innovative projects',
          description: 'Participate in startup and enterprise projects using cutting-edge technology.',
        },
        {
          icon: Users,
          title: 'Tech community',
          description: 'Connect with other developers and learn from the best.',
        },
        {
          icon: TrendingUp,
          title: 'Growth',
          description: 'Access to training, certifications, and leadership opportunities.',
        },
      ],
    },
    positions: {
      title: 'Open positions',
      subtitle: 'Find your place at Devvy',
      items: [
        {
          title: 'Full-Stack Developer',
          type: 'Freelance',
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          description: 'Develop complete web applications using modern technologies.',
        },
        {
          title: 'Frontend Developer',
          type: 'Freelance',
          skills: ['React', 'Next.js', 'TailwindCSS'],
          description: 'Create exceptional user interfaces and web experiences.',
        },
        {
          title: 'Backend Developer',
          type: 'Freelance',
          skills: ['Node.js', 'Python', 'APIs', 'Databases'],
          description: 'Build robust APIs and scalable systems.',
        },
        {
          title: 'UI/UX Designer',
          type: 'Freelance',
          skills: ['Figma', 'User Research', 'Prototyping'],
          description: 'Design intuitive and attractive user experiences.',
        },
        {
          title: 'Mobile Developer',
          type: 'Freelance',
          skills: ['React Native', 'Flutter', 'iOS', 'Android'],
          description: 'Develop cross-platform mobile applications.',
        },
        {
          title: 'DevOps Engineer',
          type: 'Freelance',
          skills: ['AWS', 'Docker', 'CI/CD', 'Kubernetes'],
          description: 'Manage infrastructure and automate deployments.',
        },
      ],
    },
    process: {
      title: 'Application process',
      subtitle: 'Simple and fast',
      steps: [
        {
          number: '01',
          title: 'Apply',
          description: 'Complete the form with your information and portfolio.',
        },
        {
          number: '02',
          title: 'Review',
          description: 'We review your profile and experience within 24-48 hours.',
        },
        {
          number: '03',
          title: 'Interview',
          description: 'A short call to get to know each other better.',
        },
        {
          number: '04',
          title: 'Onboarding',
          description: 'We give you access to the platform and assign your first project.',
        },
      ],
    },
    cta: {
      title: 'Ready to start?',
      subtitle: 'Join our community of freelancers and work on projects that matter.',
      button: 'Apply now',
    },
    footer: {
      copyright: '© 2024 Devvy. All rights reserved.',
    },
  },
};

export default function CareersPage() {
  const locale = useLocale();
  const t = content[locale as keyof typeof content] || content.es;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <LocalizedLink href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Devvy
              </span>
            </LocalizedLink>
            <div className="flex items-center gap-4">
              <LocalizedLink href="/">
                <Button variant="ghost" className="text-slate-400 hover:text-white">
                  {t.nav.home}
                </Button>
              </LocalizedLink>
              <LocalizedLink href="/careers/apply">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                  {t.nav.apply}
                </Button>
              </LocalizedLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Zap className="w-3 h-3 mr-1" />
              {t.hero.badge}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              {t.hero.title}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <LocalizedLink href="/careers/apply">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                  {t.hero.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </LocalizedLink>
              <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800">
                {t.hero.ctaSecondary}
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {t.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.benefits.title}
            </h2>
            <p className="text-slate-400">{t.benefits.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.benefits.items.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 h-full hover:border-purple-500/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Positions Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.positions.title}
            </h2>
            <p className="text-slate-400">{t.positions.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.positions.items.map((position, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 h-full hover:border-cyan-500/50 transition-colors group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {position.title}
                        </h3>
                        <Badge variant="outline" className="mt-1 border-slate-600 text-slate-400">
                          {position.type}
                        </Badge>
                      </div>
                      <Briefcase className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm mb-4">{position.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {position.skills.map((skill, i) => (
                        <Badge key={i} className="bg-slate-700 text-slate-300 border-none text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.process.title}
            </h2>
            <p className="text-slate-400">{t.process.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {t.process.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-purple-500/30 mb-4">{step.number}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 rounded-2xl p-12 border border-purple-500/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.cta.title}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {t.cta.subtitle}
            </p>
            <LocalizedLink href="/careers/apply">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                {t.cta.button}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </LocalizedLink>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
