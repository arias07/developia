'use client';

import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalizedLink } from '@/components/i18n';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const menuItems = [
  { icon: LayoutDashboard, labelKey: 'dashboard', href: '/dashboard' },
  { icon: FolderKanban, labelKey: 'projects', href: '/dashboard/projects' },
  { icon: Bell, labelKey: 'notifications', href: '/dashboard/notifications' },
  { icon: Settings, labelKey: 'settings', href: '/dashboard/settings' },
];

const bottomItems = [
  { icon: HelpCircle, labelKey: 'help', href: '/help' },
];

const adminRoles = ['admin', 'project_manager', 'developer', 'designer', 'consultant'];

interface SidebarProps {
  onLogout: () => void;
}

const sidebarLabels: Record<string, Record<string, string>> = {
  es: {
    dashboard: 'Dashboard',
    projects: 'Proyectos',
    notifications: 'Notificaciones',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Cerrar sesión',
    admin: 'Panel Admin',
  },
  en: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    notifications: 'Notifications',
    settings: 'Settings',
    help: 'Help',
    logout: 'Sign out',
    admin: 'Admin Panel',
  },
};

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useAuthStore();

  const labels = sidebarLabels[locale] || sidebarLabels.es;
  const isAdmin = profile?.role && adminRoles.includes(profile.role);

  // Check if path matches (accounting for locale prefix)
  const isActivePath = (href: string) => {
    const localizedHref = `/${locale}${href}`;
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
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Devvy
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
                    ? 'bg-purple-600/20 text-purple-400'
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

        {/* Admin Panel Link - Only visible to admin roles */}
        {isAdmin && (
          <LocalizedLink href="/admin">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all">
              <Shield className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">{labels.admin}</span>}
            </div>
          </LocalizedLink>
        )}

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
