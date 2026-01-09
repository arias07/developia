'use client';

import { Search, Plus } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { LocalizedLink, LanguageSwitcher } from '@/components/i18n';
import type { Profile } from '@/types/database';

interface HeaderProps {
  profile: Profile | null;
  onLogout: () => void;
}

const headerLabels: Record<string, Record<string, string>> = {
  es: {
    search: 'Buscar proyectos, documentos...',
    newProject: 'Nuevo proyecto',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Cerrar sesión',
  },
  en: {
    search: 'Search projects, documents...',
    newProject: 'New project',
    settings: 'Settings',
    help: 'Help',
    logout: 'Sign out',
  },
};

export function Header({ profile, onLogout }: HeaderProps) {
  const locale = useLocale();
  const labels = headerLabels[locale] || headerLabels.es;

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder={labels.search}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 w-full"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* New project button */}
        <LocalizedLink href="/funnel">
          <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            {labels.newProject}
          </Button>
        </LocalizedLink>

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <NotificationBell />

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback className="bg-purple-600 text-white">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700" align="end">
            <DropdownMenuLabel className="text-white">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-slate-400">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem asChild>
              <LocalizedLink href="/dashboard/settings" className="text-slate-300 hover:text-white cursor-pointer">
                {labels.settings}
              </LocalizedLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <LocalizedLink href="/help" className="text-slate-300 hover:text-white cursor-pointer">
                {labels.help}
              </LocalizedLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 cursor-pointer"
            >
              {labels.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
