import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, UserRole } from '@/store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  requiredRole,
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && user && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};