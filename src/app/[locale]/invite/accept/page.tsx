'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  Mail,
  Briefcase,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { LocalizedLink } from '@/components/i18n';

const content = {
  es: {
    title: 'Invitación al Equipo',
    loading: 'Verificando invitación...',
    invalidToken: 'Invitación inválida',
    invalidTokenDesc: 'El enlace de invitación no es válido o ha expirado.',
    expiredToken: 'Invitación expirada',
    expiredTokenDesc: 'Esta invitación ha expirado. Contacta al administrador para una nueva invitación.',
    alreadyAccepted: 'Invitación ya aceptada',
    alreadyAcceptedDesc: 'Esta invitación ya ha sido utilizada.',
    welcomeTitle: '¡Estás invitado!',
    welcomeDesc: 'Has sido invitado a unirte al equipo de Devvy',
    role: 'Rol asignado',
    specializations: 'Especialidades',
    hourlyRate: 'Tarifa por hora',
    createAccount: 'Crear cuenta para aceptar',
    loginToAccept: 'Inicia sesión para aceptar',
    acceptInvite: 'Aceptar Invitación',
    accepting: 'Procesando...',
    successTitle: '¡Bienvenido al equipo!',
    successDesc: 'Tu cuenta ha sido configurada. Ahora puedes acceder al panel de freelancer.',
    goToDashboard: 'Ir al Dashboard',
    errorTitle: 'Error al aceptar',
    errorDesc: 'Ocurrió un error al procesar tu invitación. Por favor intenta de nuevo.',
    retry: 'Reintentar',
    backToHome: 'Volver al inicio',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    fullName: 'Nombre completo',
    passwordMismatch: 'Las contraseñas no coinciden',
    signUp: 'Crear cuenta',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    login: 'Iniciar sesión',
    admin: 'Administrador',
    project_manager: 'Project Manager',
    developer: 'Desarrollador',
    designer: 'Diseñador',
    consultant: 'Consultor',
    freelancer: 'Freelancer',
  },
  en: {
    title: 'Team Invitation',
    loading: 'Verifying invitation...',
    invalidToken: 'Invalid invitation',
    invalidTokenDesc: 'The invitation link is invalid or has expired.',
    expiredToken: 'Invitation expired',
    expiredTokenDesc: 'This invitation has expired. Contact the admin for a new one.',
    alreadyAccepted: 'Invitation already accepted',
    alreadyAcceptedDesc: 'This invitation has already been used.',
    welcomeTitle: "You're invited!",
    welcomeDesc: "You've been invited to join the Devvy team",
    role: 'Assigned role',
    specializations: 'Specializations',
    hourlyRate: 'Hourly rate',
    createAccount: 'Create account to accept',
    loginToAccept: 'Login to accept',
    acceptInvite: 'Accept Invitation',
    accepting: 'Processing...',
    successTitle: 'Welcome to the team!',
    successDesc: 'Your account has been set up. You can now access the freelancer dashboard.',
    goToDashboard: 'Go to Dashboard',
    errorTitle: 'Error accepting',
    errorDesc: 'An error occurred processing your invitation. Please try again.',
    retry: 'Retry',
    backToHome: 'Back to home',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    fullName: 'Full name',
    passwordMismatch: 'Passwords do not match',
    signUp: 'Create account',
    alreadyHaveAccount: 'Already have an account?',
    login: 'Login',
    admin: 'Administrator',
    project_manager: 'Project Manager',
    developer: 'Developer',
    designer: 'Designer',
    consultant: 'Consultant',
    freelancer: 'Freelancer',
  },
};

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'success' | 'error';

interface InviteData {
  id: string;
  email: string;
  role: string;
  specializations: string[];
  hourly_rate?: number;
  status: string;
  expires_at: string;
}

export default function AcceptInvitePage() {
  const locale = useLocale();
  const t = content[locale as keyof typeof content] || content.es;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuthStore();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [processing, setProcessing] = useState(false);

  // Sign up form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [formError, setFormError] = useState('');

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        setStatus('invalid');
        return;
      }

      const inviteData = data as InviteData;
      setInvite(inviteData);
      setFormData((prev) => ({ ...prev, email: inviteData.email }));

      if (inviteData.status === 'accepted') {
        setStatus('accepted');
        return;
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      setStatus('valid');
    };

    verifyToken();
  }, [token]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError(t.passwordMismatch);
      return;
    }

    setProcessing(true);

    try {
      const supabase = getSupabaseClient();

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) {
        setFormError(authError.message);
        setProcessing(false);
        return;
      }

      if (authData.user) {
        // Accept the invite
        await acceptInvite(authData.user.id);
      }
    } catch {
      setFormError(t.errorDesc);
      setProcessing(false);
    }
  };

  const acceptInvite = async (userId: string) => {
    if (!invite) return;

    setProcessing(true);

    try {
      const supabase = getSupabaseClient();

      // Update user profile with role
      await supabase
        .from('profiles')
        .update({
          role: invite.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Create team member record
      const { data: teamMember } = await supabase
        .from('team_members')
        .insert({
          profile_id: userId,
          role: invite.role,
          specializations: invite.specializations,
          hourly_rate: invite.hourly_rate,
          availability_status: 'available',
          max_concurrent_projects: 3,
          rating: 5.0,
          completed_projects_count: 0,
        })
        .select()
        .single();

      // Update invite status
      await supabase
        .from('team_invites')
        .update({
          status: 'accepted',
          accepted_by: userId,
          team_member_id: teamMember?.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptAsLoggedIn = async () => {
    if (!user) return;
    await acceptInvite(user.id);
  };

  const getRoleLabel = (role: string) => {
    return t[role as keyof typeof t] || role;
  };

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-slate-400">{t.loading}</p>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t.invalidToken}</h2>
            <p className="text-slate-400 mb-6">{t.invalidTokenDesc}</p>
            <LocalizedLink href="/">
              <Button variant="outline">{t.backToHome}</Button>
            </LocalizedLink>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t.expiredToken}</h2>
            <p className="text-slate-400 mb-6">{t.expiredTokenDesc}</p>
            <LocalizedLink href="/">
              <Button variant="outline">{t.backToHome}</Button>
            </LocalizedLink>
          </div>
        );

      case 'accepted':
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t.alreadyAccepted}</h2>
            <p className="text-slate-400 mb-6">{t.alreadyAcceptedDesc}</p>
            <LocalizedLink href="/login">
              <Button>{t.login}</Button>
            </LocalizedLink>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.successTitle}</h2>
            <p className="text-slate-400 mb-6">{t.successDesc}</p>
            <LocalizedLink href="/freelancer">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                {t.goToDashboard}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </LocalizedLink>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
            <p className="text-slate-400 mb-6">{t.errorDesc}</p>
            <Button onClick={() => setStatus('valid')} variant="outline">
              {t.retry}
            </Button>
          </div>
        );

      case 'valid':
        return (
          <>
            {/* Invite Details */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <UserPlus className="w-8 h-8 text-purple-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">{t.welcomeTitle}</h2>
              <p className="text-slate-400">{t.welcomeDesc}</p>
            </div>

            {/* Invite Info Card */}
            {invite && (
              <div className="bg-slate-900/50 rounded-lg p-6 mb-8 border border-slate-700">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span>{t.email}</span>
                    </div>
                    <span className="text-white">{invite.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Briefcase className="w-4 h-4" />
                      <span>{t.role}</span>
                    </div>
                    <Badge className="bg-purple-500 text-white">{getRoleLabel(invite.role)}</Badge>
                  </div>

                  {invite.specializations && invite.specializations.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t.specializations}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {invite.specializations.map((spec) => (
                          <Badge key={spec} variant="outline" className="border-slate-600 text-slate-300">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {invite.hourly_rate && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span>{t.hourlyRate}</span>
                      </div>
                      <span className="text-emerald-400 font-bold">${invite.hourly_rate}/hr</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Section */}
            {user ? (
              // User is logged in
              <div className="space-y-4">
                <Button
                  onClick={handleAcceptAsLoggedIn}
                  disabled={processing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.accepting}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t.acceptInvite}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // User needs to sign up
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.fullName}</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">{t.email}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-slate-900 border-slate-700 text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">{t.password}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">{t.confirmPassword}</Label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="bg-slate-900 border-slate-700"
                  />
                </div>

                {formError && (
                  <p className="text-red-400 text-sm">{formError}</p>
                )}

                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.accepting}
                    </>
                  ) : (
                    t.signUp
                  )}
                </Button>

                <p className="text-center text-sm text-slate-400">
                  {t.alreadyHaveAccount}{' '}
                  <LocalizedLink href="/login" className="text-purple-400 hover:text-purple-300">
                    {t.login}
                  </LocalizedLink>
                </p>
              </form>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
