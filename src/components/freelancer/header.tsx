'use client';

import { Search, Bell } from 'lucide-react';
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
import { LocalizedLink, LanguageSwitcher } from '@/components/i18n';
import { Badge } from '@/components/ui/badge';
import type { FreelancerProfile } from '@/types/database';

interface FreelancerHeaderProps {
  profile: FreelancerProfile | null;
  onLogout: () => void;
}

const headerLabels: Record<string, Record<string, string>> = {
  es: {
    search: 'Buscar tareas, proyectos...',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Cerrar sesión',
    available: 'Disponible',
    busy: 'Ocupado',
    unavailable: 'No disponible',
  },
  en: {
    search: 'Search tasks, projects...',
    settings: 'Settings',
    help: 'Help',
    logout: 'Sign out',
    available: 'Available',
    busy: 'Busy',
    unavailable: 'Unavailable',
  },
};

const availabilityColors: Record<string, string> = {
  available: 'bg-emerald-500',
  busy: 'bg-yellow-500',
  unavailable: 'bg-red-500',
};

export function FreelancerHeader({ profile, onLogout }: FreelancerHeaderProps) {
  const locale = useLocale();
  const labels = headerLabels[locale] || headerLabels.es;

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'FL';

  const availabilityLabel = profile?.availability
    ? labels[profile.availability]
    : labels.available;

  const availabilityColor = profile?.availability
    ? availabilityColors[profile.availability]
    : availabilityColors.available;

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
        {/* Availability badge */}
        <Badge variant="outline" className="border-slate-700 text-slate-300">
          <span className={`w-2 h-2 rounded-full ${availabilityColor} mr-2`} />
          {availabilityLabel}
        </Badge>

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback className="bg-emerald-600 text-white">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700" align="end">
            <DropdownMenuLabel className="text-white">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-slate-400">{profile?.email}</p>
                {profile?.title && (
                  <p className="text-xs text-emerald-400">{profile.title}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem asChild>
              <LocalizedLink href="/freelancer/profile" className="text-slate-300 hover:text-white cursor-pointer">
                Perfil
              </LocalizedLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <LocalizedLink href="/freelancer/settings" className="text-slate-300 hover:text-white cursor-pointer">
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
