'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Building,
  Globe,
  Bell,
  Shield,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { user, profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    timezone: 'America/Mexico_City',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        timezone: profile.timezone || 'America/Mexico_City',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const supabase = getSupabaseClient();
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          company: formData.company,
          timezone: formData.timezone,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update profile in store
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    client: 'Cliente',
    admin: 'Administrador',
    project_manager: 'Project Manager',
    developer: 'Desarrollador',
    designer: 'Diseñador',
  };

  const roleBadgeColors: Record<string, string> = {
    client: 'bg-blue-500',
    admin: 'bg-red-500',
    project_manager: 'bg-purple-500',
    developer: 'bg-green-500',
    designer: 'bg-pink-500',
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400">Administra tu perfil y preferencias</p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Información personal</CardTitle>
                  <CardDescription>Actualiza tus datos de perfil</CardDescription>
                </div>
              </div>
              {profile?.role && (
                <Badge className={`${roleBadgeColors[profile.role]} text-white border-none`}>
                  {roleLabels[profile.role] || profile.role}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white">
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-slate-800/50 border-slate-700 text-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-500">El email no se puede cambiar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  Teléfono
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    placeholder="+52 33 1234 5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-white">
                  Empresa
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    placeholder="Nombre de tu empresa"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-800" />

            <div className="flex items-center justify-between">
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {saved && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  Cambios guardados
                </div>
              )}
              {!error && !saved && <div />}

              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-white">Cuenta</CardTitle>
                <CardDescription>Información de tu cuenta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">ID de usuario</p>
                <p className="text-white font-mono text-sm">{user?.id}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Miembro desde</p>
                <p className="text-white">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Bell className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-white">Notificaciones</CardTitle>
                <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm">
              Las preferencias de notificaciones estarán disponibles próximamente.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
