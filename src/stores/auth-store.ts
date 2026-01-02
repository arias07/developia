import { create } from 'zustand';
import type { Profile, UserRole } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // Computed
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isClient: () => boolean;
  isTeamMember: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setProfile: (profile) => set({ profile }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () =>
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  hasRole: (roles) => {
    const { profile } = get();
    return profile ? roles.includes(profile.role) : false;
  },

  isAdmin: () => {
    const { profile } = get();
    return profile?.role === 'admin';
  },

  isClient: () => {
    const { profile } = get();
    return profile?.role === 'client';
  },

  isTeamMember: () => {
    const { profile } = get();
    const teamRoles: UserRole[] = ['admin', 'project_manager', 'developer', 'designer', 'consultant'];
    return profile ? teamRoles.includes(profile.role) : false;
  },
}));
