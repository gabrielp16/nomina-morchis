import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Plus, Search, Edit, Trash2, Key, Minus, Shield, ShieldOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { CreatePermissionModal } from '../components/permissions/CreatePermissionModal';
import { EditPermissionModal } from '../components/permissions/EditPermissionModal';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../context/ToastContext';
import { permissionService } from '../services/api';
import type { Permission, PaginatedResponse } from '../types/auth';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  
  const confirm = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadPermissions();
  }, [currentPage, search]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await permissionService.getAll(currentPage, 10, search);
      if (response.success && response.data) {
        setPermissions(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        showError(response.error || 'Error al cargar los permisos');
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      showError('Error al cargar los permisos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: '¿Eliminar permiso?',
      message: '¿Estás seguro de que deseas eliminar este permiso? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmVariant: 'destructive'
    });

    if (confirmed) {
      try {
        const response = await permissionService.delete(id);
        if (response.success) {
          success('Permiso eliminado exitosamente');
          loadPermissions();
        } else {
          showError(response.error || 'Error al eliminar el permiso');
        }
      } catch (error) {
        console.error('Error deleting permission:', error);
        showError('Error al eliminar el permiso');
      }
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = isActive 
        ? await permissionService.deactivate(id)
        : await permissionService.activate(id);
      
      if (response.success) {
        success(`Permiso ${isActive ? 'desactivado' : 'activado'} exitosamente`);
        loadPermissions();
      } else {
        showError(response.error || 'Error al cambiar el estado del permiso');
      }
    } catch (error) {
      console.error('Error toggling permission status:', error);
      showError('Error al cambiar el estado del permiso');
    }
  };

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedPermission(null);
  };

  const getActionColor = (accion: string) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      READ: 'bg-blue-100 text-blue-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      MANAGE: 'bg-purple-100 text-purple-800',
    };
    return colors[accion as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <ProtectedRoute requiredPermissions={["READ_PERMISSIONS"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Gestión de Permisos
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Administra los permisos del sistema y sus acciones
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Permiso
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar permisos..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Permissions Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Cargando permisos...</p>
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No se encontraron permisos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Permiso
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Módulo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {permissions.map((permission) => (
                          <tr key={permission.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <Key className="h-5 w-5 text-white" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {permission.nombre}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Creado {new Date(permission.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {permission.modulo}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(permission.accion)}`}
                              >
                                {permission.accion}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {permission.descripcion || 'Sin descripción'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  permission.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {permission.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleActive(permission.id, permission.isActive)}
                                >
                                  {permission.isActive ? (
                                    <ShieldOff className="h-4 w-4" />
                                  ) : (
                                    <Shield className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(permission)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(permission.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

      {/* Modales */}
      <CreatePermissionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadPermissions}
      />

      {selectedPermission && (
        <EditPermissionModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={loadPermissions}
          permission={selectedPermission}
        />
      )}

      <ConfirmDialog
        isOpen={confirm.confirmState.isOpen}
        title={confirm.confirmState.title}
        message={confirm.confirmState.message}
        confirmText={confirm.confirmState.confirmText}
        cancelText={confirm.confirmState.cancelText}
        confirmVariant={confirm.confirmState.confirmVariant}
        onConfirm={confirm.handleConfirm}
        onCancel={confirm.handleCancel}
      />
    </ProtectedRoute>
  );
}
