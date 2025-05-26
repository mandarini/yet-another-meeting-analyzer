import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type UserRole = 'super_admin' | 'admin' | 'sales' | 'user';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_sign_in: string;
}

export const getUserRole = async (userId: string): Promise<UserRole> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }

  return data.role_id;
};

export const hasRole = async (userId: string, roles: UserRole[]): Promise<boolean> => {
  const userRole = await getUserRole(userId);
  return roles.includes(userRole);
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  return hasRole(userId, ['super_admin', 'admin']);
};

export const modifyUserRole = async (
  userId: string,
  newRole: UserRole,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if current user is admin
    const isCurrentUserAdmin = await isAdmin(currentUserId);
    if (!isCurrentUserAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if target user is super_admin
    const targetUserRole = await getUserRole(userId);
    if (targetUserRole === 'super_admin' && currentUserId !== userId) {
      return { success: false, error: 'Cannot modify super_admin role' };
    }

    // Update role
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role_id: newRole })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: currentUserId,
      action: 'modify_role',
      details: {
        target_user: userId,
        old_role: targetUserRole,
        new_role: newRole
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error modifying user role:', error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async (): Promise<UserWithRole[]> => {
  const { data, error } = await supabase
    .from('auth.users')
    .select(`
      id,
      email,
      created_at,
      last_sign_in_at,
      user_roles (
        role_id
      )
    `);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data.map((user: any) => ({
    id: user.id,
    email: user.email,
    role: user.user_roles?.[0]?.role_id || 'user',
    created_at: user.created_at,
    last_sign_in: user.last_sign_in_at
  }));
};