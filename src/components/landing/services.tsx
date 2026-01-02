'use client';

import { motion } from 'framer-motion';
import { Globe, Smartphone, ShoppingCart, Cloud, Gamepad2, Cog, Palette, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ServicesProps {
  lang: 'es' | 'en';
}

const content = {
  es: {
    title: 'Lo que podemos crear',
    subtitle: 'Desde landing pages hasta aplicaciones empresariales complejas',
    services: [
      {
        icon: Globe,
        title: 'Landing Pages',
        description: 'Páginas de aterrizaje optimizadas para convertir visitantes en clientes.',
        price: 'Desde $299 USD',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: Globe,
        title: 'Sitios Web',
        description: 'Sitios corporativos, portafolios, blogs con CMS integrado.',
        price: 'Desde $799 USD',
        color: 'from-purple-500 to-pink-500',
      },
      {
        icon: Smartphone,
        title: 'Apps Móviles',
        description: 'Aplicaciones iOS y Android nativas o híbridas.',
        price: 'Desde $2,499 USD',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: ShoppingCart,
        title: 'E-Commerce',
        description: 'Tiendas online completas con carrito, pagos y gestión de inventario.',
        price: 'Desde $1,499 USD',
        color: 'from-orange-500 to-amber-500',
      },
      {
        icon: Cloud,
        title: 'SaaS',
        description: 'Plataformas completas con suscripciones, multi-tenancy y dashboards.',
        price: 'Desde $4,999 USD',
        color: 'from-violet-500 to-purple-500',
      },
      {
        icon: Cog,
        title: 'APIs & Backend',
        description: 'Servicios backend robustos, APIs REST o GraphQL.',
        price: 'Desde $999 USD',
        color: 'from-slate-500 to-zinc-500',
      },
      {
        icon: Gamepad2,
        title: 'Videojuegos',
        description: 'Juegos web, móviles o de escritorio con Unity o web technologies.',
        price: 'Desde $2,999 USD',
        color: 'from-red-500 to-rose-500',
      },
      {
        icon: Palette,
        title: 'Diseño UI/UX',
        description: 'Interfaces modernas, sistemas de diseño y prototipos interactivos.',
        price: 'Desde $499 USD',
        color: 'from-pink-500 to-fuchsia-500',
      },
    ],
  },
  en: {
    title: 'What we can create',
    subtitle: 'From landing pages to complex enterprise applications',
    services: [
      {
        icon: Globe,
        title: 'Landing Pages',
        description: 'Landing pages optimized to convert visitors into customers.',
        price: 'From $299 USD',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: Globe,
        title: 'Websites',
        description: 'Corporate sites, portfolios, blogs with integrated CMS.',
        price: 'From $799 USD',
        color: 'from-purple-500 to-pink-500',
      },
      {
        icon: Smartphone,
        title: 'Mobile Apps',
        description: 'Native or hybrid iOS and Android applications.',
        price: 'From $2,499 USD',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: ShoppingCart,
        title: 'E-Commerce',
        description: 'Complete online stores with cart, payments, and inventory.',
        price: 'From $1,499 USD',
        color: 'from-orange-500 to-amber-500',
      },
      {
        icon: Cloud,
        title: 'SaaS',
        description: 'Complete platforms with subscriptions, multi-tenancy, and dashboards.',
        price: 'From $4,999 USD',
        color: 'from-violet-500 to-purple-500',
      },
      {
        icon: Cog,
        title: 'APIs & Backend',
        description: 'Robust backend services, REST or GraphQL APIs.',
        price: 'From $999 USD',
        color: 'from-slate-500 to-zinc-500',
      },
      {
        icon: Gamepad2,
        title: 'Video Games',
        description: 'Web, mobile, or desktop games with Unity or web technologies.',
        price: 'From $2,999 USD',
        color: 'from-red-500 to-rose-500',
      },
      {
        icon: Palette,
        title: 'UI/UX Design',
        description: 'Modern interfaces, design systems, and interactive prototypes.',
        price: 'From $499 USD',
        color: 'from-pink-500 to-fuchsia-500',
      },
    ],
  },
};

export function Services({ lang }: ServicesProps) {
  const t = content[lang];

  return (
    <section id="services" className="py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            {t.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            {t.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {t.services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 h-full group cursor-pointer hover:-translate-y-1">
                <CardContent className="p-6">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.color} p-0.5 mb-4`}
                  >
                    <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{service.description}</p>

                  {/* Price */}
                  <div className={`text-sm font-semibold bg-gradient-to-r ${service.color} bg-clip-text text-transparent`}>
                    {service.price}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
