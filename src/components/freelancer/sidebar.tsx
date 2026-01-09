'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  DollarSign,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalizedLink } from '@/components/i18n';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, labelKey: 'dashboard', href: '/freelancer' },
  { icon: ClipboardList, labelKey: 'tasks', href: '/freelancer/tasks' },
  { icon: Clock, labelKey: 'timeTracking', href: '/freelancer/time' },
  { icon: DollarSign, labelKey: 'earnings', href: '/freelancer/earnings' },
  { icon: Star, labelKey: 'reviews', href: '/freelancer/reviews' },
  { icon: User, labelKey: 'profile', href: '/freelancer/profile' },
];

const bottomItems = [
  { icon: Settings, labelKey: 'settings', href: '/freelancer/settings' },
  { icon: HelpCircle, labelKey: 'help', href: '/help' },
];

interface FreelancerSidebarProps {
  onLogout: () => void;
}

const sidebarLabels: Record<string, Record<string, string>> = {
  es: {
    dashboard: 'Dashboard',
    tasks: 'Tareas',
    timeTracking: 'Tiempo',
    earnings: 'Ganancias',
    reviews: 'Reseñas',
    profile: 'Perfil',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Cerrar sesión',
  },
  en: {
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    timeTracking: 'Time Tracking',
    earnings: 'Earnings',
    reviews: 'Reviews',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    logout: 'Sign out',
  },
};

export function FreelancerSidebar({ onLogout }: FreelancerSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  const labels = sidebarLabels[locale] || sidebarLabels.es;

  const isActivePath = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    if (href === '/freelancer') {
      return pathname === localizedHref;
    }
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      className="fixed left-0 top-0 bottom-0 bg-slate-900 border-r border-slate-800 flex flex-col z-40"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <LocalizedLink href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Devvy Freelancer
            </span>
          </LocalizedLink>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <LocalizedLink key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="font-medium">{labels[item.labelKey]}</span>}
              </div>
            </LocalizedLink>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="py-4 px-2 border-t border-slate-800 space-y-1">
        {bottomItems.map((item) => (
          <LocalizedLink key={item.href} href={item.href}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">{labels[item.labelKey]}</span>}
            </div>
          </LocalizedLink>
        ))}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">{labels.logout}</span>}
        </button>
      </div>
    </motion.aside>
  );
}
