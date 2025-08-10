import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
      // Verificar si tiene acceso al dashboard como fallback
      if (user.permissions?.includes('READ_DASHBOARD')) {
        setIsRedirecting(true);
        return;
      }

      // Verificar si tiene al menos algún permiso básico
      const basicPermissions = ['READ_USERS', 'READ_ROLES', 'READ_PERMISSIONS', 'READ_AUDIT'];
      const hasBasicPermissions = basicPermissions.some(permission =>
        user.permissions?.includes(permission)
      );

      if (hasBasicPermissions) {
        // Redirigir al dashboard para mostrar acceso restringido
        setIsRedirecting(true);
        return;
      }

      // Usuario no tiene ningún permiso, cerrar sesión y redirigir
      logout();
      setIsRedirecting(true);
      return;
    }

    // Verificar rol requerido
    if (requireRole) {
      const requiredRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
      const hasRequiredRole = requiredRoles.some(role => user.role === role);

      if (!hasRequiredRole) {
        // Usuario no tiene el rol requerido, aplicar la misma lógica de fallback
        if (user.permissions?.includes('READ_DASHBOARD')) {
          setIsRedirecting(true);
          return;
        }

        const basicPermissions = ['READ_USERS', 'READ_ROLES', 'READ_PERMISSIONS', 'READ_AUDIT'];
        const hasBasicPermissions = basicPermissions.some(permission =>
          user.permissions?.includes(permission)
        );

        if (hasBasicPermissions) {
          setIsRedirecting(true);
          return;
        }

        logout();
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

    // Verificar si debe ir al dashboard o ser deslogueado
    if (user.permissions?.includes('READ_DASHBOARD')) {
      return <Navigate to="/dashboard" replace />;
    }

    const basicPermissions = ['READ_USERS', 'READ_ROLES', 'READ_PERMISSIONS', 'READ_AUDIT'];
    const hasBasicPermissions = basicPermissions.some(permission =>
      user.permissions?.includes(permission)
    );

    if (hasBasicPermissions) {
      return <Navigate to="/dashboard" replace />;
    }

    // No tiene permisos, ya se ejecutó logout, redirigir a welcome
    return <Navigate to="/" replace />;
  }

  // Usuario no autenticado
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Usuario autenticado y autorizado
  return <>{children}</>;
};

export default ProtectedRoute;
