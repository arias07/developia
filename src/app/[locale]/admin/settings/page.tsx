'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Bell,
  Shield,
  CreditCard,
  Mail,
  Globe,
  Key,
  Database,
  Cloud,
  Check,
  Loader2,
  AlertCircle,
  Webhook,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsState {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    timezone: string;
  };
  notifications: {
    emailNotifications: boolean;
    slackNotifications: boolean;
    webhookUrl: string;
    notifyOnNewProject: boolean;
    notifyOnPayment: boolean;
    notifyOnEscalation: boolean;
  };
  integrations: {
    stripeEnabled: boolean;
    stripeTestMode: boolean;
    resendEnabled: boolean;
    githubEnabled: boolean;
    vercelEnabled: boolean;
    openaiEnabled: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    ipWhitelist: string;
  };
}

const defaultSettings: SettingsState = {
  general: {
    siteName: 'Devvy',
    siteUrl: 'https://devvy.tech',
    supportEmail: 'soporte@devvy.tech',
    timezone: 'America/Mexico_City',
  },
  notifications: {
    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: '',
    notifyOnNewProject: true,
    notifyOnPayment: true,
    notifyOnEscalation: true,
  },
  integrations: {
    stripeEnabled: true,
    stripeTestMode: true,
    resendEnabled: true,
    githubEnabled: true,
    vercelEnabled: true,
    openaiEnabled: true,
  },
  security: {
    twoFactorRequired: false,
    sessionTimeout: 24,
    ipWhitelist: '',
  },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Fetch settings from API on mount
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        // Merge with defaults to ensure all fields exist
        setSettings({
          general: { ...defaultSettings.general, ...data.general },
          notifications: { ...defaultSettings.notifications, ...data.notifications },
          integrations: { ...defaultSettings.integrations, ...data.integrations },
          security: { ...defaultSettings.security, ...data.security },
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Configuracion guardada correctamente');
      } else {
        toast.error('Error al guardar la configuracion');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuracion');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    category: keyof SettingsState,
    key: string,
    value: string | boolean | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuracion</h1>
          <p className="text-slate-400">Administra la configuracion de la plataforma</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-700 text-slate-300">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700 text-slate-300">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-slate-700 text-slate-300">
            <Cloud className="w-4 h-4 mr-2" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700 text-slate-300">
            <Shield className="w-4 h-4 mr-2" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Configuracion General
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Informacion basica de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-white">
                      Nombre del sitio
                    </Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteUrl" className="text-white">
                      URL del sitio
                    </Label>
                    <Input
                      id="siteUrl"
                      value={settings.general.siteUrl}
                      onChange={(e) => updateSetting('general', 'siteUrl', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail" className="text-white">
                      Email de soporte
                    </Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-white">
                      Zona horaria
                    </Label>
                    <Input
                      id="timezone"
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  Preferencias de Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Notificaciones por email</Label>
                    <p className="text-sm text-slate-400">Recibe alertas importantes por correo</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting('notifications', 'emailNotifications', checked)
                    }
                  />
                </div>

                <Separator className="bg-slate-800" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Nuevo proyecto</Label>
                    <p className="text-sm text-slate-400">Notificar cuando se crea un proyecto</p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyOnNewProject}
                    onCheckedChange={(checked) =>
                      updateSetting('notifications', 'notifyOnNewProject', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Pagos recibidos</Label>
                    <p className="text-sm text-slate-400">Notificar al recibir un pago</p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyOnPayment}
                    onCheckedChange={(checked) =>
                      updateSetting('notifications', 'notifyOnPayment', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Escalaciones</Label>
                    <p className="text-sm text-slate-400">Notificar cuando hay una escalacion</p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyOnEscalation}
                    onCheckedChange={(checked) =>
                      updateSetting('notifications', 'notifyOnEscalation', checked)
                    }
                  />
                </div>

                <Separator className="bg-slate-800" />

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl" className="text-white flex items-center gap-2">
                    <Webhook className="w-4 h-4" />
                    Webhook URL
                  </Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://..."
                    value={settings.notifications.webhookUrl}
                    onChange={(e) => updateSetting('notifications', 'webhookUrl', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    Recibe notificaciones en tiempo real via webhook
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-cyan-400" />
                  Integraciones
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Estado de las integraciones con servicios externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Stripe</p>
                        <p className="text-sm text-slate-400">Procesamiento de pagos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {settings.integrations.stripeTestMode && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                          Modo prueba
                        </Badge>
                      )}
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Conectado
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Resend</p>
                        <p className="text-sm text-slate-400">Envio de emails</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Conectado
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-500/20">
                        <Database className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">GitHub</p>
                        <p className="text-sm text-slate-400">Repositorios de codigo</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Conectado
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10">
                        <Cloud className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Vercel</p>
                        <p className="text-sm text-slate-400">Deployment automatico</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Conectado
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Bot className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">OpenAI</p>
                        <p className="text-sm text-slate-400">Generacion de codigo con IA</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Conectado
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Configuracion de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Autenticacion de dos factores</Label>
                    <p className="text-sm text-slate-400">Requerir 2FA para todos los admins</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(checked) =>
                      updateSetting('security', 'twoFactorRequired', checked)
                    }
                  />
                </div>

                <Separator className="bg-slate-800" />

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout" className="text-white">
                    Timeout de sesion (horas)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      updateSetting('security', 'sessionTimeout', parseInt(e.target.value) || 24)
                    }
                    className="bg-slate-800 border-slate-700 text-white w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist" className="text-white">
                    Lista blanca de IPs
                  </Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="192.168.1.1&#10;10.0.0.0/24"
                    value={settings.security.ipWhitelist}
                    onChange={(e) => updateSetting('security', 'ipWhitelist', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    rows={4}
                  />
                  <p className="text-xs text-slate-500">
                    Una IP o rango CIDR por linea. Deja vacio para permitir todas las IPs.
                  </p>
                </div>

                <Separator className="bg-slate-800" />

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium">Zona de peligro</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Las siguientes acciones son irreversibles y pueden afectar la operacion de
                        la plataforma.
                      </p>
                      <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                          Regenerar API Keys
                        </Button>
                        <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                          Cerrar todas las sesiones
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
