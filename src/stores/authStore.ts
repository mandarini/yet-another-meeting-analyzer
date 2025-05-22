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
  signOut: () => Promise<void>;
}

// Mock user data for development
const mockUser = {
  id: '123',
  email: 'demo@example.com',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: null
  }
};

const mockSession = {
  access_token: 'mock_token',
  refresh_token: 'mock_refresh',
  user: mockUser
} as Session;

const USE_MOCK_AUTH = !import.meta.env.VITE_SUPABASE_URL || true;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  error: null,

  initializeAuth: async () => {
    set({ loading: true });
    
    if (USE_MOCK_AUTH) {
      set({ 
        session: mockSession, 
        user: mockUser, 
        loading: false 
      });
      return;
    }

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
    
    if (USE_MOCK_AUTH) {
      set({ 
        session: mockSession, 
        user: mockUser, 
        loading: false 
      });
      return { success: true };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
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
    
    if (USE_MOCK_AUTH) {
      set({ session: null, user: null, loading: false });
      return;
    }
    
    try {
      await supabase.auth.signOut();
      set({ session: null, user: null, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to sign out', loading: false });
    }
  },
}));