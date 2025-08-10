import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Search, Activity, Clock, User, Eye, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { activityService } from '../services/api';
import type { ActivityLog, PaginatedResponse } from '../types/auth';

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [currentPage, search]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await activityService.getAll(currentPage, 10, search);
      if (response.success && response.data) {
        setActivities(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        // Si no hay datos, mostrar array vacío
        setActivities([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      // En caso de error, mostrar array vacío
      setActivities([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getMockActivities = (): ActivityLog[] => [
    {
      id: '1',
      userId: 'user-1',
      userName: 'Juan Pérez',
      userEmail: 'juan@example.com',
      action: 'LOGIN',
      resource: 'AUTHENTICATION',
      details: 'Usuario inició sesión correctamente',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutos atrás
      status: 'success'
    },
    {
      id: '2',
      userId: 'user-2',
      userName: 'María García',
      userEmail: 'maria@example.com',
      action: 'CREATE_USER',
      resource: 'USERS',
      resourceId: 'user-5',
      details: 'Creó un nuevo usuario: Carlos López',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
      status: 'success'
    },
    {
      id: '3',
      userId: 'user-1',
      userName: 'Juan Pérez',
      userEmail: 'juan@example.com',
      action: 'UPDATE_ROLE',
      resource: 'ROLES',
      resourceId: 'role-3',
      details: 'Modificó permisos del rol Administrador',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
      status: 'success'
    },
    {
      id: '4',
      userId: 'user-3',
      userName: 'Ana Rodríguez',
      userEmail: 'ana@example.com',
      action: 'DELETE_PERMISSION',
      resource: 'PERMISSIONS',
      resourceId: 'perm-8',
      details: 'Eliminó el permiso READ_REPORTS',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      status: 'warning'
    },
    {
      id: '5',
      userId: 'user-4',
      userName: 'Luis Martínez',
      userEmail: 'luis@example.com',
      action: 'FAILED_LOGIN',
      resource: 'AUTHENTICATION',
      details: 'Intento de login fallido - credenciales incorrectas',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
      status: 'error'
    },
    {
      id: '6',
      userId: 'user-2',
      userName: 'María García',
      userEmail: 'maria@example.com',
      action: 'UPDATE_USER',
      resource: 'USERS',
      resourceId: 'user-5',
      details: 'Actualizó información del usuario Carlos López',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
      status: 'success'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(timestamp).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  };

  return (
    <ProtectedRoute requiredPermissions={["READ_AUDIT"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Registro de Actividad
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Monitorea todas las acciones realizadas en el sistema
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar actividades por usuario, acción o recurso..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Cargando actividades...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actividades</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No se encontraron actividades que coincidan con tu búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activities.map((activity, activityIdx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {activityIdx !== activities.length - 1 ? (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                  {getStatusIcon(activity.status)}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="flex items-center space-x-2">
                                      <User className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-900">
                                        {activity.userName}
                                      </span>
                                    </div>
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(activity.action)}`}
                                    >
                                      {activity.action}
                                    </span>
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}
                                    >
                                      {activity.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    <span className="font-medium">{activity.resource}</span>
                                    {activity.resourceId && (
                                      <span className="text-gray-400"> #{activity.resourceId}</span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {activity.details}
                                  </p>
                                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                                    {activity.ipAddress && (
                                      <span>IP: {activity.ipAddress}</span>
                                    )}
                                    <span>Email: {activity.userEmail}</span>
                                  </div>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {formatTimeAgo(activity.timestamp)}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
