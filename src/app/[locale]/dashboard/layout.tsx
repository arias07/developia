'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { Profile } from '@/types/database';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const { setUser, setProfile, setLoading, profile, isLoading, user } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

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

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

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
  }, [router, locale, setLoading, setProfile, setUser]);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar onLogout={handleLogout} />
      <div className="ml-64">
        <Header profile={profile} onLogout={handleLogout} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
