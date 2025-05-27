import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { getUserRole } from '../lib/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setError: (error: string | null) => void;
  setState: (state: Partial<AuthState>) => void;
}

const MAX_ROLE_FETCH_RETRIES = 3;
const ROLE_FETCH_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchUserRoleWithRetry = async (userId: string, retries = MAX_ROLE_FETCH_RETRIES): Promise<string> => {
  try {
    const role = await getUserRole(userId);
    if (role) return role;
    throw new Error('No role found');
  } catch {
    if (retries > 0) {
      await delay(ROLE_FETCH_DELAY);
      return fetchUserRoleWithRetry(userId, retries - 1);
    }
    console.warn('Failed to fetch user role after retries, using default role');
    return 'user';
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  error: null,

  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const role = await fetchUserRoleWithRetry(session.user.id);
        set({ user: session.user, session, role, loading: false });
      } else {
        set({ user: null, session: null, role: null, loading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ error: 'Failed to initialize authentication', loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      set({ error: 'Failed to sign in with Google', loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null, role: null, loading: false });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: 'Failed to sign out', loading: false });
    }
  },

  setError: (error: string | null) => set({ error }),
  setState: (state: Partial<AuthState>) => set(state)
}));

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      const role = await fetchUserRoleWithRetry(session.user.id);
      store.setState({ user: session.user, session, role, loading: false });
    } catch (error) {
      console.error('Error handling auth state change:', error);
      store.setState({ error: 'Failed to handle authentication state change', loading: false });
    }
  } else if (event === 'SIGNED_OUT') {
    store.setState({ user: null, session: null, role: null, loading: false });
  }
});