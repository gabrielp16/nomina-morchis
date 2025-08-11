import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRoleBasedNavigation } from '../../hooks/useRoleBasedNavigation';
import { Loading } from '../loading/loading';
import { Navigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermissions = [], 
  requireRole 
}) => {
  const { user, isLoading, logout } = useAuth();
  const { getDefaultRoute } = useRoleBasedNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Usuario no autenticado, redirigir a Welcome
      setIsRedirecting(true);
      return;
    }

    // Verificar permisos específicos requeridos
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        user.permissions?.includes(permission)
      );

      if (hasRequiredPermissions) {
        // Usuario tiene los permisos requeridos
        return;
      }

      // Usuario no tiene los permisos requeridos
      // Usar la lógica de navegación basada en roles para redirigir
      setIsRedirecting(true);
      return;
    }

    // Verificar rol requerido
    if (requireRole) {
      const requiredRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
      const hasRequiredRole = requiredRoles.some(role => user.role === role);

      if (!hasRequiredRole) {
        // Usuario no tiene el rol requerido, usar navegación basada en roles
        setIsRedirecting(true);
        return;
      }
    }
  }, [user, isLoading, requiredPermissions, requireRole, logout]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <Loading />;
  }

  // Si está en proceso de redirección, no renderizar nada
  if (isRedirecting) {
    if (!user) {
      return <Navigate to="/" replace />;
    }

    // Usar la ruta predeterminada basada en el rol
    const defaultRoute = getDefaultRoute();
    return <Navigate to={defaultRoute} replace />;
  }

  // Usuario no autenticado
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Usuario autenticado y autorizado
  return <>{children}</>;
};

export default ProtectedRoute;
