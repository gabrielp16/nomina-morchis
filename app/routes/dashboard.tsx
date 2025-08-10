import { useAuth } from "../context/AuthContext";
import { Users, Shield, Key, BarChart3 } from "lucide-react";
import { dashboardApi } from "../services/api";
import { useState, useEffect, useRef } from "react";
import type { DashboardStats, RecentActivity } from "../types/auth";
import { useNavigate, Link } from "react-router";

export function meta() {
  return [
    { title: "Morchis Nómina - Dashboard" },
    { name: "description", content: "Panel de control del sistema de nómina" },
  ];
}

export default function Dashboard() {
  const { isAuthenticated, user, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Si no está autenticado, redirigir al home
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Verificar permisos mínimos para acceder al dashboard
    const hasBasicPermissions = hasPermission('READ_DASHBOARD') || 
                               hasPermission('READ_USERS') || 
                               hasPermission('READ_ROLES') || 
                               hasPermission('READ_PERMISSIONS');

    if (!hasBasicPermissions) {
      // Si no tiene ningún permiso básico, cerrar sesión y redirigir
      console.log('❌ Usuario sin permisos suficientes, cerrando sesión');
      logout();
      navigate('/');
      return;
    }

    // Si no tiene permiso específico para dashboard pero tiene otros permisos, 
    // podría implementarse una página de acceso restringido aquí
    if (!hasPermission('READ_DASHBOARD') && hasBasicPermissions) {
      // Por ahora permitimos acceso si tiene otros permisos básicos
      console.log('⚠️ Usuario con permisos limitados accediendo al dashboard');
    }
    
    // Solo cargar datos si no los tenemos ya y no estamos cargando
    if (!stats && !isLoadingRef.current) {
      loadDashboardData();
    }
  }, [isAuthenticated, navigate, stats, hasPermission, logout]);

  const loadDashboardData = async () => {
    if (isLoadingRef.current) return; // Evitar múltiples llamadas
    
    // Solo cargar estadísticas si tiene permiso completo de dashboard
    if (!hasPermission('READ_DASHBOARD')) {
      setLoading(false);
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      // Cargar estadísticas del dashboard
      const statsResponse = await dashboardApi.getStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        throw new Error('Error al cargar estadísticas');
      }

      // Cargar actividades recientes si tiene permisos
      if (hasPermission('READ_AUDIT')) {
        const activitiesResponse = await dashboardApi.getRecentActivities(5);
        if (activitiesResponse.success && activitiesResponse.data) {
          setRecentActivities(activitiesResponse.data);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (ya se redirige)
  if (!isAuthenticated) {
    return null;
  }

  // Verificar si el usuario tiene acceso restringido
  const hasLimitedAccess = !hasPermission('READ_DASHBOARD') && 
                          (hasPermission('READ_USERS') || 
                           hasPermission('READ_ROLES') || 
                           hasPermission('READ_PERMISSIONS'));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">            
            <h1 className="text-3xl font-bold text-gray-900">
              ¡Bienvenido, {user?.name}!
            </h1>
            <p className="mt-2 text-gray-600">
              {hasLimitedAccess 
                ? "Tu acceso al sistema está limitado según tus permisos"
                : "Gestiona tu sistema de nómina desde este panel de control"
              }
            </p>
          </div>

          {/* Mensaje de acceso restringido */}
          {hasLimitedAccess && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Acceso Restringido
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    Tu cuenta tiene permisos limitados. Solo puedes acceder a ciertas funcionalidades del sistema.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error al cargar datos
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards - Solo mostrar si tiene permiso completo de dashboard */}
          {hasPermission('READ_DASHBOARD') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {hasPermission('READ_USERS') && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Usuarios Activos
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {`${stats?.users.total || 0}`}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link to="/users" className="font-medium text-blue-700 hover:text-blue-900">
                        &gt; Ver todos los usuarios
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {hasPermission('READ_ROLES') && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Roles Configurados
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats?.roles.total || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link to="/roles" className="font-medium text-green-700 hover:text-green-900">
                        &gt; Gestionar roles
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {hasPermission('READ_PERMISSIONS') && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Key className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Permisos Activos
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats?.permissions.total || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link to="/permissions" className="font-medium text-purple-700 hover:text-purple-900">
                        &gt; Ver permisos
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Actividad Reciente
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {`${stats?.activities.total || 0}`}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link to="/activity" className="font-medium text-yellow-700 hover:text-yellow-900">
                      &gt; Ver actividad
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acciones disponibles para usuarios con acceso restringido */}
          {hasLimitedAccess && (
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Funciones Disponibles
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Estas son las acciones que puedes realizar con tu nivel de acceso actual.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hasPermission('READ_USERS') && (
                    <Link
                      to="/users"
                      className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 hover:border-gray-400"
                    >
                      <div>
                        <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                          <Users className="h-6 w-6" />
                        </span>
                      </div>
                      <div className="mt-8">
                        <h3 className="text-lg font-medium">
                          <span className="absolute inset-0" aria-hidden="true" />
                          Ver Usuarios
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Consultar información de usuarios del sistema
                        </p>
                      </div>
                    </Link>
                  )}

                  {hasPermission('READ_ROLES') && (
                    <Link
                      to="/roles"
                      className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg border border-gray-300 hover:border-gray-400"
                    >
                      <div>
                        <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                          <Shield className="h-6 w-6" />
                        </span>
                      </div>
                      <div className="mt-8">
                        <h3 className="text-lg font-medium">
                          <span className="absolute inset-0" aria-hidden="true" />
                          Ver Roles
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Consultar roles configurados en el sistema
                        </p>
                      </div>
                    </Link>
                  )}

                  {hasPermission('READ_PERMISSIONS') && (
                    <Link
                      to="/permissions"
                      className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg border border-gray-300 hover:border-gray-400"
                    >
                      <div>
                        <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                          <Key className="h-6 w-6" />
                        </span>
                      </div>
                      <div className="mt-8">
                        <h3 className="text-lg font-medium">
                          <span className="absolute inset-0" aria-hidden="true" />
                          Ver Permisos
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Consultar permisos disponibles en el sistema
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activities */}
          {hasPermission('READ_AUDIT') && recentActivities.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Actividad Reciente
                </h3>
                <div className="mt-5">
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {recentActivities.map((activity, index) => (
                        <li key={index}>
                          <div className="relative pb-8">
                            {index !== recentActivities.length - 1 && (
                              <span
                                className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex items-start space-x-3">
                              <div className="relative">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  activity.status === 'success' ? 'bg-green-500' :
                                  activity.status === 'warning' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}>
                                  <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div>
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900">
                                      {activity.userName}
                                    </span>{' '}
                                    <span className="text-gray-500">
                                      {activity.action} en {activity.resource}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-sm text-gray-500">
                                    {activity.details}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    {new Date(activity.timestamp).toLocaleString('es-ES')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/activity"
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Ver todas las actividades
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
