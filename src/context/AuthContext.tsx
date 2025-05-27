import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRole } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session, userRole, loading, error, signInWithGoogle, signOut } = useAuthStore();

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};