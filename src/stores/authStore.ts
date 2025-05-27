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
  handleAuthCallback: () => Promise<void>;
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
  } catch {
    if (retries > 0) {
      await delay(ROLE_FETCH_DELAY);
      return fetchUserRoleWithRetry(userId, retries - 1);
    }
  }
  // If we get here, either no role was found or all retries failed
  console.warn('Using default role: sales');
  return 'sales';
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
        // Only redirect to dashboard if we're on the login page
        if (window.location.pathname.includes('/login')) {
          window.location.href = '/dashboard';
        }
      } else {
        set({ user: null, session: null, role: null, loading: false });
        // Only redirect to login if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ error: 'Failed to initialize authentication', loading: false });
      // Only redirect to login if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: 'Failed to sign out', loading: false });
    }
  },

  handleAuthCallback: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = await fetchUserRoleWithRetry(session.user.id);
        set({ user: session.user, session, role, loading: false });
        // Only redirect to dashboard if we're on the login or callback page
        if (window.location.pathname.includes('/login') || window.location.pathname.includes('/auth/callback')) {
          window.location.href = '/dashboard';
        }
      } else {
        set({ user: null, session: null, role: null, loading: false });
        // Only redirect to login if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error handling auth callback:', error);
      // Check if we actually have a valid session before redirecting
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // If we have a valid session, try to continue with the flow
        const role = await fetchUserRoleWithRetry(session.user.id);
        set({ user: session.user, session, role, loading: false });
        if (window.location.pathname.includes('/login') || window.location.pathname.includes('/auth/callback')) {
          window.location.href = '/dashboard';
        }
      } else {
        // Only redirect to login if we truly have no session
        set({ error: 'Failed to handle authentication callback', loading: false });
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
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
      // Redirect to dashboard if we're on the login page
      if (window.location.pathname.includes('/login')) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      store.setState({ error: 'Failed to handle authentication state change', loading: false });
    }
  } else if (event === 'SIGNED_OUT') {
    store.setState({ user: null, session: null, role: null, loading: false });
    // Only redirect to login if we're not already on the login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  } else if (event === 'INITIAL_SESSION') {
    // Ensure loading state is cleared after initial session check
    store.setState({ loading: false });
  }
});