import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { getUserRole, UserRole } from '../lib/auth';

interface AuthState {
  session: Session | null;
  user: any | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  userRole: null,
  loading: true,
  error: null,

  initializeAuth: async () => {
    set({ loading: true });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const role = await getUserRole(session.user.id);
        set({ session, user: session.user, userRole: role, loading: false });
      } else {
        set({ session: null, user: null, userRole: null, loading: false });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          try {
            const role = await getUserRole(session.user.id);
            set({ session, user: session.user, userRole: role });
          } catch (error) {
            console.error('Auth error:', error);
            set({ 
              session: null, 
              user: null, 
              userRole: null,
              error: 'Authentication failed'
            });
          }
        } else {
          set({ session: null, user: null, userRole: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ error: 'Failed to initialize authentication', loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
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
      set({ session: null, user: null, userRole: null, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to sign out', loading: false });
    }
  },
}));