import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

export const useRoleBasedNavigation = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const navigateBasedOnRole = () => {
    if (!user) {
      navigate('/');
      return;
    }

    console.log('🔄 Navegación basada en roles:', {
      role: user.role,
      permissions: user.permissions,
      hasReadDashboard: hasPermission('READ_DASHBOARD'),
      hasReadPayroll: hasPermission('READ_PAYROLL')
    });

    // Si el usuario es empleado (tiene permisos de nómina pero NO tiene permisos de dashboard completo)
    if (user.role === 'Empleado' || (!hasPermission('READ_DASHBOARD') && hasPermission('READ_PAYROLL'))) {
      console.log('👤 Empleado detectado - redirigiendo a /payroll');
      navigate('/payroll');
      return;
    }

    // Para administradores y otros roles con permisos de dashboard
    if (hasPermission('READ_DASHBOARD') || hasPermission('READ_USERS') || hasPermission('READ_ROLES')) {
      console.log('👨‍💼 Admin detectado - redirigiendo a /dashboard');
      navigate('/dashboard');
      return;
    }

    // Fallback para usuarios sin permisos específicos
    console.log('🔄 Fallback - redirigiendo a /payroll');
    navigate('/payroll');
  };

  const getDefaultRoute = (): string => {
    if (!user) return '/';

    // Si el usuario es empleado
    if (user.role === 'Empleado' || (!hasPermission('READ_DASHBOARD') && hasPermission('READ_PAYROLL'))) {
      return '/payroll';
    }

    // Para administradores y otros roles
    if (hasPermission('READ_DASHBOARD') || hasPermission('READ_USERS') || hasPermission('READ_ROLES')) {
      return '/dashboard';
    }

    // Fallback
    return '/payroll';
  };

  return {
    navigateBasedOnRole,
    getDefaultRoute
  };
};
