import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { syncFromCloud, setSyncUserId } from '../lib/planSync';

interface AuthState {
  user: User | null;
  initialized: boolean;
  init: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  init: () => {
    void supabase.auth.getSession().then(({ data }) => {
      set({ user: data.session?.user ?? null, initialized: true });
      if (data.session?.user) void syncFromCloud(data.session.user.id);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ user: session?.user ?? null, initialized: true });
      if (event === 'SIGNED_OUT') setSyncUserId(null);
      if (event === 'SIGNED_IN' && session?.user) void syncFromCloud(session.user.id);
    });
  },

  signInWithGoogle: async () => {
    const redirectTo = window.location.origin + import.meta.env.BASE_URL;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
