'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Bell,
  Shield,
  CreditCard,
  Clock,
  Globe,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { FreelancerProfile } from '@/types/database';

const content = {
  es: {
    title: 'Configuración',
    subtitle: 'Administra tus preferencias y configuración de cuenta',
    sections: {
      availability: {
        title: 'Disponibilidad',
        description: 'Configura tu disponibilidad para recibir tareas',
        status: 'Estado de disponibilidad',
        hours: 'Horas disponibles por semana',
        statusOptions: {
          available: 'Disponible',
          busy: 'Ocupado',
          unavailable: 'No disponible',
        },
      },
      notifications: {
        title: 'Notificaciones',
        description: 'Configura cómo recibes las notificaciones',
        email: 'Notificaciones por email',
        emailDesc: 'Recibe actualizaciones de tareas y pagos',
        browser: 'Notificaciones del navegador',
        browserDesc: 'Alertas en tiempo real',
        tasks: 'Nuevas tareas',
        tasksDesc: 'Notificarme cuando haya tareas disponibles',
        payments: 'Pagos',
        paymentsDesc: 'Notificarme sobre pagos procesados',
      },
      payment: {
        title: 'Método de Pago',
        description: 'Configura cómo recibes tus pagos',
        method: 'Método preferido',
        methodOptions: {
          paypal: 'PayPal',
          bank_transfer: 'Transferencia bancaria',
          wise: 'Wise',
        },
        details: 'Detalles de pago',
        detailsPlaceholder: 'Email de PayPal o datos bancarios',
      },
      timezone: {
        title: 'Zona Horaria',
        description: 'Configura tu zona horaria para mejor coordinación',
        timezone: 'Tu zona horaria',
      },
      language: {
        title: 'Idioma',
        description: 'Selecciona tu idioma preferido',
        language: 'Idioma de la interfaz',
      },
      security: {
        title: 'Seguridad',
        description: 'Opciones de seguridad de tu cuenta',
        changePassword: 'Cambiar contraseña',
        twoFactor: 'Autenticación de dos factores',
        twoFactorDesc: 'Añade una capa extra de seguridad',
      },
    },
    buttons: {
      save: 'Guardar cambios',
      saving: 'Guardando...',
    },
    messages: {
      saved: 'Configuración guardada',
    },
  },
  en: {
    title: 'Settings',
    subtitle: 'Manage your preferences and account settings',
    sections: {
      availability: {
        title: 'Availability',
        description: 'Configure your availability to receive tasks',
        status: 'Availability status',
        hours: 'Hours available per week',
        statusOptions: {
          available: 'Available',
          busy: 'Busy',
          unavailable: 'Unavailable',
        },
      },
      notifications: {
        title: 'Notifications',
        description: 'Configure how you receive notifications',
        email: 'Email notifications',
        emailDesc: 'Receive task and payment updates',
        browser: 'Browser notifications',
        browserDesc: 'Real-time alerts',
        tasks: 'New tasks',
        tasksDesc: 'Notify me when tasks are available',
        payments: 'Payments',
        paymentsDesc: 'Notify me about processed payments',
      },
      payment: {
        title: 'Payment Method',
        description: 'Configure how you receive payments',
        method: 'Preferred method',
        methodOptions: {
          paypal: 'PayPal',
          bank_transfer: 'Bank transfer',
          wise: 'Wise',
        },
        details: 'Payment details',
        detailsPlaceholder: 'PayPal email or bank details',
      },
      timezone: {
        title: 'Timezone',
        description: 'Set your timezone for better coordination',
        timezone: 'Your timezone',
      },
      language: {
        title: 'Language',
        description: 'Select your preferred language',
        language: 'Interface language',
      },
      security: {
        title: 'Security',
        description: 'Account security options',
        changePassword: 'Change password',
        twoFactor: 'Two-factor authentication',
        twoFactorDesc: 'Add an extra layer of security',
      },
    },
    buttons: {
      save: 'Save changes',
      saving: 'Saving...',
    },
    messages: {
      saved: 'Settings saved',
    },
  },
};

const timezones = [
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Denver',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Sao_Paulo',
  'Europe/Madrid',
  'Europe/London',
  'UTC',
];

export default function FreelancerSettingsPage() {
  const locale = useLocale();
  const t = content[locale as keyof typeof content] || content.es;
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    availability: 'available',
    weeklyHours: 40,
    emailNotifications: true,
    browserNotifications: true,
    taskNotifications: true,
    paymentNotifications: true,
    paymentMethod: 'paypal',
    paymentDetails: '',
    timezone: 'America/Mexico_City',
    language: locale,
    twoFactor: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data as FreelancerProfile);
        setSettings((prev) => ({
          ...prev,
          availability: data.availability || 'available',
          weeklyHours: data.weekly_hours_available || 40,
          paymentMethod: data.payment_method || 'paypal',
          paymentDetails: data.payment_details || '',
          timezone: data.timezone || 'America/Mexico_City',
        }));
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    const supabase = getSupabaseClient();

    await supabase
      .from('freelancer_profiles')
      .update({
        availability: settings.availability,
        weekly_hours_available: settings.weeklyHours,
        payment_method: settings.paymentMethod,
        payment_details: settings.paymentDetails,
        timezone: settings.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-emerald-400" />
            {t.title}
          </h1>
          <p className="text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? t.buttons.saving : saved ? t.messages.saved : t.buttons.save}
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Availability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                {t.sections.availability.title}
              </CardTitle>
              <CardDescription>{t.sections.availability.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.sections.availability.status}</Label>
                <Select
                  value={settings.availability}
                  onValueChange={(v) => setSettings({ ...settings, availability: v })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">
                      {t.sections.availability.statusOptions.available}
                    </SelectItem>
                    <SelectItem value="busy">
                      {t.sections.availability.statusOptions.busy}
                    </SelectItem>
                    <SelectItem value="unavailable">
                      {t.sections.availability.statusOptions.unavailable}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.sections.availability.hours}</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={settings.weeklyHours}
                  onChange={(e) =>
                    setSettings({ ...settings, weeklyHours: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-900 border-slate-700"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                {t.sections.notifications.title}
              </CardTitle>
              <CardDescription>{t.sections.notifications.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">{t.sections.notifications.email}</p>
                  <p className="text-sm text-slate-400">{t.sections.notifications.emailDesc}</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">{t.sections.notifications.browser}</p>
                  <p className="text-sm text-slate-400">{t.sections.notifications.browserDesc}</p>
                </div>
                <Switch
                  checked={settings.browserNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, browserNotifications: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">{t.sections.notifications.tasks}</p>
                  <p className="text-sm text-slate-400">{t.sections.notifications.tasksDesc}</p>
                </div>
                <Switch
                  checked={settings.taskNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, taskNotifications: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">{t.sections.notifications.payments}</p>
                  <p className="text-sm text-slate-400">{t.sections.notifications.paymentsDesc}</p>
                </div>
                <Switch
                  checked={settings.paymentNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, paymentNotifications: v })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                {t.sections.payment.title}
              </CardTitle>
              <CardDescription>{t.sections.payment.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.sections.payment.method}</Label>
                <Select
                  value={settings.paymentMethod}
                  onValueChange={(v) => setSettings({ ...settings, paymentMethod: v })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">
                      {t.sections.payment.methodOptions.paypal}
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      {t.sections.payment.methodOptions.bank_transfer}
                    </SelectItem>
                    <SelectItem value="wise">
                      {t.sections.payment.methodOptions.wise}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.sections.payment.details}</Label>
                <Input
                  value={settings.paymentDetails}
                  onChange={(e) => setSettings({ ...settings, paymentDetails: e.target.value })}
                  placeholder={t.sections.payment.detailsPlaceholder}
                  className="bg-slate-900 border-slate-700"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timezone & Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                {t.sections.timezone.title} & {t.sections.language.title}
              </CardTitle>
              <CardDescription>{t.sections.timezone.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.sections.timezone.timezone}</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(v) => setSettings({ ...settings, timezone: v })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.sections.language.language}</Label>
                <Select
                  value={settings.language}
                  onValueChange={(v) => setSettings({ ...settings, language: v })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                {t.sections.security.title}
              </CardTitle>
              <CardDescription>{t.sections.security.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">{t.sections.security.twoFactor}</p>
                  <p className="text-sm text-slate-400">{t.sections.security.twoFactorDesc}</p>
                </div>
                <Switch
                  checked={settings.twoFactor}
                  onCheckedChange={(v) => setSettings({ ...settings, twoFactor: v })}
                />
              </div>

              <Button variant="outline" className="border-slate-700">
                {t.sections.security.changePassword}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
