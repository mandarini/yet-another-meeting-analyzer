import { ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../lib/auth';

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const RequireAuth = ({ children, allowedRoles }: RequireAuthProps) => {
  const { role, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If no roles are specified, allow access to any user
  if (!allowedRoles) {
    return <>{children}</>;
  }

  // If roles are specified but role is not yet loaded, show loading
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying role...</p>
        </div>
      </div>
    );
  }

  // Check role-based access only for admin page
  if (!allowedRoles.includes(role as UserRole)) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default RequireAuth;