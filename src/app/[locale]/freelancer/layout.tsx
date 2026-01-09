'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FreelancerSidebar } from '@/components/freelancer/sidebar';
import { FreelancerHeader } from '@/components/freelancer/header';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { FreelancerProfile } from '@/types/database';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalizedLink } from '@/components/i18n';

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const { setUser, setLoading, isLoading, user } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const fetchUser = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      setUser(user);

      // Fetch freelancer profile linked to this user
      const { data: freelancerData, error } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !freelancerData) {
        // User is not a registered freelancer
        setAccessDenied(true);
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Check if freelancer is approved
      if (freelancerData.status !== 'approved') {
        setAccessDenied(true);
        setLoading(false);
        setInitialized(true);
        return;
      }

      setFreelancerProfile(freelancerData as FreelancerProfile);
      setLoading(false);
      setInitialized(true);
    };

    fetchUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: unknown } | null) => {
      if (!session) {
        router.push(`/${locale}/login`);
      } else {
        setUser(session.user as Parameters<typeof setUser>[0]);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, locale, setLoading, setUser]);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {locale === 'es' ? 'Acceso Denegado' : 'Access Denied'}
          </h1>
          <p className="text-slate-400 mb-6">
            {locale === 'es'
              ? 'No tienes acceso al panel de freelancer. Si ya aplicaste, tu solicitud puede estar en proceso de revisión.'
              : "You don't have access to the freelancer panel. If you already applied, your application may be under review."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LocalizedLink href="/careers/apply">
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                {locale === 'es' ? 'Aplicar como Freelancer' : 'Apply as Freelancer'}
              </Button>
            </LocalizedLink>
            <LocalizedLink href="/">
              <Button variant="outline" className="border-slate-700 text-slate-300 w-full sm:w-auto">
                {locale === 'es' ? 'Volver al inicio' : 'Back to Home'}
              </Button>
            </LocalizedLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <FreelancerSidebar onLogout={handleLogout} />
      <div className="ml-64">
        <FreelancerHeader profile={freelancerProfile} onLogout={handleLogout} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
