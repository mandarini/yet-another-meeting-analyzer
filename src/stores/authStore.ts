import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: any | null;
  loading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithGithub: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  error: null,

  initializeAuth: async () => {
    set({ loading: true });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, loading: false });

      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          set({ session, user: session?.user ?? null });
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ error: 'Failed to initialize authentication', loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    
    try {
      const redirectTo = import.meta.env.PROD 
        ? 'https://yama-io.netlify.app/login'
        : `${window.location.origin}/login`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });
      
      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  signInWithGithub: async () => {
    set({ loading: true, error: null });
    
    try {
      const redirectTo = import.meta.env.PROD 
        ? 'https://yama-io.netlify.app/login'
        : `${window.location.origin}/login`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });
      
      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  signOut: async () => {
    set({ loading: true });
    
    try {
      await supabase.auth.signOut();
      set({ session: null, user: null, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to sign out', loading: false });
    }
  },
}));