import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { getUserRole } from "../lib/auth";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const fetchUserRole = async (userId: string): Promise<string> => {
  try {
    const role = await getUserRole(userId);
    return role || "sales";
  } catch (error) {
    console.warn("Failed to fetch user role, using default:", error);
    return "sales";
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  error: null,

  signInWithGoogle: async () => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // Note: Don't set loading to false here - the auth callback will handle state updates
    } catch (error) {
      console.error("Google sign-in failed:", error);
      set({
        error: "Failed to sign in with Google",
        loading: false,
      });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Sign-out failed:", error);
      set({
        error: "Failed to sign out",
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

// Centralized auth state management
supabase.auth.onAuthStateChange(async (event, session) => {
  try {
    if (session?.user) {
      // User is signed in
      const role = await fetchUserRole(session.user.id);

      useAuthStore.setState({
        user: session.user,
        session,
        role,
        loading: false,
        error: null,
      });
    } else {
      // User is signed out
      useAuthStore.setState({
        user: null,
        session: null,
        role: null,
        loading: false,
        error: null,
      });
    }
  } catch (error) {
    console.error("Auth state change error:", error);
    useAuthStore.setState({
      error: "Authentication error occurred",
      loading: false,
    });
  }
});
