import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  /** Where to redirect if role is not allowed. Defaults to /dashboard */
  redirectTo?: string;
}

/**
 * RoleGuard — protects a route/page by role.
 *
 * If the authenticated user's role is not in allowedRoles,
 * they are redirected (default: /dashboard).
 *
 * Must be rendered inside AuthProvider and after authentication check.
 */
export function RoleGuard({ allowedRoles, children, redirectTo = '/dashboard' }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
